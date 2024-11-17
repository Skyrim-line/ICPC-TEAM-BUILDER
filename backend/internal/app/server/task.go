package server

import (
	"ICPC/internal/pkg/constant"
	"ICPC/internal/pkg/crontab"
	"ICPC/internal/pkg/log"
	"ICPC/internal/pkg/table"
	"ICPC/internal/pkg/types"
	"context"
	"fmt"
	"github.com/robfig/cron/v3"
	"gorm.io/gorm"
	"math/rand"
	"sort"
)

type ListTaskReq struct {
	Page
	Name string `form:"name"`
}
type ListTaskResp struct {
	Total int                 `json:"total"`
	Data  []*ListTaskRespData `json:"data"`
}

type ListTaskRespData struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	CreatorID   int    `json:"creator_id"`
	ExecuteTime string `json:"execute_time"`
}

func (s *Server) ListTask(ctx context.Context, req *ListTaskReq) (*ListTaskResp, error) {
	var tasks []*table.ScheduledTask

	if err := s.db.Where("name like ?", "%"+req.Name+"%").
		Offset(req.Offset()).Limit(req.Limit()).Order("id desc").Find(&tasks).Error; err != nil {
		log.Errorw("find tasks error", "err", err)
		return nil, fmt.Errorf("find tasks error, err = %w", err)
	}

	var total int64
	if err := getTx(ctx).Model(&table.ScheduledTask{}).Where("name like ?", "%"+req.Name+"%").Count(&total).Error; err != nil {
		log.Errorw("tx.Count() error", "err", err)
		return nil, fmt.Errorf("tx.Count() error, err = %w", err)
	}

	respTasks := make([]*ListTaskRespData, 0, len(tasks))
	for _, v := range tasks {
		tmp := &ListTaskRespData{
			ID:          v.ID,
			Name:        v.Name,
			CreatorID:   v.CreatorID,
			ExecuteTime: v.ExecuteTime,
		}
		respTasks = append(respTasks, tmp)
	}

	resp := &ListTaskResp{
		Total: int(total),
		Data:  respTasks,
	}

	return resp, nil
}

type AddTaskReq struct {
	Name        string `json:"name"`
	ExecuteTime string `json:"time"`
}

type AddTaskResp struct {
}

func (s *Server) AddTask(ctx context.Context, req *AddTaskReq) (*AddTaskResp, error) {
	id := ctx.Value(constant.CtxUserID).(int)
	t := &table.ScheduledTask{
		Name:        req.Name,
		CreatorID:   id,
		ExecuteTime: req.ExecuteTime,
	}
	if err := getTx(ctx).Create(&t).Error; err != nil {
		log.Errorw("tx.Create error", "err", err)
		return nil, fmt.Errorf("tx.Create error, err=%w", err)
	}
	err := s.addCronJob(t)

	if err != nil {
		log.Errorw("s.reloadTask() error", "err", err)
	}
	return &AddTaskResp{}, nil
}

type UpdateTaskReq struct {
	ID          int    `uri:"id"`
	Name        string `json:"name"`
	ExecuteTime string `json:"time"`
}

type UpdateTaskResp struct{}

func (s *Server) UpdateTask(ctx context.Context, req *UpdateTaskReq) (*UpdateTaskResp, error) {
	t := &table.ScheduledTask{
		Name:        req.Name,
		ExecuteTime: req.ExecuteTime,
	}
	if err := getTx(ctx).Where("id = ?", req.ID).Updates(&t).Error; err != nil {
		log.Errorw("tx.Updates error", "err", err)
		return nil, fmt.Errorf("tx.Updates error, err=%w", err)
	}
	eid, ok := s.entryMap.LoadAndDelete(t.ID)
	if ok {
		if err := s.crontab.Remove(eid.(cron.EntryID)); err != nil {
			return nil, fmt.Errorf("s.dcron.Remove() error, err = %w", err)
		}
	}
	err := s.addCronJob(t)
	if err != nil {
		return nil, fmt.Errorf("updateTaskCron error, err = %w", err)
	}
	return &UpdateTaskResp{}, nil
}

type RemoveTaskReq struct {
	ID int `uri:"id"`
}
type RemoveTaskResp struct {
}

func (s *Server) RemoveTask(ctx context.Context, req *RemoveTaskReq) (*RemoveTaskResp, error) {
	if err := getTx(ctx).Where("id = ?", req.ID).Delete(&table.ScheduledTask{}).Error; err != nil {
		log.Errorw("tx.Delete() task error", "err", err)
		return nil, fmt.Errorf("tx.Delete() task error, err=%w", err)
	}
	eid, ok := s.entryMap.LoadAndDelete(req.ID)
	if ok {
		if err := s.crontab.Remove(eid.(cron.EntryID)); err != nil {
			return nil, fmt.Errorf("s.dcron.Remove() error, err = %w", err)
		}
	}
	return &RemoveTaskResp{}, nil
}

func (s *Server) reloadTask() error {
	s.crontab.Flush()

	var tasks []*table.ScheduledTask
	if err := s.db.Find(&tasks).Error; err != nil {
		log.Errorw("find tasks error", "err", err)
		return fmt.Errorf("find tasks error, err = %w", err)
	}

	for _, v := range tasks {
		spec, err := crontab.ParseTimeSpec(v.ExecuteTime)
		if err != nil {
			log.Errorw("getSpec error", "err", err)
			return fmt.Errorf("getSpec error, err = %w", err)
		}

		entryID, err := s.crontab.AddFunc(spec, func() {
			crontabFunc(s.db.DB) // 将 s.db 传递给 crontabFunc
		})
		if err != nil {
			log.Errorw("crontab add func error", "err", err)
			return fmt.Errorf("crontab add func error, err = %w", err)
		}
		s.entryMap.Store(v.ID, entryID)
	}
	return nil
}

func crontabFunc(db *gorm.DB) {
	log.Debugw("Starting scheduled matching process")

	var universities []int
	var levels []int

	db.Table("account_and_profile").
		Select("DISTINCT account_and_profile.university_id").
		Joins("INNER JOIN account_and_match_info ON account_and_profile.account_id = account_and_match_info.account_id").
		Pluck("account_and_profile.university_id", &universities)

	db.Table("account_and_match_info").
		Select("DISTINCT level").
		Joins("INNER JOIN account_and_profile ON account_and_profile.account_id = account_and_match_info.account_id").
		Pluck("level", &levels)

	for _, universityID := range universities {
		for _, level := range levels {

			finalGroups, _, err := performMatching(db, universityID, level)
			if err != nil {
				log.Errorw("Matching process failed", "universityID", universityID, "level", level, "error", err)
				continue
			}

			if err := SaveGroupsToDatabase(db, universityID, finalGroups, level); err != nil {
				log.Errorw("Failed to update match result", "error", err)
			} else {
				log.Infow("Match process completed successfully for ", "university", universityID, "level", level)
			}
		}
	}
}

func performMatching(db *gorm.DB, universityID, level int) (map[string][]*table.AccountAndMatchInfo, []*table.AccountAndMatchInfo, error) {
	var dataList []*table.AccountAndMatchInfo

	err := db.Table("account_and_match_info").
		Select("account_and_match_info.*").
		Joins("INNER JOIN account_and_profile ON account_and_profile.account_id = account_and_match_info.account_id").
		Where("account_and_profile.university_id = ? AND account_and_match_info.level = ? AND account_and_match_info.ready_to_match = ? AND account_and_profile.matched = ?", universityID, level, true, false).
		Find(&dataList).Error
	if err != nil {
		return nil, nil, err
	}

	processed := make(map[int]bool)
	finalGroups := make(map[string][]*table.AccountAndMatchInfo)
	groupCounter := 1
	waitList := []*table.AccountAndMatchInfo{}

	preGroups := matchTeammatesWithThird(dataList, processed)
	for groupName, group := range preGroups {
		finalGroups[groupName] = group
		groupCounter++
	}

	dataList = sortByScore(dataList)
	for _, leader := range dataList {
		if processed[leader.ID] {
			continue
		}

		group := []*table.AccountAndMatchInfo{leader}
		processed[leader.ID] = true

		for len(group) < 3 {
			teammate := findTeammate(dataList, leader, processed)
			if teammate != nil {
				group = append(group, teammate)
				processed[teammate.ID] = true
			} else {
				break
			}
		}

		if len(group) == 3 {
			groupName := fmt.Sprintf("Group_%d", groupCounter)
			finalGroups[groupName] = group
			groupCounter++
		} else {
			for _, member := range group {
				processed[member.ID] = false
				waitList = append(waitList, member)
			}
		}
	}
	return finalGroups, waitList, nil
}

func matchTeammatesWithThird(dataList []*table.AccountAndMatchInfo, processed map[int]bool) map[string][]*table.AccountAndMatchInfo {
	groups := make(map[string][]*table.AccountAndMatchInfo)
	groupCounter := 1

	for _, data := range dataList {
		if processed[data.ID] || data.Teammate == 0 {
			continue
		}

		var teammate *table.AccountAndMatchInfo
		for _, d := range dataList {
			if d.ID == data.Teammate {
				teammate = d
				break
			}
		}

		if isAllProficiencyZero(data) && isAllProficiencyZero(teammate) {
			processed[data.ID] = true
			processed[teammate.ID] = true
			continue
		}

		proficiencyMap1 := getMaxProficiency(data)
		proficiencyMap2 := getMaxProficiency(teammate)
		language, proficiency, found := findSameMaxProficiency(proficiencyMap1, proficiencyMap2)

		var thirdMember *table.AccountAndMatchInfo
		if found {
			thirdMember = findThirdMember(dataList, data, teammate, language, proficiency, processed)
		}

		group := []*table.AccountAndMatchInfo{data, teammate}
		processed[data.ID] = true
		processed[teammate.ID] = true

		if thirdMember != nil {
			group = append(group, thirdMember)
			processed[thirdMember.ID] = true
		} else {
			chosenLanguage, chosenProficiency := chooseLanguageAndProficiency(proficiencyMap1, proficiencyMap2)
			thirdMember = findThirdMember(dataList, data, teammate, chosenLanguage, chosenProficiency, processed)
			if thirdMember != nil {
				group = append(group, thirdMember)
				processed[thirdMember.ID] = true
			}
		}

		groupName := fmt.Sprintf("Group_%d", groupCounter)
		groupCounter++
		groups[groupName] = group
	}
	return groups
}

func SaveGroupsToDatabase(db *gorm.DB, universityID int, groups map[string][]*table.AccountAndMatchInfo, level int) error {
	return db.Transaction(func(tx *gorm.DB) error {

		var maxGroupID int
		db.Table("group").Select("COALESCE(MAX(id), 0)").Scan(&maxGroupID)
		groupCounter := maxGroupID + 1

		for groupName, groupMembers := range groups {
			if len(groupMembers) == 3 {
				memberIDs := make([]int, len(groupMembers))
				for i, member := range groupMembers {
					memberIDs[i] = member.AccountID
				}

				// Define the group entry
				group := &table.Group{
					Name:         fmt.Sprintf("Group_%d", groupCounter),
					UniversityID: universityID,
					Members:      types.MemberList(memberIDs),
					Level:        level,
				}

				if err := tx.Create(group).Error; err != nil {
					return fmt.Errorf("error saving group %s to database: %w", groupName, err)
				}

				// Update Matched status for each member
				for _, memberID := range memberIDs {
					if err := tx.Model(&table.AccountAndProfile{}).Where("account_id = ?", memberID).Update("matched", true).Error; err != nil {
						return fmt.Errorf("error updating matched status for account %d: %w", memberID, err)
					}
				}

				log.Infow("Group has been saved with members", "groupName", groupName, "members", memberIDs)
				groupCounter++
			}
		}
		return nil
	})
}

func isAllProficiencyZero(user *table.AccountAndMatchInfo) bool {
	return user.ProficiencyC == 0 &&
		user.ProficiencyCpp == 0 &&
		user.ProficiencyJava == 0 &&
		user.ProficiencyPython == 0
}

func getMaxProficiency(user *table.AccountAndMatchInfo) map[string]int {
	return map[string]int{
		"C":      user.ProficiencyC,
		"C++":    user.ProficiencyCpp,
		"Java":   user.ProficiencyJava,
		"Python": user.ProficiencyPython,
	}
}

func findSameMaxProficiency(proficiency1, proficiency2 map[string]int) (string, int, bool) {
	for language, p1 := range proficiency1 {
		if p2, exists := proficiency2[language]; exists && p1 == p2 && p1 > 0 {
			return language, p1, true
		}
	}
	return "", 0, false
}

func findThirdMember(dataList []*table.AccountAndMatchInfo, user1, user2 *table.AccountAndMatchInfo, language string, proficiency int, processed map[int]bool) *table.AccountAndMatchInfo {
	for _, candidate := range dataList {
		if processed[candidate.ID] || candidate.Teammate != 0 {
			continue
		}
		if !isInBlacklist(user1.Blacklist, candidate.AccountID) && !isInBlacklist(user2.Blacklist, candidate.AccountID) {
			candidateProficiency := getMaxProficiency(candidate)
			if candidateProficiency[language] == proficiency {
				return candidate
			}
		}
	}
	return nil
}

func chooseLanguageAndProficiency(proficiencyMap1, proficiencyMap2 map[string]int) (string, int) {
	language1, proficiency1 := getMaxLanguage(proficiencyMap1)
	language2, proficiency2 := getMaxLanguage(proficiencyMap2)

	if proficiency1 == proficiency2 {
		if rand.Intn(2) == 0 {
			return language1, proficiency1
		}
		return language2, proficiency2
	}
	if proficiency1 > proficiency2 {
		return language1, proficiency1
	}
	return language2, proficiency2
}

func getMaxLanguage(proficiency map[string]int) (string, int) {
	maxLang := ""
	maxProficiency := -1
	for language, proficiency := range proficiency {
		if proficiency > maxProficiency {
			maxProficiency = proficiency
			maxLang = language
		}
	}
	return maxLang, maxProficiency
}

func findTeammate(dataList []*table.AccountAndMatchInfo, leader *table.AccountAndMatchInfo, processed map[int]bool) *table.AccountAndMatchInfo {
	for _, candidate := range dataList {
		if processed[candidate.ID] || candidate == leader {
			continue
		}
		if canBeTeammate([]*table.AccountAndMatchInfo{leader}, candidate) {
			return candidate
		}
	}
	return nil
}

func canBeTeammate(existingTeam []*table.AccountAndMatchInfo, candidate *table.AccountAndMatchInfo) bool {
	for _, member := range existingTeam {
		if isInBlacklist(member.Blacklist, candidate.AccountID) || isInBlacklist(candidate.Blacklist, member.AccountID) {
			return false
		}
	}
	return true
}

func isInBlacklist(blacklist []int, userID int) bool {
	for _, id := range blacklist {
		if id == userID {
			return true
		}
	}
	return false
}

func sortByScore(dataList []*table.AccountAndMatchInfo) []*table.AccountAndMatchInfo {
	sort.SliceStable(dataList, func(i, j int) bool {
		if calculateScore(dataList[i]) == calculateScore(dataList[j]) {
			return dataList[i].ID < dataList[j].ID
		}
		return calculateScore(dataList[i]) > calculateScore(dataList[j])
	})
	return dataList
}

func calculateScore(data *table.AccountAndMatchInfo) int {
	score := 0
	if data.ProficiencyProgrammingFundamentals {
		score++
	}
	if data.ProficiencyPrinciplesOfProgramming {
		score++
	}
	if data.ProficiencyDataStructuresAndAlgorithms {
		score++
	}
	if data.ProficiencyAlgorithmDesignAndAnalysis {
		score++
	}
	if data.ProficiencyProgrammingChallenges {
		score++
	}
	return score
}

func (s *Server) addCronJob(task *table.ScheduledTask) error {
	spec, err := crontab.ParseTimeSpec(task.ExecuteTime)
	if err != nil {
		return fmt.Errorf("get cron spec err, err = %w", err)
	}

	entryID, err := s.crontab.AddFunc(spec, func() {
		crontabFunc(s.db.DB) // 使用 s.db.DB
	})
	if err != nil {
		return fmt.Errorf("crontab add func error, err = %w", err)
	}
	s.entryMap.Store(task.ID, entryID)
	return nil
}
