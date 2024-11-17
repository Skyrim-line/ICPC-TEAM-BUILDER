package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"os"
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
	Teammate                               int   `json:"teammate,omitempty"`  // 默认为空
	Blacklist                              []int `json:"blacklist,omitempty"` // 黑名单
}

func main() {
	rand.Seed(time.Now().UnixNano())

	var dataList []Data

	for i := 1; i <= 100; i++ {
		data := Data{
			ID:                                     i,
			ProficiencyC:                           rand.Intn(3),
			ProficiencyCpp:                         rand.Intn(3),
			ProficiencyJava:                        rand.Intn(3),
			ProficiencyPython:                      rand.Intn(3),
			ProficiencyProgrammingFundamentals:     rand.Intn(2) == 1,
			ProficiencyPrinciplesOfProgramming:     rand.Intn(2) == 1,
			ProficiencyDataStructuresAndAlgorithms: rand.Intn(2) == 1,
			ProficiencyAlgorithmDesignAndAnalysis:  rand.Intn(2) == 1,
			ProficiencyProgrammingChallenges:       rand.Intn(2) == 1,
		}

		dataList = append(dataList, data)
	}

	totalUsers := len(dataList)

	teammateCount := totalUsers / 10
	teammateIndices := rand.Perm(totalUsers)[:teammateCount]
	for i := 0; i < len(teammateIndices); i += 2 {
		if i+1 < len(teammateIndices) {
			a := teammateIndices[i]
			b := teammateIndices[i+1]
			dataList[a].Teammate = dataList[b].ID
			dataList[b].Teammate = dataList[a].ID
		}
	}

	blacklistCount := totalUsers / 10
	blacklistIndices := rand.Perm(totalUsers)[:blacklistCount]
	for _, idx := range blacklistIndices {
		blacklistSize := rand.Intn(6)
		blacklist := rand.Perm(totalUsers)[:blacklistSize]
		var filteredBlacklist []int
		for _, id := range blacklist {
			if id != idx+1 {
				filteredBlacklist = append(filteredBlacklist, dataList[id].ID)
			}
		}
		dataList[idx].Blacklist = filteredBlacklist
	}

	jsonData, err := json.MarshalIndent(dataList, "", "  ")
	if err != nil {
		fmt.Println("Error marshalling to JSON:", err)
		return
	}

	file, err := os.Create("output.json")
	if err != nil {
		fmt.Println("Error creating file:", err)
		return
	}
	defer file.Close()

	_, err = file.Write(jsonData)
	if err != nil {
		fmt.Println("Error writing to file:", err)
		return
	}

	fmt.Println("Data has been written to output.json")
}
