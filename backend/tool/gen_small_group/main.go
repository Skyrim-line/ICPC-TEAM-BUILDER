package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math"
	"sort"
	"strings"
)

type Data struct {
	ID                                     int   `json:"id"`
	ProficiencyC                           int   `json:"proficiency_c"`
	ProficiencyCpp                         int   `json:"proficiency_cpp"`
	ProficiencyJava                        int   `json:"proficiency_java"`
	ProficiencyPython                      int   `json:"proficiency_python"`
	ProficiencyProgrammingFundamentals     bool  `json:"proficiency_programming_fundamentals"`
	ProficiencyPrinciplesOfProgramming     bool  `json:"proficiency_principles_of_programming"`
	ProficiencyDataStructuresAndAlgorithms bool  `json:"proficiency_data_structures_and_algorithms"`
	ProficiencyAlgorithmDesignAndAnalysis  bool  `json:"proficiency_algorithm_design_and_analysis"`
	ProficiencyProgrammingChallenges       bool  `json:"proficiency_programming_challenges"`
	Teammate                               int   `json:"teammate,omitempty"`  // Teammate ID
	Blacklist                              []int `json:"blacklist,omitempty"` // Blacklisted User IDs
}

type Group struct {
	Users []Data `json:"users"`
}

func calculateScore(data Data) int {
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

func canBeTeammate(existingTeam []Data, candidate Data) bool {
	for _, member := range existingTeam {
		if isInBlacklist(member.Blacklist, candidate.ID) || isInBlacklist(candidate.Blacklist, member.ID) {
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

func main() {

	files, err := ioutil.ReadDir("tool/output/.")
	if err != nil {
		fmt.Println("Error reading directory:", err)
		return
	}

	var matchedGroups [][]Data
	var unmatchedUsers []Data

	for _, file := range files {
		if strings.HasSuffix(file.Name(), ".json") && !strings.HasPrefix(file.Name(), "matched") && !strings.HasPrefix(file.Name(), "unmatched") {

			fileData, err := ioutil.ReadFile("tool/output/" + file.Name())
			if err != nil {
				fmt.Println("Error reading file:", file.Name(), err)
				continue
			}

			var group Group
			err = json.Unmarshal(fileData, &group)
			if err != nil {
				fmt.Println("Error unmarshalling JSON from file:", file.Name(), err)
				continue
			}

			sort.SliceStable(group.Users, func(i, j int) bool {
				return calculateScore(group.Users[i]) > calculateScore(group.Users[j])
			})

			for i := 0; i < len(group.Users); i++ {

				if i+3 <= len(group.Users) {

					if group.Users[i].Teammate != 0 {

						teammateID := group.Users[i].Teammate
						var teammate Data
						teammateIndex := -1
						for idx, user := range group.Users {
							if user.ID == teammateID {
								teammate = user
								teammateIndex = idx
								break
							}

							if canBeTeammate([]Data{group.Users[i]}, teammate) {

								teamScore := (calculateScore(group.Users[i]) + calculateScore(teammate)) / 2

								var thirdPerson Data
								thirdPersonFound := false
								minScoreDiff := math.MaxInt32
								for j := 0; j < len(group.Users); j++ {
									if j != i && j != teammateIndex && canBeTeammate([]Data{group.Users[i], teammate}, group.Users[j]) {

										candidateScore := calculateScore(group.Users[j])
										scoreDiff := abs(candidateScore - teamScore)

										if scoreDiff < minScoreDiff {
											minScoreDiff = scoreDiff
											thirdPerson = group.Users[j]
											thirdPersonFound = true
										}
									}
								}

								if thirdPersonFound {

									matchedGroups = append(matchedGroups, []Data{group.Users[i], teammate, thirdPerson})

									group.Users = append(group.Users[:i], group.Users[i+1:]...)
									if teammateIndex > i {
										teammateIndex--
									}
									group.Users = append(group.Users[:teammateIndex], group.Users[teammateIndex+1:]...)
									for idx, user := range group.Users {
										if user.ID == thirdPerson.ID {
											group.Users = append(group.Users[:idx], group.Users[idx+1:]...)
											break
										}
									}
								} else {

									unmatchedUsers = append(unmatchedUsers, group.Users[i], teammate)
								}
							}
						}
					} else {

						matchedGroups = append(matchedGroups, group.Users[i:i+3])
						i += 2
					}
				} else {

					unmatchedUsers = append(unmatchedUsers, group.Users[i:]...)
					break
				}
			}
		}
	}

	// 将匹配好的三人小组保存到文件
	matchedData, err := json.MarshalIndent(matchedGroups, "", "  ")
	if err != nil {
		fmt.Println("Error marshalling matched groups:", err)
		return
	}
	err = ioutil.WriteFile("matched_groups.json", matchedData, 0644)
	if err != nil {
		fmt.Println("Error writing matched groups to file:", err)
		return
	}
	fmt.Println("Matched groups written to matched_groups.json")

	// 将未匹配到的小组用户保存到文件
	unmatchedData, err := json.MarshalIndent(unmatchedUsers, "", "  ")
	if err != nil {
		fmt.Println("Error marshalling unmatched users:", err)
		return
	}
	err = ioutil.WriteFile("unmatched_users.json", unmatchedData, 0644)
	if err != nil {
		fmt.Println("Error writing unmatched users to file:", err)
		return
	}
	fmt.Println("Unmatched users written to unmatched_users.json")
}
