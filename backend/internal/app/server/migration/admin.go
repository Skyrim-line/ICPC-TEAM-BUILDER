package migration

import (
	"ICPC/internal/pkg/log"
	"ICPC/internal/pkg/table"
	"errors"
	"fmt"
	mapset "github.com/deckarep/golang-set/v2"
	"gorm.io/gorm"
)

const (
	adminID   = 1
	adminName = "admin"
	// bcrypt("icpcAdmin!")
	adminPassword = "$2a$10$MQ/B1zBIKrk8tHJV9v1SPuzlt1.TGf0.q0vK5GhfjqXadhj/KsAX6"
)

func m00_nop() {
}

func m01_internalAdmin() {
	internalAccountAdmin()
	internalRoleAdmin()
	internalRoleAndMenuAdmin()
	internalAccountAndRoleAdmin()
}

func internalAccountAdmin() {
	var account *table.Account
	if err := db.Where("id = ?", adminID).First(&account).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Fatalw("db.First() error", "err", err)
		}

		tmp := &table.Account{
			Name:        adminName,
			Password:    adminPassword,
			IsDeletable: false,
		}
		if err := db.Create(tmp).Error; err != nil {
			log.Fatalw("db.Create() error", "err", err)
		}
	}
}

func internalRoleAdmin() {
	var role *table.Role
	if err := db.Where("id = ?", adminID).First(&role).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Fatalw("db.First() error", "err", err)
		}

		tmp := &table.Role{
			Name:        adminName,
			Description: adminName,
			CreatorID:   adminID,
			CreatorName: adminName,
			IsDeletable: false,
		}
		if err := db.Create(tmp).Error; err != nil {
			log.Fatalw("db.Create() error", "err", err)
		}
	}
}

func internalAccountAndRoleAdmin() {
	var ar *table.AccountAndRole
	if err := db.Where("account_id = ? and role_id = ?", adminID, adminID).First(&ar).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Fatalw("db.First() error", "err", err)
		}

		tmp := &table.AccountAndRole{
			AccountID:   adminID,
			AccountName: adminName,
			RoleID:      adminID,
			RoleName:    adminName,
		}
		if err := db.Create(tmp).Error; err != nil {
			log.Fatalw("db.Create() error", "err", err)
		}
	}
}

func internalRoleAndMenuAdmin() {

	var rms []*table.RoleAndMenu
	if err := db.Where("role_id = ?", adminID).Find(&rms).Error; err != nil {
		log.Fatalw("db.Find() error", "err", err)
	}
	oldMenuSet := mapset.NewSet[int]()
	for _, v := range rms {
		oldMenuSet.Add(v.MenuID)
	}

	var menus []*table.Menu
	if err := db.Find(&menus).Error; err != nil {
		log.Fatalw("db.Find() error", "err", err)
	}
	newMenuSet := mapset.NewSet[int]()
	for _, v := range menus {
		newMenuSet.Add(v.ID)
	}

	if oldMenuSet.Equal(newMenuSet) {
		return
	}

	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("role_id = ?", adminID).Delete(&table.RoleAndMenu{}).Error; err != nil {
			log.Errorw("tx.Delete() error", "err", err)
			return fmt.Errorf("tx.Delete() error, err = %w", err)
		}

		nrms := make([]*table.RoleAndMenu, 0, 32)
		for _, v := range menus {
			tmp := &table.RoleAndMenu{
				RoleID:   adminID,
				RoleName: adminName,
				MenuID:   v.ID,
				MenuName: v.Name,
			}
			nrms = append(nrms, tmp)
		}
		if err := tx.Create(nrms).Error; err != nil {
			log.Errorw("tx.Create() error", "err", err)
			return fmt.Errorf("tx.Create() error, err = %w", err)
		}

		return nil
	}); err != nil {
		log.Fatalw("db.Transaction() error", "err", err)
	}

}
