package table

import (
	"ICPC/internal/pkg/types"
	"gorm.io/gorm"
	"time"
)

type Model struct {
	ID        int            `gorm:"type:int8 generated by default as identity;comment:Primary key id"`
	CreatedAt time.Time      `gorm:"type:timestamptz;comment:Create time"`
	UpdatedAt time.Time      `gorm:"type:timestamptz;comment:Update time"`
	DeletedAt gorm.DeletedAt `gorm:"index;comment:Delete time"`
}

type Migration struct {
	Model
	FunctionIndex int `gorm:"type:int;not null;default:0;comment:Index of successfully executed function"`
}

type Account struct {
	Model
	Name          string    `gorm:"type:text;not null;default:'';comment:Account name"`
	Password      string    `gorm:"type:text;not null;default:'';comment:Account password"`
	Email         string    `gorm:"type:text;not null;default:'';comment:User email"`
	Phone         string    `gorm:"type:text;not null;default:'';comment:User phone number"`
	StartTime     time.Time `gorm:"type:timestamptz;comment:Effective time of the account"`
	EndTime       time.Time `gorm:"type:timestamptz;comment:Expiration time of the account"`
	Remark        string    `gorm:"type:text;not null;default:'';comment:Account remark"`
	LastLoginTime time.Time `gorm:"type:timestamptz;comment:Last login time of the account"`
	FailNum       int       `gorm:"type:int;not null;default:0;comment:Fail login time of the account"`
	IsDeletable   bool      `gorm:"type:bool;not null;default:false;comment:Whether the account is deletable"`
}

type AccountAndRole struct {
	Model
	AccountID   int    `gorm:"type:int;not null;default:0;comment:Account ID"`
	AccountName string `gorm:"type:text;not null;default:'';comment:Account Name"`
	RoleID      int    `gorm:"type:int;not null;default:0;comment:Role ID"`
	RoleName    string `gorm:"type:text;not null;default:'';comment:Role Name"`
}

type Role struct {
	Model
	Name        string `gorm:"type:text;not null;default:'';comment:Role Name"`
	Description string `gorm:"type:text;not null;default:'';comment:Role Description"`
	CreatorID   int    `gorm:"type:int;not null;default:0;comment:Creator ID"`
	CreatorName string `gorm:"type:text;not null;default:'';comment:Creator Name"`
	IsDeletable bool   `gorm:"type:bool;not null;default:false;comment:Whether the role is deletable"`
}

type RoleAndMenu struct {
	Model
	RoleID   int    `gorm:"type:int;not null;default:0;comment:Role ID"`
	RoleName string `gorm:"type:text;not null;default:'';comment:Role Name"`
	MenuID   int    `gorm:"type:int;not null;default:0;comment:Menu ID"`
	MenuName string `gorm:"type:text;not null;default:'';comment:Menu Name"`
}

type Route struct {
	Model
	Name     string `gorm:"type:text;not null;default:'';comment:Route Name"`
	Method   string `gorm:"type:text;not null;default:'';comment:Route Method"`
	MenuID   int    `gorm:"type:int;not null;default:0;comment:Menu ID"`
	MenuName string `gorm:"type:text;not null;default:'';comment:Menu Name"`
}

type Menu struct {
	Model
	Name       string `gorm:"type:text;not null;default:'';comment:Menu Name"`
	ParentID   int    `gorm:"type:int;not null;default:0;comment:Menu ID"`
	ParentName string `gorm:"type:text;not null;default:'';comment:Parent Menu Name"`
	OrderIndex int    `gorm:"type:int;not null;default:0;comment:Order Index"`
}

type AccountAndProfile struct {
	Model
	AccountID           int    `gorm:"type:int;not null;default:0;comment:Account ID"`
	FullName            string `gorm:"type:text;not null;default:'';comment:Full Name"`
	UniversityID        int    `gorm:"type:int;comment:University id"`
	ShirtSize           int    `gorm:"type:int;comment:Shirt Size"`
	DietaryRequirements string `gorm:"type:text;comment:Food allergies or dietary requirements"`
	PreferredPronouns   int    `gorm:"type:int;comment:Preferred Pronouns"`
	Gender              int    `gorm:"type:int;comment:Gender"`
	ConsentPhotos       bool   `gorm:"type:bool;not null; default:false;comment:Consent to appear in photos and videos taken on the day of the contest"`
	OfficialAccount     bool   `gorm:"type:bool;not null;default:true;comment:Made a profile on icpc.global"`
	OfficialEmail       string `gorm:"type:text;not null;default:'';comment:Email on icpc.global"`
	Matched             bool   `gorm:"type:bool;not null;default:false;comment:Matched or NotMatched in this account"`
}

type AccountAndMatchInfo struct {
	Model
	AccountID                              int              `gorm:"type:int;not null;default:0;comment:Account ID"`
	Level                                  int              `gorm:"type:int;comment:Level of the competition"`
	ProficiencyC                           int              `gorm:"type:int;comment:Proficiency C"`
	ProficiencyCpp                         int              `gorm:"type:int;comment:Proficiency CPP"`
	ProficiencyJava                        int              `gorm:"type:int;comment:Proficiency Java"`
	ProficiencyPython                      int              `gorm:"type:int;comment:Proficiency Python"`
	ProficiencyProgrammingFundamentals     bool             `gorm:"type:bool;comment:Proficiency Comp 1511"`
	ProficiencyPrinciplesOfProgramming     bool             `gorm:"type:bool;comment:Proficiency Comp 9021"`
	ProficiencyDataStructuresAndAlgorithms bool             `gorm:"type:bool;comment:Proficiency Comp 9024"`
	ProficiencyAlgorithmDesignAndAnalysis  bool             `gorm:"type:bool;comment:Proficiency Comp 3121"`
	ProficiencyProgrammingChallenges       bool             `gorm:"type:bool;comment:Proficiency Comp 4218"`
	Blacklist                              types.MemberList `gorm:"type:json;comment:list of student no match"`
	Teammate                               int              `gorm:"type:int;comment:teammate ID"`
	CompetitiveExperience                  string           `gorm:"type:text;comment:Competitive experience"`
	ReadyToMatch                           bool             `gorm:"type:bool;comment:Ready to match"`
}

type University struct {
	Model
	Name        string `gorm:"type:text;not null;default:'';comment:University Name"`
	EmailDomain string `gorm:"type:text;not null;default:'';comment:Email Domain"`
}

type Invitation struct {
	Model
	InvitorID        int    `gorm:"type:int;not null;default:0;comment:InvitorID ID"`
	InvitedAccountID int    `gorm:"type:int;not null;default:0;comment:InvitedAccount ID"`
	Accepted         bool   `gorm:"type:bool;not null;default:0;comment:Accepted"`
	Code             string `gorm:"type:text;not null;default:0;comment:Code"`
}

type Group struct {
	Model
	Name         string           `gorm:"type:text; not null;default:'';comment:Group Name"`
	UniversityID int              `gorm:"type:int;not null;default:0;comment:UniversityID"`
	Members      types.MemberList `gorm:"type:json;comment:list of group member"`
	Level        int              `gorm:"type:int;comment:Level of the competition"`
	Release      bool             `gorm:"type:bool;not null;default:0;comment:Release the result"`
}

type ScheduledTask struct {
	Model
	Name        string `gorm:"type:text; not null;default:'';comment:Scheduled Task Name"`
	CreatorID   int    `gorm:"type:int;not null;default:0;comment:Creator ID"`
	ExecuteTime string `gorm:"type:text;comment:Execute Time of ScheduledTask"`
	IsSuccess   bool   `gorm:"comment:IsSuccess"`
}

type SiteOverview struct {
	Model
	LoginTimes int `gorm:"type:int;not null;default:0;comment:Site Overview LoginTimes"`
}
