package matcher

import (
	"ICPC/internal/pkg/table"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math"
	"sort"
)

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

func isInBlacklist(blacklist []int, userID int) bool {
	for _, id := range blacklist {
		if id == userID {
			return true
		}
	}
	return false
}

func canBeTeammate(existingTeam []*table.AccountAndMatchInfo, candidate *table.AccountAndMatchInfo) bool {
	for _, member := range existingTeam {
		if isInBlacklist(member.Blacklist, candidate.AccountID) || isInBlacklist(candidate.Blacklist, member.AccountID) {
			return false
		}
	}
	return true
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func ProcessLargeGroups(groups map[string][]*table.AccountAndMatchInfo) (map[string][][]*table.AccountAndMatchInfo, []*table.AccountAndMatchInfo) {
	var matchedGroups [][]*table.AccountAndMatchInfo
	var unmatchedUsers []*table.AccountAndMatchInfo

	for _, groupUsers := range groups {

		processed := make(map[int]bool)

		sort.SliceStable(groupUsers, func(i, j int) bool {
			return calculateScore(groupUsers[i]) > calculateScore(groupUsers[j])
		})

		var usersWithTeammate []*table.AccountAndMatchInfo
		var usersWithoutTeammate []*table.AccountAndMatchInfo

		for _, user := range groupUsers {
			if processed[user.AccountID] {
				continue
			}
			if user.Teammate != 0 {

				usersWithTeammate = append(usersWithTeammate, user)
				processed[user.AccountID] = true

				for _, candidate := range groupUsers {
					if candidate.AccountID == user.Teammate {
						usersWithTeammate = append(usersWithTeammate, candidate)
						processed[candidate.AccountID] = true
						break
					}
				}
			} else {

				usersWithoutTeammate = append(usersWithoutTeammate, user)
			}
		}

		for i := 0; i < len(usersWithTeammate); i += 2 {
			user1 := usersWithTeammate[i]
			user2 := usersWithTeammate[i+1]

			team := []*table.AccountAndMatchInfo{user1, user2}
			teamScore := (calculateScore(user1) + calculateScore(user2)) / 2

			var thirdPerson *table.AccountAndMatchInfo
			minScoreDiff := math.MaxInt32
			for _, candidate := range usersWithoutTeammate {
				if canBeTeammate(team, candidate) {
					scoreDiff := abs(calculateScore(candidate) - teamScore)
					if scoreDiff < minScoreDiff {
						minScoreDiff = scoreDiff
						thirdPerson = candidate
					}
				}
			}

			if thirdPerson != nil {
				team = append(team, thirdPerson)
				matchedGroups = append(matchedGroups, team)

				processed[thirdPerson.AccountID] = true

				usersWithoutTeammate = removeUser(usersWithoutTeammate, thirdPerson)
			} else {

				unmatchedUsers = append(unmatchedUsers, user1, user2)
			}
		}

		for i := 0; i < len(usersWithoutTeammate); i++ {
			if processed[usersWithoutTeammate[i].AccountID] {
				continue
			}

			team := []*table.AccountAndMatchInfo{usersWithoutTeammate[i]}
			processed[usersWithoutTeammate[i].AccountID] = true

			for j := i + 1; j < len(usersWithoutTeammate) && len(team) < 3; j++ {
				if !processed[usersWithoutTeammate[j].AccountID] && canBeTeammate(team, usersWithoutTeammate[j]) {
					team = append(team, usersWithoutTeammate[j])
					processed[usersWithoutTeammate[j].AccountID] = true
				}
			}

			if len(team) == 3 {
				matchedGroups = append(matchedGroups, team)
			} else {
				unmatchedUsers = append(unmatchedUsers, team...)
			}
		}
	}

	result := make(map[string][][]*table.AccountAndMatchInfo)
	result["matched"] = matchedGroups
	return result, unmatchedUsers
}

// Helper function to remove a user from a slice
func removeUser(users []*table.AccountAndMatchInfo, target *table.AccountAndMatchInfo) []*table.AccountAndMatchInfo {
	for i, user := range users {
		if user.AccountID == target.AccountID {
			return append(users[:i], users[i+1:]...)
		}
	}
	return users
}

func OutputGroupedDataFinal(groups map[string][][]*table.AccountAndMatchInfo, unmatched []*table.AccountAndMatchInfo) {

	for groupName, groupList := range groups {
		fileName := fmt.Sprintf("tool/output/%s.json", groupName)
		groupData := make([]Group, len(groupList))

		for i, users := range groupList {
			groupData[i] = Group{Users: users}
		}

		jsonData, err := json.MarshalIndent(groupData, "", "  ")
		if err != nil {
			fmt.Println("Error marshalling JSON for group", groupName, ":", err)
			continue
		}

		err = ioutil.WriteFile(fileName, jsonData, 0644)
		if err != nil {
			fmt.Println("Error writing to file:", fileName, ":", err)
			continue
		}

		fmt.Println("Group", groupName, "saved to", fileName)
	}

	unmatchedFile := "tool/output/unmatched.json"
	unmatchedData := Group{Users: unmatched}
	jsonData, err := json.MarshalIndent(unmatchedData, "", "  ")
	if err != nil {
		fmt.Println("Error marshalling JSON for unmatched users:", err)
		return
	}
	err = ioutil.WriteFile(unmatchedFile, jsonData, 0644)
	if err != nil {
		fmt.Println("Error writing to file:", unmatchedFile, ":", err)
		return
	}
	fmt.Println("Unmatched users written to", unmatchedFile)
}
