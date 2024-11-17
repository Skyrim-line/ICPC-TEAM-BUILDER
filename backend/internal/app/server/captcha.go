package server

import (
	"ICPC/internal/pkg/log"
	"context"
	"fmt"
	"github.com/wenlng/go-captcha/captcha"
	"strconv"
	"strings"
)

type GetCaptchaReq struct {
}

type GetCaptchaResp struct {
	Key   string `json:"key"`
	Thumb string `json:"thumb"`
	Image string `json:"image"`
}

func (s *Server) GetCaptcha(ctx context.Context, req *GetCaptchaReq) (*GetCaptchaResp, error) {
	capt := captcha.GetCaptcha()
	dots, b64, tb64, key, err := capt.Generate()
	if err != nil {
		log.Errorw("generate captcha error", "err", err)
		return nil, fmt.Errorf("generate captcha error, err = %w", err)
	}

	s.captchaMapMu.Lock()
	defer s.captchaMapMu.Unlock()

	s.captchaMap[key] = dots

	return &GetCaptchaResp{key, tb64, b64}, nil
}

func (s *Server) VerifyCaptcha(key, dots string) (bool, error) {
	s.captchaMapMu.Lock()
	defer s.captchaMapMu.Unlock()

	dct := s.captchaMap[key]
	delete(s.captchaMap, key)
	src := strings.Split(dots, ",")
	chkRet := false
	if (len(dct) * 2) == len(src) {
		for i, dot := range dct {
			j := i * 2
			k := i*2 + 1
			sx, err := strconv.ParseFloat(fmt.Sprintf("%v", src[j]), 64)
			if err != nil {
				log.Errorw("parse float error", "err", err)
				return false, fmt.Errorf("parse float error, err = %w", err)
			}

			sy, err := strconv.ParseFloat(fmt.Sprintf("%v", src[k]), 64)
			if err != nil {
				log.Errorw("parse float error", "err", err)
				return false, fmt.Errorf("parse float error, err = %w", err)
			}

			chkRet = captcha.CheckPointDistWithPadding(int64(sx), int64(sy), int64(dot.Dx), int64(dot.Dy), int64(dot.Width), int64(dot.Height), 5)
			if !chkRet {
				break
			}
		}
	}

	return chkRet, nil
}
