package main

import (
	"ICPC/internal/app/matcher"
	"ICPC/internal/pkg/config"
	"ICPC/internal/pkg/log"
	"ICPC/internal/pkg/version"
	"flag"
)

func main() {
	f := flag.String("f", "./matcher.toml", "config file path")
	v := flag.Bool("v", false, "show version number")

	flag.Parse()

	if *v {
		version.Show()
		return
	}

	cfg, err := config.Parse[matcher.Config](*f)
	if err != nil {
		log.Fatalw("parse config file failed", "err", err)
	}
	log.Infow("config loaded", "cfg", cfg)

	ctr := matcher.New(cfg)
	log.Infow("matcher launched")
	defer ctr.Stop()
	//postStart(ctr)
	select {}

}
