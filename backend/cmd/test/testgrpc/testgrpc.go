package main

import (
	"ICPC/internal/pkg/log"
	"ICPC/internal/pkg/pb"
	"context"
	"google.golang.org/grpc"
	"time"
)

func sendEmailUsingGRPC(to string, subject string, body string) {
	conn, err := grpc.Dial("localhost:50051", grpc.WithInsecure(), grpc.WithBlock())
	if err != nil {
		log.Fatalw("Failed to connect: %v", err)
	}
	defer conn.Close()

	client := pb.NewEmailServiceClient(conn)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	res, err := client.SendEmail(ctx, &pb.SendEmailRequest{
		To:      to,
		Subject: subject,
		Body:    body,
	})
	if err != nil {
		log.Fatalw("Error while calling SendEmail", "err", err)
	}

	log.Fatalw("Response from EmailService:", "success", res.Success, "msg", res.Message)
}

func requestMatchGroup(level, uniID int32) {

	conn, err := grpc.Dial("localhost:50052", grpc.WithInsecure())
	if err != nil {
		log.Fatalw("Failed to connect", "err", err)
	}
	defer conn.Close()

	client := pb.NewMatcherServiceClient(conn)

	req := &pb.MatchRequest{
		Level:        level,
		UniversityId: uniID,
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	resp, err := client.StartMatch(ctx, req)
	if err != nil {
		log.Fatalw("Error calling StartMatch", "err", err)
	}

	log.Infow("Response from server: %s, Success", resp.Message, resp.Success)
}

func main() {
	//sendEmailUsingGRPC("eehktt@gmail.com", "test email icpc", "just a test email")
	requestMatchGroup(1, 1)
}
