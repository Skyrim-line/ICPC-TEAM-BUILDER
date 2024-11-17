package server

import (
	"ICPC/internal/app/server/migration"
	"ICPC/internal/pkg/casbin"
	"ICPC/internal/pkg/constant"
	"ICPC/internal/pkg/crontab"
	"ICPC/internal/pkg/database"
	"ICPC/internal/pkg/handler"
	"ICPC/internal/pkg/log"
	"ICPC/internal/pkg/p_validator"
	"ICPC/internal/pkg/rabbitmq"
	"context"
	"fmt"
	"github.com/gin-contrib/pprof"
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	"github.com/go-redis/redis/v8"
	"github.com/wenlng/go-captcha/captcha"
	"gorm.io/gorm"
	"net/http"
	"sync"
	"time"
)

type Server struct {
	cfg         *Config
	db          *database.Database
	csb         *casbin.Casbin
	redisClient *redis.Client
	taskQ       rabbitmq.Producer
	crontab     *crontab.Crontab

	nonExistAccountMu  sync.Mutex
	nonExistAccountMap map[string]int

	entryMap     sync.Map // for crontab
	captchaMapMu sync.Mutex
	captchaMap   map[string]map[int]captcha.CharDot
}

func New(cfg *Config) *Server {

	casbinCfg := &casbin.Config{
		Dsn: cfg.Database.String(),
	}

	taskQ := rabbitmq.NewProducer(cfg.Amqp.String(), constant.Exchange_Task, rabbitmq.ExchangeDirect, constant.Queue_Task)

	s := &Server{
		cfg:                cfg,
		csb:                casbin.New(casbinCfg),
		db:                 database.NewDatabase(cfg.Env, constant.Driver_Postgres, cfg.Database.String()),
		redisClient:        redis.NewClient(&redis.Options{Addr: cfg.Redis.String(), Password: "", DB: 0}),
		crontab:            crontab.New(),
		nonExistAccountMap: make(map[string]int, 1000),
		nonExistAccountMu:  sync.Mutex{},
		entryMap:           sync.Map{},
		captchaMap:         make(map[string]map[int]captcha.CharDot, 100),
		captchaMapMu:       sync.Mutex{},
		taskQ:              taskQ,
	}

	if s.cfg.Env != constant.Env_0Debug {
		migration.Do(s.db.DB)
		s.ReloadCasbinRule()
	}

	if err := s.reloadTask(); err != nil {
		log.Fatalw("s.reloadTask() error", "err", err)
	}

	s.startHTTP()
	startupTime := time.Now().Format(time.RFC3339)
	if err := s.redisClient.Set(context.Background(), "server_startup_time", startupTime, 0).Err(); err != nil {
		log.Errorw("failed to set startup time in Redis", "err", err)
	}

	return s
}

func (s *Server) startHTTP() {
	router := gin.Default()
	if s.cfg.Env == constant.Env_3Prod {
		gin.SetMode(gin.ReleaseMode)
	}

	if validate, ok := binding.Validator.Engine().(*validator.Validate); ok {
		if err := validate.RegisterValidation("password", p_validator.CheckPassword); err != nil {
			log.Fatalw("register params valid error", "err", err)
		}
		if err := validate.RegisterValidation("eduEmail", p_validator.EduEmailValidator); err != nil {
			log.Fatalw("register params valid error", "err", err)
		}
	}

	setTx(router, s.db.DB)
	router.POST("/api/register", handler.Wrap(s.Register))
	router.POST("/api/verificationCode", handler.Wrap(s.SendRegisterEmail))
	router.POST("/api/login", handler.Wrap(s.Login))
	router.POST("/api/logout", handler.Wrap(s.Logout))
	router.GET("/api/captcha", handler.Wrap(s.GetCaptcha))
	router.GET("/api/code/:code", handler.Wrap(s.ConsentInvitationLink))
	router.POST("/api/forgot/send", handler.Wrap(s.ForgotPasswordEmail))
	router.POST("/api/forgot/verify", handler.Wrap(s.ForgotPasswordVerify))

	// register jwt middleware
	router.Use(s.auth())

	pprof.Register(router, "/api"+pprof.DefaultPrefix)
	s.initRouter(router)

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	go func() {
		log.Infow("http service listening", "addr", "http://0.0.0.0:"+s.cfg.Server.Port)
		if err := router.Run(fmt.Sprintf(":%v", s.cfg.Server.Port)); err != nil {
			log.Fatalw("http server start failed", "err", err)
		}
	}()
}

func (s *Server) Stop() {
	defer s.db.Stop()
	defer s.taskQ.Stop()
	defer s.csb.Stop()
	defer s.crontab.Stop()
}

func setTx(router *gin.Engine, db *gorm.DB) {
	router.Use(func(ctx *gin.Context) {
		tx := db.Begin()
		tx = tx.WithContext(ctx)
		defer tx.Rollback()

		ctx.Set("tx", tx)
		ctx.Next()

		v, ok := ctx.Value(constant.IsTxOK).(bool)
		if !ok || !v {
			return
		}

		tx.Commit()
	})
}

func getTx(ctx context.Context) *gorm.DB {
	return ctx.Value("tx").(*gorm.DB)
}
