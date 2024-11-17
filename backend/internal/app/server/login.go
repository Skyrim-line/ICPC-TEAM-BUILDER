package server

import (
	"ICPC/internal/pkg/constant"
	"ICPC/internal/pkg/jwt"
	"ICPC/internal/pkg/log"
	"ICPC/internal/pkg/table"
	"context"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"net/http"
	"time"
)

type LoginReq struct {
	Username    string `json:"username" binding:"required"`
	Password    string `json:"password" binding:"required"`
	CaptchaKey  string `json:"captcha_key"`
	CaptchaDots string `json:"captcha_dots"`
}

type LoginResp struct {
	ID                 int    `json:"id"`
	Name               string `json:"name"`
	IsSelfRegistration bool   `json:"is_self_registration"`
}

func (s *Server) Login(ctx context.Context, req *LoginReq) (*LoginResp, error) {
	var act *table.Account
	nFailNum := 0
	if err := getTx(ctx).Where("name = ?", req.Username).First(&act).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Errorw("tx.First() error", "err", err)
			return nil, fmt.Errorf("tx.First() error, err: %w", err)
		}

		// update the number of attempts of users who do not exist
		s.nonExistAccountMu.Lock()
		nFailNum = s.nonExistAccountMap[req.Username]
		s.nonExistAccountMap[req.Username]++
		if len(s.nonExistAccountMap) > 1000 {
			for k := range s.nonExistAccountMap {
				delete(s.nonExistAccountMap, k)
				break
			}
		}
		s.nonExistAccountMu.Unlock()
	}

	if act.FailNum >= constant.MaxFailNum || nFailNum >= constant.MaxFailNum {
		ok, err := s.VerifyCaptcha(req.CaptchaKey, req.CaptchaDots)
		if err != nil {
			return nil, fmt.Errorf("captcha error, err = %w", err)
		}

		if !ok {
			log.Errorw("captcha code mismatch")
			return nil, fmt.Errorf("captcha code mismatch")
		}
	}

	if err := s.isValid(ctx, act, req); err != nil {
		if act.ID != 0 {
			act.FailNum++
			if err := getTx(ctx).Updates(act).Error; err != nil {
				log.Errorw("update account error", "err", err)
				return nil, fmt.Errorf("update account error, err = %w", err)
			}
		}

		log.Errorw("s.isValid error", "err", err)
		return nil, fmt.Errorf("wrong username or password")
	}

	if err := getTx(ctx).Model(&act).Updates(map[string]interface{}{"id": act.ID, "fail_num": 0, "last_login_time": time.Now()}).Error; err != nil {
		log.Errorw("error updating last login time", "id", act.ID, "err", err)
		return nil, fmt.Errorf("error updating last login time, id: %d, err: %w", act.ID, err)
	}

	claims := &jwt.Claims{
		UID:  act.ID,
		Name: act.Name,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    constant.JWTIssuer,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(constant.TokenValidHour * time.Hour)),
		},
	}

	token, err := jwt.Sign(s.cfg.Jwt.JwtSecret, claims)
	if err != nil {
		return nil, err
	}

	isUser, err := s.checkIsFrontDeskUser(ctx, act.ID)
	resp := &LoginResp{
		ID:                 act.ID,
		Name:               act.Name,
		IsSelfRegistration: isUser,
	}

	setToken(ctx, s.cfg.Env, token)

	startOfDay := time.Now().Truncate(24 * time.Hour)

	result := getTx(ctx).Model(&table.SiteOverview{}).
		Where("created_at >= ?", startOfDay).
		UpdateColumn("login_times", gorm.Expr("login_times + ?", 1))

	if result.RowsAffected == 0 {
		newRecord := table.SiteOverview{
			LoginTimes: 1,
		}
		if err := getTx(ctx).Create(&newRecord).Error; err != nil {
			log.Errorw("error creating new SiteOverview record", "err", err)
			return nil, fmt.Errorf("error creating new SiteOverview record, err = %w", err)
		}
	}

	return resp, nil
}

func (s *Server) isValid(ctx context.Context, act *table.Account, req *LoginReq) error {
	if err := bcrypt.CompareHashAndPassword([]byte(act.Password), []byte(req.Password)); err != nil {
		log.Errorw("wrong username or password", "username", req.Username)
		return fmt.Errorf("wrong username or password, username: %s", req.Username)
	}

	if !act.StartTime.IsZero() && time.Now().Before(act.StartTime) {
		log.Errorw("account has not been activated", "username", req.Username, "startTime", act.StartTime, "endTime", act.EndTime)
		return fmt.Errorf("account has not been activated, username: %s, startTime=%v, endTime=%v", req.Username, act.StartTime, act.EndTime)
	}

	if !act.EndTime.IsZero() && time.Now().After(act.EndTime) {
		log.Errorw("account has been deactivated", "username", req.Username, "startTime", act.StartTime, "endTime", act.EndTime)
		return fmt.Errorf("account has been deactivated, username: %s, startTime=%v, endTime=%v", req.Username, act.StartTime, act.EndTime)
	}

	return nil
}

type LogoutReq struct{}

type LogoutResp struct{}

func (s *Server) Logout(ctx context.Context, req *LogoutReq) (*LogoutResp, error) {
	ginCtx, ok := ctx.(*gin.Context)
	if !ok {
		return nil, errors.New("failed to convert context to *gin.Context")
	}

	tokenString, err := ginCtx.Cookie("Token")
	if err != nil {
		log.Errorw("Token not found in cookie", "err", err)
		ginCtx.String(http.StatusUnauthorized, "Unauthorized: No Token")
		return nil, err
	}
	claims, err := jwt.Verify(s.cfg.Jwt.JwtSecret, tokenString)
	if err != nil {
		log.Errorw("Invalid token", "err", err)
		ginCtx.String(http.StatusUnauthorized, "Invalid Token")
		return nil, err
	}
	err = s.addToBlacklist(ctx, claims.ID, claims.ExpiresAt.Time)
	if err != nil {
		log.Errorw("Failed to add token to blacklist", "err", err)
		ginCtx.String(http.StatusInternalServerError, "Failed to logout")
		return nil, err
	}

	setTokenExpire(ctx)
	return &LogoutResp{}, nil
}

func (s *Server) checkIsFrontDeskUser(ctx context.Context, userID int) (bool, error) {
	var ur *table.AccountAndRole
	if err := getTx(ctx).Where("account_id = ?", userID).First(&ur).Error; err != nil {
		log.Errorw("account not exist", "err", err)
		return false, err
	}
	return ur.RoleName == "user", nil
}
