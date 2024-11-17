package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math/rand"
	"time"
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
	Blacklist                              []int `json:"blacklist,omitempty"` // 黑名单
}

type Group struct {
	Users []Data `json:"users"`
}

func isAllProficiencyZero(data Data) bool {
	return data.ProficiencyC == 0 && data.ProficiencyCpp == 0 &&
		data.ProficiencyJava == 0 && data.ProficiencyPython == 0
}

func getMaxProficiency(data Data) map[string]int {
	proficiencyMap := make(map[string]int)
	proficiencyMap["c"] = data.ProficiencyC
	proficiencyMap["cpp"] = data.ProficiencyCpp
	proficiencyMap["java"] = data.ProficiencyJava
	proficiencyMap["python"] = data.ProficiencyPython
	return proficiencyMap
}

func findSameMaxProficiency(proficiencyMap1, proficiencyMap2 map[string]int) (string, int, bool) {
	var language string
	highestProficiency := 0
	found := false
	for lang, prof1 := range proficiencyMap1 {
		if prof1 > 0 && prof1 == proficiencyMap2[lang] {
			if prof1 > highestProficiency {
				highestProficiency = prof1
				language = lang
				found = true
			}
		}
	}
	return language, highestProficiency, found
}

func main() {
	rand.Seed(time.Now().UnixNano())

	fileData, err := ioutil.ReadFile("output.json")
	if err != nil {
		fmt.Println("Error reading file:", err)
		return
	}

	var dataList []Data
	err = json.Unmarshal(fileData, &dataList)
	if err != nil {
		fmt.Println("Error unmarshalling JSON:", err)
		return
	}

	groups := make(map[string][]Data)
	processed := make(map[int]bool)

	for _, data := range dataList {
		if processed[data.ID] {
			continue
		}

		if data.Teammate != 0 {

			var teammate Data
			for _, t := range dataList {
				if t.ID == data.Teammate {
					teammate = t
					break
				}
			}

			if isAllProficiencyZero(data) && isAllProficiencyZero(teammate) {
				groupName := "_0"
				groups[groupName] = append(groups[groupName], data, teammate)
			} else {

				proficiencyMap1 := getMaxProficiency(data)
				proficiencyMap2 := getMaxProficiency(teammate)

				language, proficiency, found := findSameMaxProficiency(proficiencyMap1, proficiencyMap2)

				if found {
					groupName := fmt.Sprintf("%s_%d", language, proficiency)
					groups[groupName] = append(groups[groupName], data, teammate)
				} else {

					language1, proficiency1 := getMaxLanguage(proficiencyMap1)
					language2, proficiency2 := getMaxLanguage(proficiencyMap2)

					var chosenLanguage string
					var chosenProficiency int
					if proficiency1 == proficiency2 {
						if rand.Intn(2) == 0 {
							chosenLanguage = language1
						} else {
							chosenLanguage = language2
						}
						chosenProficiency = proficiency1
					} else {

						if proficiency1 > proficiency2 {
							chosenLanguage = language1
							chosenProficiency = proficiency1
						} else {
							chosenLanguage = language2
							chosenProficiency = proficiency2
						}
					}
					groupName := fmt.Sprintf("%s_%d", chosenLanguage, chosenProficiency)
					groups[groupName] = append(groups[groupName], data, teammate)
				}
			}

			processed[data.ID] = true
			processed[teammate.ID] = true
		}
	}

	for _, data := range dataList {
		if processed[data.ID] {
			continue
		}

		if isAllProficiencyZero(data) {
			groupName := "_0"
			groups[groupName] = append(groups[groupName], data)
		} else {

			proficiencyMap := getMaxProficiency(data)
			language, proficiency := getMaxLanguage(proficiencyMap)

			groupName := fmt.Sprintf("%s_%d", language, proficiency)

			groups[groupName] = append(groups[groupName], data)
		}
	}

	for groupName, users := range groups {
		fileName := fmt.Sprintf("tool/output/%s.json", groupName)
		groupData := Group{Users: users}

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
}

func getMaxLanguage(proficiencyMap map[string]int) (string, int) {
	var language string
	highestProficiency := 0
	for lang, prof := range proficiencyMap {
		if prof > highestProficiency {
			highestProficiency = prof
			language = lang
		}
	}
	return language, highestProficiency
}
