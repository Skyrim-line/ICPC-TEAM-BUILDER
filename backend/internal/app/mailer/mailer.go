package mailer

import (
	"ICPC/internal/pkg/constant"
	"ICPC/internal/pkg/log"
	"ICPC/internal/pkg/rabbitmq"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"github.com/rabbitmq/amqp091-go"
	"gopkg.in/gomail.v2"
	"sync"
)

type Mailer struct {
	cfg    *Config
	dailer *gomail.Dialer
	sconn  gomail.SendCloser
	taskQ  rabbitmq.Consumer
	mu     sync.Mutex
}

type EmailRequest struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

func New(cfg *Config) *Mailer {
	consumer := rabbitmq.NewConsumer(cfg.Amqp.String(), constant.Exchange_Task, rabbitmq.ExchangeDirect, constant.Queue_Task)

	d := gomail.NewDialer(cfg.SmtpServer, cfg.SmtpPort, cfg.EmailAddress, cfg.APPPassword)
	d.TLSConfig = &tls.Config{
		InsecureSkipVerify: true,
	}

	smtpConn, err := d.Dial()
	if err != nil {
		log.Fatalw("failed to connect to SMTP server", "err", err)
	}

	m := &Mailer{
		cfg:    cfg,
		dailer: d,
		sconn:  smtpConn,
		taskQ:  consumer,
	}

	go m.ConsumeTask()
	return m

}

func (s *Mailer) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.taskQ != nil {
		s.taskQ.Stop()
		s.taskQ = nil
	}

	if s.sconn != nil {
		s.sconn.Close()
		s.sconn = nil
	}
}

func (s *Mailer) sendEmail(req EmailRequest) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	m := gomail.NewMessage()
	m.SetHeader("From", "icpcteambuilder@gmail.com")
	m.SetHeader("To", req.To)
	m.SetHeader("Subject", "[ICPC Team Builder System] "+req.Subject)
	//m.SetBody("text/plain", req.Body)
	htmlBody := fmt.Sprintf(`
		<div>
			%s
			<br>
			<p>------</p>
			<p>This message is intended for the addressee named and may contain confidential information. If you are not the intended recipient, please delete it and notify the sender.</p>
			<p>ICPC Team Builder System</p>
		</div>`, req.Body)

	m.SetBody("text/html", htmlBody)

	if err := gomail.Send(s.sconn, m); err != nil {
		log.Warnw("SMTP send failed, attempting to reconnect", "error", err)

		if err := s.reconnect(); err != nil {
			return fmt.Errorf("failed to reconnect to SMTP server: %v", err)
		}

		if err := gomail.Send(s.sconn, m); err != nil {
			return fmt.Errorf("failed to send email after reconnect: %v", err)
		}
	}
	log.Infow("successfully sent email", "to", req.To)
	return nil
}

func (s *Mailer) reconnect() error {
	if s.sconn != nil {
		if err := s.sconn.Close(); err != nil {
			log.Warnw("Error closing old SMTP connection", "error", err)
		}
	}

	log.Infow("Reconnecting to SMTP server...")
	conn, err := s.dailer.Dial()
	if err != nil {
		return fmt.Errorf("failed to reconnect to SMTP server: %v", err)
	}
	s.sconn = conn
	log.Infow("SMTP connection re-established")
	return nil
}

func (s *Mailer) ConsumeTask() {
	for v := range s.taskQ.Consume() {
		go func(v amqp091.Delivery) {
			var emailReq EmailRequest

			if err := json.Unmarshal(v.Body, &emailReq); err != nil {
				log.Errorw("json unmarshal error", "err", err)
				return
			}
			log.Infow("get new msg from task queue", "msg", emailReq)

			err := s.sendEmail(emailReq)
			if err != nil {
				log.Errorw("err sending email", "err", err)
			}
		}(v)
	}
}
