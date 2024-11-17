package server

import (
	"ICPC/internal/pkg/constant"
	"ICPC/internal/pkg/log"
	"ICPC/internal/pkg/table"
	"context"
	"fmt"
	"time"
)

type GetGroupMeReq struct{}
type GetGroupMeResp struct {
	GroupID   int                     `json:"group_id"`
	GroupName string                  `json:"group_name"`
	Members   []*GetGroupMeMemberData `json:"members"`
}
type GetGroupMeMemberData struct {
	Id                                     int    `json:"id"`
	Name                                   string `json:"name"`
	RealName                               string `json:"real_name"`
	Email                                  string `json:"email"`
	ProficiencyC                           int    `json:"proficiency_c"`
	ProficiencyCpp                         int    `json:"proficiency_cpp"`
	ProficiencyJava                        int    `json:"proficiency_java"`
	ProficiencyPython                      int    `json:"proficiency_python"`
	ProficiencyProgrammingFundamentals     bool   `json:"proficiency_programming_fundamentals"`
	ProficiencyPrinciplesOfProgramming     bool   `json:"proficiency_principles_of_programming"`
	ProficiencyDataStructuresAndAlgorithms bool   `json:"proficiency_data_structures_and_algorithms"`
	ProficiencyAlgorithmDesignAndAnalysis  bool   `json:"proficiency_algorithm_design_and_analysis"`
	ProficiencyProgrammingChallenges       bool   `json:"proficiency_programming_challenges"`
	CompetitiveExperience                  string `json:"competitive_experience"`
}

func (s *Server) GetGroupMe(ctx context.Context, req *GetGroupMeReq) (*GetGroupMeResp, error) {
	id := ctx.Value(constant.CtxUserID).(int)
	var group *table.Group
	if err := getTx(ctx).
		Where("members::jsonb @> ? AND release = ?", fmt.Sprintf("[%d]", id), true).
		First(&group).Error; err != nil {
		log.Errorw("first group error", "err", err)
		return nil, fmt.Errorf("first group error, err=%s", err.Error())
	}

	members := make([]*GetGroupMeMemberData, 0)
	if err := getTx(ctx).
		Table("account").
		Select("account.id, account.name, account.email, profile.full_name, match_info.proficiency_c, match_info.proficiency_cpp, match_info.proficiency_java, match_info.proficiency_python, match_info.proficiency_programming_fundamentals, match_info.proficiency_principles_of_programming, match_info.proficiency_data_structures_and_algorithms, match_info.proficiency_algorithm_design_and_analysis, match_info.proficiency_programming_challenges, match_info.competitive_experience").
		Joins("LEFT JOIN account_and_profile AS profile ON account.id = profile.account_id").
		Joins("LEFT JOIN account_and_match_info AS match_info ON account.id = match_info.account_id").
		Where("account.id IN (?)", []int(group.Members)).
		Scan(&members).Error; err != nil {
		log.Errorw("get group members error", "err", err)
		return nil, fmt.Errorf("get group members error, err=%s", err.Error())
	}

	resp := &GetGroupMeResp{
		GroupID:   group.ID,
		GroupName: group.Name,
		Members:   members,
	}

	return resp, nil
}

type SetGroupMeNameReq struct {
	Name string `json:"name"`
}
type SetGroupMeNameResp struct{}

func (s *Server) SetGroupMeName(ctx context.Context, req *SetGroupMeNameReq) (*SetGroupMeNameResp, error) {
	id := ctx.Value(constant.CtxUserID).(int)
	var group *table.Group
	if err := getTx(ctx).
		Where("members::jsonb @> ?", fmt.Sprintf("[%d]", id)).
		First(&group).Error; err != nil {
		log.Errorw("first group error", "err", err)
		return nil, fmt.Errorf("first group error, err=%s", err.Error())
	}
	group.Name = req.Name
	if err := getTx(ctx).Updates(group).Error; err != nil {
		log.Errorw("update group error", "err", err)
		return nil, fmt.Errorf("update group error, err=%s", err.Error())
	}
	return &SetGroupMeNameResp{}, nil
}

type ListGroupReq struct {
	Page
}
type ListGroupResp struct {
	Total int                  `json:"total"`
	Data  []*ListGroupRespData `json:"data"`
}
type ListGroupRespData struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Level    int    `json:"level"`
	Released bool   `json:"released"`
	Members  []int  `json:"members"`
}

func (s *Server) ListGroup(ctx context.Context, req *ListGroupReq) (*ListGroupResp, error) {
	// get uniID
	var ap *table.AccountAndProfile
	if err := getTx(ctx).Where("account_id = ?", ctx.Value(constant.CtxUserID).(int)).First(&ap).Error; err != nil {
		log.Errorw("first account and profile error", "err", err)
		return nil, fmt.Errorf("get account and profile err, err=%s", err.Error())
	}

	var groups []*table.Group

	if err := s.db.Where("university_id = ?", ap.UniversityID).
		Offset(req.Offset()).Limit(req.Limit()).Order("id desc").Find(&groups).Error; err != nil {
		log.Errorw("find groups error", "err", err)
		return nil, fmt.Errorf("find groups error, err = %w", err)
	}

	var total int64
	if err := getTx(ctx).Model(&table.Group{}).Where("university_id = ?", ap.UniversityID).Count(&total).Error; err != nil {
		log.Errorw("tx.Count() error", "err", err)
		return nil, fmt.Errorf("tx.Count() error, err = %w", err)
	}

	respGroups := make([]*ListGroupRespData, 0, len(groups))
	for _, v := range groups {
		tmp := &ListGroupRespData{
			ID:       v.ID,
			Name:     v.Name,
			Level:    v.Level,
			Members:  v.Members,
			Released: v.Release,
		}
		respGroups = append(respGroups, tmp)
	}

	resp := &ListGroupResp{
		Total: int(total),
		Data:  respGroups,
	}

	return resp, nil
}

type GroupMemberData struct {
	ID                                     int    `json:"id"`
	Name                                   string `json:"name"`
	RealName                               string `json:"real_name"`
	Email                                  string `json:"email"`
	ProficiencyC                           int    `json:"proficiency_c"`
	ProficiencyCpp                         int    `json:"proficiency_cpp"`
	ProficiencyJava                        int    `json:"proficiency_java"`
	ProficiencyPython                      int    `json:"proficiency_python"`
	ProficiencyProgrammingFundamentals     bool   `json:"proficiency_programming_fundamentals"`
	ProficiencyPrinciplesOfProgramming     bool   `json:"proficiency_principles_of_programming"`
	ProficiencyDataStructuresAndAlgorithms bool   `json:"proficiency_data_structures_and_algorithms"`
	ProficiencyAlgorithmDesignAndAnalysis  bool   `json:"proficiency_algorithm_design_and_analysis"`
	ProficiencyProgrammingChallenges       bool   `json:"proficiency_programming_challenges"`
	Blacklist                              []int  `json:"blacklist"`
	Teammate                               int    `json:"teammate,omitempty"`
	CompetitiveExperience                  string `json:"competitive_experience"`
}
type GetGroupReq struct {
	ID int `uri:"id"`
}
type GetGroupResp struct {
	ID       int                `json:"id"`
	Name     string             `json:"name"`
	Level    int                `json:"level"`
	Released bool               `json:"released"`
	Member   []*GroupMemberData `json:"members"`
}

func (s *Server) GetGroup(ctx context.Context, req *GetGroupReq) (*GetGroupResp, error) {
	var group *table.Group
	if err := getTx(ctx).Where("id = ?", req.ID).First(&group).Error; err != nil {
		log.Errorw("first group err", "err", err)
		return nil, fmt.Errorf("first group err, err=%w", err)
	}

	groupSlice := []int(group.Members) // force converse

	memberAccounts := make([]*table.Account, 0, 3)
	if err := getTx(ctx).Where("id in (?)", groupSlice).Find(&memberAccounts).Error; err != nil {
		log.Errorw("find group member err", "err", err)
		return nil, fmt.Errorf("find group member err, err=%w", err)
	}
	memberProfiles := make([]*table.AccountAndProfile, 0, 3)
	if err := getTx(ctx).Where("account_id in ?", groupSlice).Find(&memberProfiles).Error; err != nil {
		log.Errorw("find group member profile err", "err", err)
		return nil, fmt.Errorf("find group member profile err, err=%w", err)
	}
	memberMatchingInfo := make([]*table.AccountAndMatchInfo, 0, 3)
	if err := getTx(ctx).Where("account_id in ?", groupSlice).Find(&memberMatchingInfo).Error; err != nil {
		log.Errorw("find group member match info err", "err", err)
		return nil, fmt.Errorf("find group member match info err, err=%w", err)
	}
	// Map the results into the response structure
	members := make([]*GroupMemberData, 0, len(memberAccounts))
	for _, account := range memberAccounts {
		var memberData *GroupMemberData
		// Find corresponding match info for this account
		for _, matchInfo := range memberMatchingInfo {
			for _, profile := range memberProfiles {
				if matchInfo.AccountID == account.ID && profile.AccountID == account.ID {
					memberData = &GroupMemberData{
						ID:                                     account.ID,
						Name:                                   account.Name,
						RealName:                               profile.FullName,
						Email:                                  account.Email,
						ProficiencyC:                           matchInfo.ProficiencyC,
						ProficiencyCpp:                         matchInfo.ProficiencyCpp,
						ProficiencyJava:                        matchInfo.ProficiencyJava,
						ProficiencyPython:                      matchInfo.ProficiencyPython,
						ProficiencyProgrammingFundamentals:     matchInfo.ProficiencyProgrammingFundamentals,
						ProficiencyPrinciplesOfProgramming:     matchInfo.ProficiencyPrinciplesOfProgramming,
						ProficiencyDataStructuresAndAlgorithms: matchInfo.ProficiencyDataStructuresAndAlgorithms,
						ProficiencyAlgorithmDesignAndAnalysis:  matchInfo.ProficiencyAlgorithmDesignAndAnalysis,
						ProficiencyProgrammingChallenges:       matchInfo.ProficiencyProgrammingChallenges,
						Blacklist:                              matchInfo.Blacklist,
						Teammate:                               matchInfo.Teammate, // Assuming TeammateData needs teammate ID
						CompetitiveExperience:                  matchInfo.CompetitiveExperience,
					}
					break
				}

			}
		}
		// Add the member data to the response slice
		if memberData != nil {
			members = append(members, memberData)
		}
	}

	// Create the final response
	resp := &GetGroupResp{
		ID:       group.ID,
		Name:     group.Name,
		Level:    group.Level,
		Released: group.Release,
		Member:   members,
	}

	return resp, nil
}

type AddGroupReq struct {
	Name    string `json:"name"`
	Members []int  `json:"members"`
	Level   int    `json:"level"`
}
type AddGroupResp struct {
}

func (s *Server) AddGroup(ctx context.Context, req *AddGroupReq) (*AddGroupResp, error) {
	var ap *table.AccountAndProfile
	if err := getTx(ctx).Where("account_id = ?", ctx.Value(constant.CtxUserID).(int)).First(&ap).Error; err != nil {
		log.Errorw("first account and profile error", "err", err)
		return nil, fmt.Errorf("get account and profile err, err=%s", err.Error())
	}

	tx := getTx(ctx)
	for _, memberID := range req.Members {
		tx = tx.Or("members::jsonb @> ?", fmt.Sprintf("[%d]", memberID))
	}

	var existingGroups []table.Group
	if err := tx.Find(&existingGroups).Error; err != nil {
		log.Errorw("check group members error", "err", err)
		return nil, fmt.Errorf("check group members err, err=%w", err)
	}

	if len(existingGroups) > 0 {
		log.Errorw("some members already exist in a group", "members", req.Members)
		return nil, fmt.Errorf("some members already exist in a group")
	}

	group := &table.Group{
		Name:         req.Name,
		Members:      req.Members,
		UniversityID: ap.UniversityID,
		Level:        req.Level,
	}

	if err := getTx(ctx).Create(group).Error; err != nil {
		log.Errorw("add group err", "err", err)
		return nil, fmt.Errorf("add group err, err=%w", err)
	}

	if err := getTx(ctx).
		Model(&table.AccountAndProfile{}).
		Where("account_id IN ?", req.Members).
		Update("matched", true).Error; err != nil {
		log.Errorw("update members matched error", "err", err)
		return nil, fmt.Errorf("update members matched err, err=%w", err)
	}
	return &AddGroupResp{}, nil
}

type DeleteGroupReq struct {
	ID int `uri:"id"`
}
type DeleteGroupResp struct{}

func (s *Server) DeleteGroup(ctx context.Context, req *DeleteGroupReq) (*DeleteGroupResp, error) {
	var ap *table.AccountAndProfile
	if err := getTx(ctx).Where("account_id = ?", ctx.Value(constant.CtxUserID).(int)).First(&ap).Error; err != nil {
		log.Errorw("first account and profile error", "err", err)
		return nil, fmt.Errorf("get account and profile err, err=%s", err.Error())
	}
	var g *table.Group
	if err := getTx(ctx).Where("id = ? and university_id = ?", req.ID, ap.UniversityID).First(&g).Error; err != nil {
		log.Errorw("first group err", "err", err)
		return nil, fmt.Errorf("first group err, err=%s", err.Error())
	}
	if err := getTx(ctx).Delete(&g).Error; err != nil {
		log.Errorw("delete group err", "err", err)
		return nil, fmt.Errorf("delete group err, err=%w", err)
	}
	if err := getTx(ctx).
		Model(&table.AccountAndProfile{}).
		Where("account_id IN ?", []int(g.Members)).
		Update("matched", false).Error; err != nil {
		log.Errorw("update members matched error", "err", err)
		return nil, fmt.Errorf("update members matched err, err=%w", err)
	}
	return &DeleteGroupResp{}, nil
}

type ListUnmatchedReq struct {
	Page
}
type ListUnmatchedResp struct {
	Total int                      `json:"total"`
	Data  []*ListUnmatchedRespData `json:"data"`
}
type ListUnmatchedRespData struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	RealName string `json:"real_name"`
	Email    string `json:"email"`
	Level    int    `json:"level"`
}

func (s *Server) ListUnmatchedStudent(ctx context.Context, req *ListUnmatchedReq) (*ListUnmatchedResp, error) {
	// get uniID
	var ap *table.AccountAndProfile
	if err := getTx(ctx).Where("account_id = ?", ctx.Value(constant.CtxUserID).(int)).First(&ap).Error; err != nil {
		log.Errorw("first account and profile error", "err", err)
		return nil, fmt.Errorf("get account and profile err, err=%s", err.Error())
	}

	var result []*ListUnmatchedRespData
	if err := getTx(ctx).
		Table("account").
		Select("account.id, account.name, account.email, profile.full_name as real_name, match_info.level").
		Joins("LEFT JOIN account_and_profile AS profile ON account.id = profile.account_id").
		Joins("LEFT JOIN account_and_match_info AS match_info ON account.id = match_info.account_id").
		Where("profile.university_id = ? AND profile.matched = ? AND match_info.ready_to_match = ?", ap.UniversityID, false, true).
		Offset(req.Offset()).Limit(req.Limit()).
		Order("account.id desc").
		Scan(&result).Error; err != nil {
		log.Errorw("get account error", "err", err)
		return nil, fmt.Errorf("get account err, err=%s", err.Error())
	}

	var total int64
	if err := getTx(ctx).
		Table("account").
		Joins("LEFT JOIN account_and_profile AS profile ON account.id = profile.account_id").
		Joins("LEFT JOIN account_and_match_info AS match_info ON account.id = match_info.account_id").
		Where("profile.university_id = ? AND profile.matched = ? AND match_info.ready_to_match = ?", ap.UniversityID, false, true).
		Count(&total).Error; err != nil {
		log.Errorw("get total count error", "err", err)
		return nil, fmt.Errorf("get total count err, err=%s", err.Error())
	}

	return &ListUnmatchedResp{
		Total: int(total),
		Data:  result,
	}, nil
}

type GetStuMatchingInfoReq struct {
	ID int `uri:"id"`
}
type GetStuMatchingInfoResp struct {
	Level                                  int    `json:"level"`
	ProficiencyC                           int    `json:"proficiency_c"`
	ProficiencyCpp                         int    `json:"proficiency_cpp"`
	ProficiencyJava                        int    `json:"proficiency_java"`
	ProficiencyPython                      int    `json:"proficiency_python"`
	ProficiencyProgrammingFundamentals     bool   `json:"proficiency_programming_fundamentals"`
	ProficiencyPrinciplesOfProgramming     bool   `json:"proficiency_principles_of_programming"`
	ProficiencyDataStructuresAndAlgorithms bool   `json:"proficiency_data_structures_and_algorithms"`
	ProficiencyAlgorithmDesignAndAnalysis  bool   `json:"proficiency_algorithm_design_and_analysis"`
	ProficiencyProgrammingChallenges       bool   `json:"proficiency_programming_challenges"`
	Blacklist                              []int  `json:"blacklist"`
	Teammate                               int    `json:"teammate,omitempty"`
	CompetitiveExperience                  string `json:"competitive_experience"`
}

func (s *Server) GetStuMatchingInfo(ctx context.Context, req *GetStuMatchingInfoReq) (*GetStuMatchingInfoResp, error) {
	var smi *table.AccountAndMatchInfo
	if err := getTx(ctx).Where("account_id = ?", req.ID).First(&smi).Error; err != nil {
		log.Errorw("get account and match info error", "err", err)
		return nil, fmt.Errorf("get account and match info err, err=%s", err.Error())
	}
	return &GetStuMatchingInfoResp{
		Level:                                  smi.Level,
		ProficiencyC:                           smi.ProficiencyC,
		ProficiencyCpp:                         smi.ProficiencyCpp,
		ProficiencyJava:                        smi.ProficiencyJava,
		ProficiencyPython:                      smi.ProficiencyPython,
		ProficiencyProgrammingFundamentals:     smi.ProficiencyProgrammingFundamentals,
		ProficiencyPrinciplesOfProgramming:     smi.ProficiencyPrinciplesOfProgramming,
		ProficiencyDataStructuresAndAlgorithms: smi.ProficiencyDataStructuresAndAlgorithms,
		ProficiencyAlgorithmDesignAndAnalysis:  smi.ProficiencyAlgorithmDesignAndAnalysis,
		ProficiencyProgrammingChallenges:       smi.ProficiencyProgrammingChallenges,
		Blacklist:                              smi.Blacklist,
		Teammate:                               smi.Teammate,
		CompetitiveExperience:                  smi.CompetitiveExperience,
	}, nil
}

type ReleaseGroupResultReq struct{}

type ReleaseGroupResultResp struct{}

func (s *Server) ReleaseGroupResult(ctx context.Context, req *ReleaseGroupResultReq) (*ReleaseGroupResultResp, error) {
	var ap *table.AccountAndProfile
	if err := getTx(ctx).Where("account_id = ?", ctx.Value(constant.CtxUserID).(int)).First(&ap).Error; err != nil {
		log.Errorw("first account and profile error", "err", err)
		return nil, fmt.Errorf("get account and profile err, err=%s", err.Error())
	}
	if err := getTx(ctx).Model(table.Group{}).Where("university_id = ?", ap.UniversityID).Update("release", true).Error; err != nil {
		log.Errorw("update group error", "err", err)
		return nil, fmt.Errorf("update group err, err=%s", err.Error())
	}
	return &ReleaseGroupResultResp{}, nil
}

type CheckIsReleasedReq struct {
}
type CheckIsReleasedResp struct {
	IsReleased bool `json:"is_released"`
}

func (s *Server) getCurrentPhrase(ctx context.Context) (*table.ScheduledTask, error) {
	now := time.Now().Format("2006-01-02 15:04:05")
	var recentTask *table.ScheduledTask
	if err := getTx(ctx).
		Where("TO_TIMESTAMP(execute_time, 'YYYY-MM-DD HH24:MI:SS') <= ?", now).
		Order("TO_TIMESTAMP(execute_time, 'YYYY-MM-DD HH24:MI:SS') DESC").
		First(&recentTask).Error; err != nil {
		log.Errorw("error fetching recent scheduled task", "err", err)
		return nil, fmt.Errorf("error fetching recent scheduled task, err=%s", err.Error())
	}
	return recentTask, nil
}

type GetCurrentEnrollPhraseReq struct{}
type GetCurrentEnrollPhraseResp struct {
	CurrentPhrase string `json:"current_phrase"`
}

func (s *Server) GetCurrentEnrollPhrase(ctx context.Context, req *GetCurrentEnrollPhraseReq) (*GetCurrentEnrollPhraseResp, error) {
	rt, err := s.getCurrentPhrase(ctx)
	if err != nil {
		log.Errorw("s.getCurrentPhrase() err", "err", err)
		return nil, fmt.Errorf("s.getCurrentPhrase(), err=%s", err.Error())
	}
	return &GetCurrentEnrollPhraseResp{CurrentPhrase: rt.Name}, nil
}
