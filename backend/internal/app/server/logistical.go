package server

import (
	"ICPC/internal/pkg/constant"
	"ICPC/internal/pkg/log"
	"bytes"
	"context"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
	"net/http"
)

type ListLogisticalReq struct {
	Page
}
type ListLogisticalResp struct {
	Total int                       `json:"total"`
	Data  []*ListLogisticalRespData `json:"data"`
}

type ListLogisticalRespData struct {
	ID                  int    `json:"id"`
	AccountName         string `json:"account_name"`
	FullName            string `json:"full_name"`
	UniversityName      string `json:"university_name"`
	ShirtSize           int    `json:"shirt_size"`
	DietaryRequirements string `json:"dietary_requirements"`
	PreferredPronouns   int    `json:"preferred_pronouns"`
	Gender              int    `json:"gender"`
	ConsentPhotos       bool   `json:"consent_photos"`
	OfficialEmail       string `json:"official_email"`
	Matched             bool   `json:"matched"`
	AccountEmail        string `json:"account_email"`
}

func (s *Server) ListLogistical(ctx context.Context, req *ListLogisticalReq) (*ListLogisticalResp, error) {
	var result []*ListLogisticalRespData

	// 执行联合查询
	if err := getTx(ctx).
		Table("account a").
		Select(`a.id, a.Name AS account_name, ap.full_name, u.Name AS university_name,
	        ap.shirt_size, ap.dietary_requirements, ap.preferred_pronouns, ap.gender,
	        ap.consent_photos, ap.official_email, ap.matched,
	        a.Email AS account_email`).
		Joins("JOIN account_and_profile ap ON a.id = ap.account_id").
		Joins("JOIN university u ON ap.university_id = u.id").
		Joins("JOIN (SELECT DISTINCT account_id FROM account_and_role WHERE role_name = 'user') ar ON a.id = ar.account_id").
		Offset(req.Offset()).
		Limit(req.Limit()).
		Order("a.id ASC").
		Scan(&result).Error; err != nil {
		log.Errorw("tx.Scan() error", "err", err)
		return nil, fmt.Errorf("tx.Scan() error, err = %w", err)
	}

	// 获取符合条件的总记录数
	var total int64
	if err := getTx(ctx).
		Table("account a").
		Joins("JOIN account_and_profile ap ON a.id = ap.account_id").
		Joins("JOIN university u ON ap.university_id = u.id").
		Joins("JOIN (SELECT DISTINCT account_id FROM account_and_role WHERE role_name = 'user') ar ON a.id = ar.account_id").
		Count(&total).Error; err != nil {
		log.Errorw("tx.Count() error", "err", err)
		return nil, fmt.Errorf("tx.Count() error, err = %w", err)
	}

	resp := &ListLogisticalResp{
		Total: int(total),
		Data:  result,
	}

	return resp, nil
}

func (s *Server) ExportLogisticalDataToExcel(ctx *gin.Context) {
	var result []*ListLogisticalRespData

	if err := getTx(ctx).
		Table("account a").
		Select(`DISTINCT a.id, a.Name AS account_name, ap.full_name, u.Name AS university_name,
		        ap.shirt_size, ap.dietary_requirements, ap.preferred_pronouns, ap.gender,
		        ap.consent_photos, ap.official_email, ap.matched,
		        a.Email AS account_email`).
		Joins("JOIN account_and_profile ap ON a.id = ap.account_id").
		Joins("JOIN account_and_role ar ON a.id = ar.account_id").
		Joins("JOIN university u ON ap.university_id = u.id").
		Where("ar.role_name = ?", "user").
		Order("a.id ASC").
		Scan(&result).Error; err != nil {
		log.Errorw("tx.Scan() error", "err", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("tx.Scan() error, err = %v", err)})
		return
	}

	file := excelize.NewFile()
	sheetName := "Logistical Data"
	index, err := file.NewSheet(sheetName)
	if err != nil {
		log.Errorw("file.NewSheet error", "err", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("file.NewSheet error, err = %v", err)})
		return
	}
	file.SetActiveSheet(index)

	file.DeleteSheet("Sheet1")

	headers := []string{
		"ID", "Account Name", "Full Name", "University Name", "Shirt Size",
		"Dietary Requirements", "Preferred Pronouns", "Gender", "Consent Photos",
		"Official Email", "Matched", "Account Email",
	}
	for i, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		file.SetCellValue(sheetName, cell, header)
	}

	for rowIndex, data := range result {
		row := []interface{}{
			data.ID,
			data.AccountName,
			data.FullName,
			data.UniversityName,
			constant.GetSizeDescription(data.ShirtSize),
			data.DietaryRequirements,
			constant.GetPronounDescription(data.PreferredPronouns),
			constant.GetGenderDescription(data.Gender),
			data.ConsentPhotos,
			data.OfficialEmail,
			data.Matched,
			data.AccountEmail,
		}
		for colIndex, cellValue := range row {
			cell, _ := excelize.CoordinatesToCellName(colIndex+1, rowIndex+2) // 数据从第2行开始
			file.SetCellValue(sheetName, cell, cellValue)
		}
	}

	var buf bytes.Buffer
	if err := file.Write(&buf); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to write Excel file to buffer, err = %v", err)})
		return
	}

	ctx.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	ctx.Header("Content-Disposition", "attachment; filename=logistical_data_export.xlsx")
	ctx.Header("Content-Length", fmt.Sprintf("%d", buf.Len()))
	if _, err := ctx.Writer.Write(buf.Bytes()); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to write file to response, err = %v", err)})
		return
	}
}
