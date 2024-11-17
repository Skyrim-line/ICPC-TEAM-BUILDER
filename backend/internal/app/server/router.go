package server

import (
	"ICPC/internal/pkg/handler"
	"github.com/gin-gonic/gin"
)

func (s *Server) initRouter(router *gin.Engine) {
	api := router.Group("/api")

	account := api.Group("/accounts")
	{
		account.GET("", handler.Wrap(s.ListAccount))
		account.GET("/me", handler.Wrap(s.GetAccountMe))
		account.GET("/:id", handler.Wrap(s.GetAccount))
		account.POST("", handler.Wrap(s.AddAccount))
		account.GET("/search", handler.Wrap(s.SearchAccount))
		account.PUT("/:id", handler.Wrap(s.UpdateAccount))
		account.PUT("/:id/password", handler.Wrap(s.UpdateAccountPassword))
		account.DELETE("/:id", handler.Wrap(s.DeleteAccount))
	}

	role := api.Group("/roles")
	{
		role.GET("", handler.Wrap(s.ListRole))
		role.GET("/:id", handler.Wrap(s.GetRole))
		role.POST("", handler.Wrap(s.AddRole))
		role.PUT("/:id", handler.Wrap(s.UpdateRole))
		role.DELETE("/:id", handler.Wrap(s.DeleteRole))
	}

	menu := api.Group("/menus")
	{
		menu.GET("", handler.Wrap(s.ListMenu))
	}

	profile := api.Group("/profiles")
	{
		profile.POST("", handler.Wrap(s.UpdateProfile))
		profile.GET("", handler.Wrap(s.GetProfile))
		profile.POST("/matchingInfo", handler.Wrap(s.UpdateMatchingInfo))
		profile.GET("/matchingInfo", handler.Wrap(s.GetMatchingInfo))
		profile.GET("/ready", handler.Wrap(s.CheckMatchingState))
		profile.POST("/ready", handler.Wrap(s.UserReadyToMatch))

		invite := profile.Group("/invitation")
		{
			invite.POST("", handler.Wrap(s.AddInvitation))
			invite.GET("", handler.Wrap(s.GetInvitation))
			invite.GET("/me", handler.Wrap(s.GetInvitationMe))
			invite.POST("/consent", handler.Wrap(s.ConsentInvite))
			invite.DELETE("/:id", handler.Wrap(s.DeleteInvitation))
		}
	}

	university := api.Group("/universities")
	{
		university.GET("", handler.Wrap(s.ListUniversity))
		university.POST("", handler.Wrap(s.AddUniversity))
		university.DELETE("/:id", handler.Wrap(s.DeleteUniversity))
	}

	task := api.Group("/tasks")
	{
		task.GET("", handler.Wrap(s.ListTask))
		task.POST("", handler.Wrap(s.AddTask))
		task.DELETE("/:id", handler.Wrap(s.RemoveTask))
		task.PUT("/:id", handler.Wrap(s.UpdateTask))
		task.GET("/current", handler.Wrap(s.GetCurrentEnrollPhrase))
	}

	group := api.Group("/groups")
	{
		group.GET("/:id", handler.Wrap(s.GetGroup))
		group.GET("", handler.Wrap(s.ListGroup))
		group.POST("", handler.Wrap(s.AddGroup))
		group.DELETE("/:id", handler.Wrap(s.DeleteGroup))
		group.GET("/unmatched", handler.Wrap(s.ListUnmatchedStudent))
		group.GET("/me", handler.Wrap(s.GetGroupMe))
		group.POST("/me", handler.Wrap(s.SetGroupMeName))
		group.POST("/release", handler.Wrap(s.ReleaseGroupResult))
	}

	Logistics := api.Group("/logistics")
	{
		Logistics.GET("", handler.Wrap(s.ListLogistical))
		Logistics.GET("/file", s.ExportLogisticalDataToExcel)
		Logistics.GET("/site", handler.Wrap(s.GetSiteOverview))
	}
}
