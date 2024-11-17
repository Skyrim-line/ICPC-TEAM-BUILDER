package server

import (
	"ICPC/internal/pkg/constant"
	"ICPC/internal/pkg/log"
	"ICPC/internal/pkg/table"
	"ICPC/internal/pkg/types"
	"context"
	"errors"
	"fmt"
	mapset "github.com/deckarep/golang-set/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type ListAccountReq struct {
	Page
	Name string `form:"name"`
}

type ListAccountResp struct {
	Total int                    `json:"total"`
	Data  []*ListAccountRespData `json:"data"`
}

type ListAccountRespData struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	StartTime   string `json:"start_time"`
	EndTime     string `json:"end_time"`
	IsDeletable bool   `json:"is_deletable"`
}

func (s *Server) ListAccount(ctx context.Context, req *ListAccountReq) (*ListAccountResp, error) {
	var accounts []*table.Account
	if err := getTx(ctx).Where("name LIKE ?", "%"+req.Name+"%").
		Offset(req.Offset()).Limit(req.Limit()).Order("id ASC").Find(&accounts).Error; err != nil {
		log.Errorw("tx.Find() error", "err", err)
		return nil, fmt.Errorf("tx.Find() error, err = %w", err)
	}

	var total int64
	if err := getTx(ctx).Model(&table.Account{}).Where("name like ?", "%"+req.Name+"%").Count(&total).Error; err != nil {
		log.Errorw("tx.Count() error", "err", err)
		return nil, fmt.Errorf("tx.Count() error, err = %w", err)
	}

	respAccounts := make([]*ListAccountRespData, 0, len(accounts))
	for _, v := range accounts {
		tmp := &ListAccountRespData{
			ID:          v.ID,
			Name:        v.Name,
			Email:       v.Email,
			Phone:       v.Phone,
			StartTime:   types.FormatTime(v.StartTime),
			EndTime:     types.FormatTime(v.EndTime),
			IsDeletable: v.IsDeletable,
		}

		respAccounts = append(respAccounts, tmp)
	}

	resp := &ListAccountResp{
		Total: int(total),
		Data:  respAccounts,
	}

	return resp, nil
}

type AddAccountReq struct {
	Name         string `json:"name"  binding:"required"`
	Password     string `json:"password" binding:"password"`
	Roles        []Elem `json:"roles" binding:"required"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	UniversityID int    `json:"university_id" binding:"omitempty"`
	StartTime    string `json:"start_time" binding:"omitempty,datetime=2006-01-02 15:04:05"`
	EndTime      string `json:"end_time" binding:"omitempty,datetime=2006-01-02 15:04:05"`
	Remark       string `json:"remark"`
}

type AddAccountResp struct{}

func (s *Server) AddAccount(ctx context.Context, req *AddAccountReq) (*AddAccountResp, error) {
	if err := s.checkAddAccount(ctx, req); err != nil {
		return nil, fmt.Errorf("s.checkAddAccount() error, err = %w", err)
	}

	b, e, err := getBeginEndTime(req.StartTime, req.EndTime)
	if err != nil {
		return nil, fmt.Errorf("getBeginEndTime() error, err = %w", err)
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Errorw("bcrypt error", "err", err)
		return nil, fmt.Errorf("bcrypt error, err = %w", err)
	}

	a := &table.Account{
		Name:        req.Name,
		Password:    string(hashed),
		Email:       req.Email,
		Phone:       req.Phone,
		StartTime:   b,
		EndTime:     e,
		Remark:      req.Remark,
		IsDeletable: true,
	}
	ars := make([]*table.AccountAndRole, 0, len(req.Roles))
	roleIDs := make([]int, 0, len(ars))
	for _, v := range req.Roles {
		tmp := &table.AccountAndRole{
			AccountID:   a.ID,
			AccountName: a.Name,
			RoleID:      v.ID,
			RoleName:    v.Name,
		}
		ars = append(ars, tmp)
		roleIDs = append(roleIDs, v.ID)
	}

	if err := getTx(ctx).Create(&a).Error; err != nil {
		log.Errorw("add account error", "err", err)
		return nil, fmt.Errorf("add account error: %w", err)
	}

	if len(ars) > 0 {
		for _, v := range ars {
			v.AccountID = a.ID
		}
		if err := getTx(ctx).Create(&ars).Error; err != nil {
			log.Errorw("add account role error", "err", err)
			return nil, fmt.Errorf("add account role error: %w", err)
		}
	}

	if req.UniversityID != 0 {
		ap := &table.AccountAndProfile{
			AccountID:    a.ID,
			UniversityID: req.UniversityID,
		}
		if err := getTx(ctx).Create(&ap).Error; err != nil {
			log.Errorw("add account profile error", "err", err)
			return nil, fmt.Errorf("add account profile error: %w", err)
		}
	}

	if err := s.csb.AddRolesForUser(a.ID, roleIDs); err != nil {
		return nil, fmt.Errorf("s.au.AddRolesForUser error, err = %w", err)
	}

	return &AddAccountResp{}, nil
}

func (s *Server) checkAddAccount(ctx context.Context, req *AddAccountReq) error {
	_, ok, err := s.isAccountExist(ctx, req.Name)
	if err != nil {
		return fmt.Errorf("s.isAccountExist() error, err = %w", err)
	}

	if ok {
		return fmt.Errorf("user already exists")
	}

	ok, err = s.isRoleSubsetCurrentUser(ctx, req.Roles)
	if err != nil {
		return fmt.Errorf("s.isRoleSubsetCurrentUser() error, err = %w", err)
	}

	if !ok {
		return fmt.Errorf("the assigned role permission is higher than the current user's permission, please modify it and try again")
	}

	return nil
}

func (s *Server) isAccountExist(ctx context.Context, name string) (int, bool, error) {
	var account *table.Account
	if err := getTx(ctx).Where("name = ?", name).First(&account).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Errorw("first account error", "err", err)
		return 0, false, fmt.Errorf("first account error, err = %w", err)
	}

	return account.ID, account.ID != 0, nil
}

func (s *Server) isEmailExist(ctx context.Context, email string) (int, bool, error) {
	var account *table.Account
	if err := getTx(ctx).Where("email = ?", email).First(&account).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Errorw("first account error", "err", err)
		return 0, false, fmt.Errorf("first account error, err = %w", err)
	}

	return account.ID, account.ID != 0, nil
}

func (s *Server) isRoleSubsetCurrentUser(ctx context.Context, roles []Elem) (bool, error) {
	userID := ctx.Value(constant.CtxUserID).(int)
	// 获取当前用户的菜单id集合1
	var urs []*table.AccountAndRole
	if err := getTx(ctx).Where("account_id = ?", userID).Find(&urs).Error; err != nil {
		log.Errorw("tx.Find() error", "err", err)
		return false, fmt.Errorf("tx.Find() error, err = %w", err)
	}

	roleIDs := make([]int, 0, len(urs))
	for _, v := range urs {
		roleIDs = append(roleIDs, v.RoleID)
	}

	var rms []*table.RoleAndMenu
	if err := getTx(ctx).Where("role_id in ?", roleIDs).Find(&rms).Error; err != nil {
		log.Errorw("tx.Find() error", "err", err)
		return false, fmt.Errorf("tx.Find() error, err = %w", err)
	}

	menuSet := mapset.NewSet[int]()
	for _, v := range rms {
		menuSet.Add(v.MenuID)
	}

	wantedRoleIDs := make([]int, 0, 16)
	for _, v := range roles {
		wantedRoleIDs = append(wantedRoleIDs, v.ID)
	}

	var wantedRoleAndMenus []*table.RoleAndMenu
	if err := getTx(ctx).Where("role_id in ?", wantedRoleIDs).Find(&wantedRoleAndMenus).Error; err != nil {
		log.Errorw("tx.Find() error, err = %w", err)
		return false, fmt.Errorf("tx.Find() error, err = %w", err)
	}

	wantedMenuSet := mapset.NewSet[int]()
	for _, v := range wantedRoleAndMenus {
		wantedMenuSet.Add(v.MenuID)
	}

	if wantedMenuSet.IsSubset(menuSet) {
		return true, nil
	}

	return false, nil
}

type GetAccountReq struct {
	ID int `uri:"id"`
}

type GetAccountResp struct {
	ID            int     `json:"id"`
	Name          string  `json:"name"`
	Roles         []Elem  `json:"roles"`
	Menus         []*Tree `json:"menus"`
	Email         string  `json:"email"`
	Phone         string  `json:"phone"`
	StartTime     string  `json:"start_time"`
	EndTime       string  `json:"end_time"`
	Remark        string  `json:"remark"`
	LastLoginTime string  `json:"last_login_time"`
}

func (s *Server) GetAccount(ctx context.Context, req *GetAccountReq) (*GetAccountResp, error) {
	var a *table.Account
	if err := getTx(ctx).Where("id = ?", req.ID).First(&a).Error; err != nil {
		log.Errorw("tx.First() error", "err", err)
		return nil, fmt.Errorf("tx.First() error, err = %w", err)
	}

	var ars []*table.AccountAndRole
	if err := getTx(ctx).Where("account_id = ?", req.ID).Find(&ars).Error; err != nil {
		log.Errorw("tx.Find() error", "err", err)
		return nil, fmt.Errorf("tx.Find() error, err = %w", err)
	}

	respArs := make([]Elem, 0, len(ars))
	roleIDs := make([]int, 0, len(ars))
	for _, v := range ars {
		respArs = append(respArs, Elem{ID: v.RoleID, Name: v.RoleName})
		roleIDs = append(roleIDs, v.RoleID)
	}

	t, err := s.listMenuByRoldID(ctx, roleIDs)
	if err != nil {
		return nil, fmt.Errorf("s.ListMenuByRoldID error, err = %w", err)
	}

	resp := &GetAccountResp{
		ID:            a.ID,
		Name:          a.Name,
		Roles:         respArs,
		Menus:         t,
		Email:         a.Email,
		Phone:         a.Phone,
		StartTime:     types.FormatTime(a.StartTime),
		EndTime:       types.FormatTime(a.EndTime),
		Remark:        a.Remark,
		LastLoginTime: types.FormatTime(a.LastLoginTime),
	}

	return resp, nil
}

func (s *Server) GetAccountMe(ctx context.Context, req *GetAccountReq) (*GetAccountResp, error) {
	req.ID = ctx.Value(constant.CtxUserID).(int)
	resp, err := s.GetAccount(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("s.GetAccountMe() error, err = %w", err)
	}

	return resp, nil
}

func (s *Server) listMenuByRoldID(ctx context.Context, ids []int) ([]*Tree, error) {
	var ms []*table.Menu
	if err := getTx(ctx).Order("order_index").Find(&ms).Error; err != nil {
		log.Errorw("tx.Find() error", "err", err)
		return nil, fmt.Errorf("tx.Find() error, err = %w", err)
	}

	var rms []*table.RoleAndMenu
	if err := getTx(ctx).Where("role_id in ?", ids).Order("menu_id").Find(&rms).Error; err != nil {
		log.Errorw("find role_and_menu error", "err", err)
		return nil, fmt.Errorf("find role_and_menu error, err = %w", err)
	}
	smap := make(map[int]bool)
	for _, v := range rms {
		smap[v.MenuID] = true
	}

	t := tree(ms, smap)
	return t, nil
}

type SearchAccountReq struct {
	Page
	Keyword string `form:"keyword"`
}

type SearchAccountResp struct {
	Total int64                    `json:"total"`
	Data  []*SearchAccountRespData `json:"data"`
}

type SearchAccountRespData struct {
	ID          int    `json:"id"`
	AccountName string `json:"account_name"`
	Email       string `json:"email"`
	FullName    string `json:"full_name"`
}

// SearchAccount Return the user information of the same school according to the username or email address
// the api used by self-register users
func (s *Server) SearchAccount(ctx context.Context, req *SearchAccountReq) (*SearchAccountResp, error) {
	tx := getTx(ctx)
	var ap *table.AccountAndProfile
	if err := tx.Where("account_id = ?", ctx.Value(constant.CtxUserID).(int)).First(&ap).Error; err != nil {
		log.Errorw("tx.First() error", "err", err)
		return nil, fmt.Errorf("tx.First() error, err = %w", err)
	}
	count, respData, err := findUsersByUniversityAndKeyword(tx, ap.UniversityID, req.Keyword, req.Offset(), req.Limit())
	if err != nil {
		log.Errorw("findUsersByUniversityAndKeyword() error", "err", err)
		return nil, fmt.Errorf("findUsersByUniversityAndKeyword() error, err = %w", err)
	}
	resp := &SearchAccountResp{
		Total: count,
		Data:  respData,
	}
	return resp, nil
}

func findUsersByUniversityAndKeyword(tx *gorm.DB, uniID int, keyword string, Offset, Limit int) (int64, []*SearchAccountRespData, error) {
	var results []*SearchAccountRespData
	keywordPattern := "%" + keyword + "%"
	var count int64

	// Query the total number of eligible records
	if err := tx.Table("account_and_profile").
		Joins("JOIN account ON account.id = account_and_profile.account_id").
		Where("account_and_profile.university_id = ?", uniID).
		Where("account_and_profile.full_name LIKE ? OR account.name LIKE ? OR account.email LIKE ?", keywordPattern, keywordPattern, keywordPattern).
		Count(&count).Error; err != nil {
		log.Errorw("tx.Count() error", "err", err)
		return 0, nil, fmt.Errorf("tx.Count() error, err = %w", err)
	}
	// Perform the query
	err := tx.Table("account_and_profile").
		Select("account_and_profile.account_id AS id, account.name AS account_name, account.email, account_and_profile.full_name").
		Joins("JOIN account ON account.id = account_and_profile.account_id").
		Where("account_and_profile.university_id = ?", uniID).
		Where("account_and_profile.full_name LIKE ? OR account.name LIKE ? OR account.email LIKE ?", keywordPattern, keywordPattern, keywordPattern).
		Order("account_and_profile.account_id asc").
		Offset(Offset).
		Limit(Limit).
		Scan(&results).Error

	if err != nil {
		log.Errorw("tx.Find() error", "err", err)
		return 0, nil, fmt.Errorf("tx.Find() error, err = %w", err)
	}

	return count, results, nil
}

type UpdateAccountReq struct {
	ID        int    `json:"id" binding:"required"`
	Name      string `json:"name"`
	Roles     []Elem `json:"roles"`
	Password  string `json:"password" binding:"omitempty,password"`
	Email     string `json:"email" binding:"omitempty"`
	Phone     string `json:"phone" binding:"omitempty"`
	StartTime string `json:"start_time" binding:"omitempty,datetime=2006-01-02 15:04:05"`
	EndTime   string `json:"end_time" binding:"omitempty,datetime=2006-01-02 15:04:05"`
	Remark    string `json:"remark"`
}

type UpdateAccountResp struct{}

func (s *Server) UpdateAccount(ctx context.Context, req *UpdateAccountReq) (*UpdateAccountResp, error) {
	if err := s.checkUpdateAccount(ctx, req); err != nil {
		return nil, fmt.Errorf("s.checkUpdateAccount() error, err = %w", err)
	}

	b, e, err := getBeginEndTime(req.StartTime, req.EndTime)
	if err != nil {
		return nil, fmt.Errorf("getBeginEndTimeHelper error, err = %w", err)
	}

	var hashed []byte
	if req.Password != "" {
		hashed, err = bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			log.Errorw("bcrypt password error", "err", err)
			return nil, fmt.Errorf("bcrypt password error, err = %w", err)
		}
	}

	a := &table.Account{
		Model:     table.Model{ID: req.ID},
		Name:      req.Name,
		Password:  string(hashed),
		Email:     req.Email,
		Phone:     req.Phone,
		StartTime: b,
		EndTime:   e,
		Remark:    req.Remark,
	}

	ars := make([]*table.AccountAndRole, 0, len(req.Roles))
	roleIDs := make([]int, 0, len(ars))
	for _, v := range req.Roles {
		tmp := &table.AccountAndRole{
			AccountID:   a.ID,
			AccountName: a.Name,
			RoleID:      v.ID,
			RoleName:    v.Name,
		}
		ars = append(ars, tmp)
		roleIDs = append(roleIDs, v.ID)
	}

	if err := getTx(ctx).Updates(a).Error; err != nil {
		log.Errorw("tx.Updates() error", "err", err)
		return nil, fmt.Errorf("tx.Updates() error, err = %w", err)
	}

	if err := getTx(ctx).Where("account_id = ?", a.ID).Delete(&table.AccountAndRole{}).Error; err != nil {
		log.Errorw("tx.Delete() error", "err", err)
		return nil, fmt.Errorf("tx.Delete() error, err = %w", err)
	}

	if len(ars) > 0 {
		if err := getTx(ctx).Create(&ars).Error; err != nil {
			log.Errorw("tx.Create()", "err", err)
			return nil, fmt.Errorf("tx.Create() error, err = %w", err)
		}
	}

	if err := s.csb.DeleteRolesForUser(a.ID); err != nil {
		return nil, fmt.Errorf("s.au.DeleteRolesForUser error, err = %w", err)
	}

	if err := s.csb.AddRolesForUser(a.ID, roleIDs); err != nil {
		return nil, fmt.Errorf("s.au.AddRolesForUser error, err = %w", err)
	}

	return &UpdateAccountResp{}, nil
}

func (s *Server) checkUpdateAccount(ctx context.Context, req *UpdateAccountReq) error {
	id, ok, err := s.isAccountExist(ctx, req.Name)
	if err != nil {
		return fmt.Errorf("check account exist error, err = %w", err)
	}

	if ok && id != req.ID {
		return fmt.Errorf("user already exist")
	}

	var ars []*table.AccountAndRole
	if err := getTx(ctx).Where("account_id = ?", req.ID).Find(&ars).Error; err != nil {
		return fmt.Errorf("tx.Find() error, err = %w", err)
	}

	roles := make([]Elem, 0, len(ars))
	for _, v := range ars {
		roles = append(roles, Elem{ID: v.RoleID, Name: v.RoleName})
	}

	ok, err = s.isRoleSubsetCurrentUser(ctx, roles)
	if err != nil {
		return fmt.Errorf("s.isRoleSubsetCurrentUser() error, err = %w", err)
	}

	if !ok {
		return fmt.Errorf("the permissions of the operating user are higher than those of the current user")
	}

	ok, err = s.isRoleSubsetCurrentUser(ctx, req.Roles)
	if err != nil {
		return fmt.Errorf("s.isRoleSubsetCurrentUser() error, err = %w", err)
	}

	if !ok {
		return fmt.Errorf("the assigned role permissions are higher than those of the current user")
	}

	return nil
}

type UpdateAccountPasswordReq struct {
	ID              int    `json:"id" binding:"required"`
	OldPassword     string `json:"old_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"eqfield=ConfirmPassword,password"`
	ConfirmPassword string `json:"confirm_password" binding:"password"`
}

type UpdateAccountPasswordResp struct{}

func (s *Server) UpdateAccountPassword(ctx context.Context, req *UpdateAccountPasswordReq) (*UpdateAccountPasswordResp, error) {
	userID := ctx.Value(constant.CtxUserID).(int)
	if userID != req.ID {
		log.Errorw("failed to update the password", "err", "no permission", "login_user_id", userID, "wanted_user_id", req.ID)
		return nil, fmt.Errorf("insufficient data permissions, login_user_id = %v, wanted_user_id = %v", userID, req.ID)
	}

	var a *table.Account
	if err := getTx(ctx).Where("id = ?", req.ID).First(&a).Error; err != nil {
		log.Errorw("tx.First() error", "err", err)
		return nil, fmt.Errorf("tx.First() error, err = %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(a.Password), []byte(req.OldPassword)); err != nil {
		log.Errorw("wrong old password", "err", err)
		return nil, fmt.Errorf("wrong old password")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Errorw("bcrypt password error", "err", err)
		return nil, fmt.Errorf("bcrypt password error, err = %w", err)
	}

	if err := getTx(ctx).Where("id = ?", req.ID).Updates(table.Account{Password: string(hashed)}).Error; err != nil {
		log.Errorw("tx.Updates() error", "err", err)
		return nil, fmt.Errorf("tx.Updates() error, err = %w", err)
	}

	return &UpdateAccountPasswordResp{}, nil
}

type DeleteAccountReq struct {
	ID int `uri:"id"`
}

type DeleteAccountResp struct{}

func (s *Server) DeleteAccount(ctx context.Context, req *DeleteAccountReq) (*DeleteAccountResp, error) {
	if err := s.checkDeleteAccount(ctx, req); err != nil {
		return nil, fmt.Errorf("s.checkDeleteAccount() error, err = %w", err)
	}

	if err := getTx(ctx).Where("id = ?", req.ID).Delete(&table.Account{}).Error; err != nil {
		log.Errorw("delete account error", "err", err)
		return nil, fmt.Errorf("delete account error: %w", err)
	}

	if err := getTx(ctx).Where("account_id = ?", req.ID).Delete(&table.AccountAndRole{}).Error; err != nil {
		log.Errorw("delete account role error", "err", err)
		return nil, fmt.Errorf("delete account role error: %w", err)
	}
	if err := getTx(ctx).Where("account_id = ?", req.ID).Delete(&table.AccountAndProfile{}).Error; err != nil {
		log.Errorw("delete account profile error", "err", err)
		return nil, fmt.Errorf("delete account profile error: %w", err)
	}
	if err := getTx(ctx).Where("account_id = ?", req.ID).Delete(&table.AccountAndMatchInfo{}).Error; err != nil {
		log.Errorw("delete account match info error", "err", err)
		return nil, fmt.Errorf("delete account match info error: %w", err)
	}
	if err := s.csb.DeleteUser(req.ID); err != nil {
		log.Errorw("s.csb.DeleteUser error, err = %w", err)
		return nil, fmt.Errorf("s.csb.DeleteUser error, err = %w", err)
	}

	if err := s.csb.DeleteRolesForUser(req.ID); err != nil {
		log.Errorw("casbin delete account error", "err", err)
		return nil, fmt.Errorf("casbin delete account error, err = %w", err)
	}

	return &DeleteAccountResp{}, nil
}

func (s *Server) checkDeleteAccount(ctx context.Context, req *DeleteAccountReq) error {
	var account *table.Account
	if err := getTx(ctx).Where("id = ?", req.ID).First(&account).Error; err != nil {
		log.Errorw("tx.First() error", "err", err)
		return fmt.Errorf("tx.First() error, err = %w", err)
	}
	if !account.IsDeletable {
		return fmt.Errorf("user cannot be deleted")
	}

	var ars []*table.AccountAndRole
	if err := getTx(ctx).Where("account_id = ?", req.ID).Find(&ars).Error; err != nil {
		return fmt.Errorf("tx.Find() error, err = %w", err)
	}

	roles := make([]Elem, 0, len(ars))
	for _, v := range ars {
		roles = append(roles, Elem{ID: v.RoleID, Name: v.RoleName})
	}

	ok, err := s.isRoleSubsetCurrentUser(ctx, roles)
	if err != nil {
		return fmt.Errorf("s.isRoleSubsetCurrentUser() error, err = %w", err)
	}

	if !ok {
		return fmt.Errorf("deleted user permissions are higher than the current user")
	}

	return nil
}
