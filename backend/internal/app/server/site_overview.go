package server

import (
	"ICPC/internal/pkg/table"
	"context"
	"fmt"
	"github.com/go-redis/redis/v8"
	"time"
)

type GetSiteOverviewReq struct {
}
type GetSiteOverviewResp struct {
	StartUpTime       int64                   `json:"startup_time"`
	Runtime           string                  `json:"runtime"`
	UserCount         int64                   `json:"user_count"`
	LoginCount        int64                   `json:"login_count"`
	LoginUserCount    int64                   `json:"login_user_count"`
	UniversalCount    int64                   `json:"universal_count"`
	UniversityMembers []UniversityMembersData `json:"university_details"`
}

type UniversityMembersData struct {
	UniversityName string `json:"university_name"`
	StudentsCount  int64  `json:"students_count"`
	CoachCount     int64  `json:"coach_count"`
	GroupCount     int64  `json:"group_count"`
}

func (s *Server) GetSiteOverview(ctx context.Context, req *GetSiteOverviewReq) (*GetSiteOverviewResp, error) {
	startupTimeStr, err := s.redisClient.Get(ctx, "server_startup_time").Result()
	if err == redis.Nil {
		return nil, fmt.Errorf("startup time not found in Redis")
	} else if err != nil {
		return nil, fmt.Errorf("error fetching startup time from Redis: %w", err)
	}

	startupTime, err := time.Parse(time.RFC3339, startupTimeStr)
	if err != nil {
		return nil, fmt.Errorf("error parsing startup time: %w", err)
	}

	runtimeDuration := time.Now().Unix() - startupTime.Unix()

	days := runtimeDuration / (24 * 3600)
	hours := (runtimeDuration % (24 * 3600)) / 3600
	minutes := (runtimeDuration % 3600) / 60
	seconds := runtimeDuration % 60
	runtimeFormatted := fmt.Sprintf("%d days %02d:%02d:%02d", days, hours, minutes, seconds)

	var userCount int64
	if err := getTx(ctx).Model(&table.Account{}).Count(&userCount).Error; err != nil {
		return nil, fmt.Errorf("error fetching user count: %w", err)
	}

	startOfDay := time.Now().Truncate(24 * time.Hour)

	var loginCount int64
	if err := getTx(ctx).Model(&table.SiteOverview{}).Select("login_times").Where("created_at >= ?", startOfDay).Scan(&loginCount).Error; err != nil {
		return nil, fmt.Errorf("error fetching login count: %w", err)
	}
	var todayLoginUserCount int64
	if err := getTx(ctx).Model(&table.Account{}).
		Where("last_login_time >= ?", startOfDay).
		Count(&todayLoginUserCount).Error; err != nil {
		return nil, fmt.Errorf("error fetching today's login count: %w", err)
	}
	var universityCount int64
	if err := getTx(ctx).Model(&table.University{}).Count(&universityCount).Error; err != nil {
		return nil, fmt.Errorf("error fetching university count: %w", err)
	}

	var universityDetails []UniversityMembersData

	if err := getTx(ctx).Table("university u").
		Joins("LEFT JOIN account_and_profile ap ON u.id = ap.university_id AND ap.deleted_at IS NULL").
		Joins("LEFT JOIN account_and_role ar ON ap.account_id = ar.account_id AND ar.deleted_at IS NULL").
		Joins("LEFT JOIN \"group\" g ON u.id = g.university_id AND g.deleted_at IS NULL").
		Where("u.deleted_at IS NULL").
		Select(`
		u.name AS university_name,
		COUNT(DISTINCT CASE WHEN ar.role_name = 'user' THEN ap.account_id END) AS students_count,
		COUNT(DISTINCT CASE WHEN ar.role_name = 'coach' THEN ap.account_id END) AS coach_count,
		COUNT(DISTINCT g.id) AS group_count
	`).
		Group("u.id").
		Scan(&universityDetails).Error; err != nil {
		return nil, fmt.Errorf("error fetching university details: %w", err)
	}

	resp := &GetSiteOverviewResp{
		StartUpTime:       startupTime.Unix(),
		Runtime:           runtimeFormatted,
		UserCount:         userCount,
		LoginCount:        loginCount,
		LoginUserCount:    todayLoginUserCount,
		UniversalCount:    universityCount,
		UniversityMembers: universityDetails,
	}
	return resp, nil

}
