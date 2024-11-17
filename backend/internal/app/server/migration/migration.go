package migration

import (
	"ICPC/internal/pkg/log"
	"ICPC/internal/pkg/table"
	_ "embed"
	"errors"
	"gorm.io/gorm"
)

var db *gorm.DB

func Do(d *gorm.DB) {
	db = d

	migrateTable()
	syncData()
	migrateData()
}

func migrateTable() {
	if err := db.AutoMigrate(
		&table.Migration{},
		&table.Account{},
		&table.Role{},
		&table.RoleAndMenu{},
		&table.AccountAndRole{},
		&table.Route{},
		&table.Menu{},
		&table.AccountAndProfile{},
		&table.University{},
		&table.AccountAndMatchInfo{},
		&table.Invitation{},
		&table.Group{},
		&table.ScheduledTask{},
		&table.SiteOverview{},
	); err != nil {
		log.Fatalw("db.AutoMigrate error", "err", err)
	}
}

func migrateData() {
	var mig *table.Migration
	if err := db.First(&mig).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Fatalw("db.First() error", "err", err)
		}
		mig = &table.Migration{}
		if err := db.Create(mig).Error; err != nil {
			log.Fatalw("db.Create() error", "err", err)
		}
	}

	fs := []func(){m00_nop, m01_internalAdmin, m02_internalUser, m03_internalUni, m04_internalCoach, m05_internalCoordinator}
	for i, v := range fs {
		if i <= mig.FunctionIndex {
			continue
		}
		v()
		if err := db.Where("id = ?", 1).Updates(&table.Migration{FunctionIndex: i}).Error; err != nil {
			log.Fatalw("db.Updates() error", "err", err)
		}
	}
}

func syncData() {
	sync_01Menu()
	sync_02Route()
}

//go:embed sql/menu.sql
var syncMenuSQL string

func sync_01Menu() {
	if err := db.Exec(syncMenuSQL).Error; err != nil {
		log.Fatalw("exec sql error", "err", err)
	}
}

//go:embed sql/route.sql
var syncRouteSQL string

func sync_02Route() {
	if err := db.Exec(syncRouteSQL).Error; err != nil {
		log.Fatalw("exec sql error", "err", err)
	}
}
