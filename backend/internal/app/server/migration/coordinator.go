package migration

import (
	"ICPC/internal/pkg/log"
	"ICPC/internal/pkg/table"
	"errors"
	"gorm.io/gorm"
)

const (
	coordinatorRoleID   = 4
	coordinatorRoleName = "coordinator"
	coordinatorRoleDesc = "site coordinator"
)

func m05_internalCoordinator() {
	internalRoleCoordinator()
	internalRoleAndMenuCoordinator()
}

func internalRoleCoordinator() {
	var role *table.Role
	if err := db.Where("name = ?", coordinatorRoleName).First(&role).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Fatalw("db.First() error", "err", err)
		}
		tmp := &table.Role{
			Name:        coordinatorRoleName,
			Description: coordinatorRoleDesc,
			CreatorID:   adminID,
			CreatorName: adminName,
			IsDeletable: false,
		}
		if err := db.Create(tmp).Error; err != nil {
			log.Fatalw("db.Create() error", "err", err)
		}
	}
}

func internalRoleAndMenuCoordinator() {
	// add default role

	menus := []Elem{
		{ID: 3, Name: "Profile"},
		{ID: 17, Name: "Logistics management"},
	}

	rms := make([]*table.RoleAndMenu, 0, len(menus))
	for _, v := range menus {
		tmp := &table.RoleAndMenu{
			RoleName: coordinatorRoleName,
			RoleID:   coordinatorRoleID,
			MenuID:   v.ID,
			MenuName: v.Name,
		}
		rms = append(rms, tmp)
	}

	if err := db.Transaction(func(tx *gorm.DB) error {
		// check if user role and menu exists
		var urm *table.RoleAndMenu
		if err := tx.Where("role_name = ?", coordinatorRoleName).First(&urm).Error; err != nil {
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				log.Fatalw("db.First() error", "err", err)
			} else {
				// add role and menu
				if err := tx.Create(&rms).Error; err != nil {
					log.Errorw("add default user role and menu error", "err", err)
				}
			}
		}
		return nil
	}); err != nil {
		log.Fatalw("db.Transaction() error", "err", err)
	}
}
