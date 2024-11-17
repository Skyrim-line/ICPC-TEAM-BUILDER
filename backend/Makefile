# 通用变量定义
PLATFORM := linux/amd64
REPO := icpc.org/repo
MAILER_IMG := icpc_mailer
MATCHER_IMG := icpc_matcher
SERVER_IMG := icpc_server
GOOS := $(shell go env GOOS)
GOARCH := amd64
GOENV := CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH)
GoVersion := $(shell go version)
GitCommit := $(shell git rev-list -1 HEAD)
GitTag := $(shell git describe --tags)
LDFLAGS := -ldflags "-X 'ICPC/internal/pkg/version.GoVersion=$(GoVersion)' \
                      -X 'ICPC/internal/pkg/version.GitCommit=$(GitCommit)' \
                      -X 'ICPC/internal/pkg/version.GitTag=$(GitTag)'"

BIN_DIR := bin

.PHONY: pb
pb:
	cd internal/pkg/pb && \
		protoc --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative *.proto

.PHONY: test
test:
	go test -v --race ./...

.PHONY: mailer matcher server
mailer:
	$(GOENV) go build $(LDFLAGS) -o $(BIN_DIR)/icpc_tb_mailer cmd/mailer/*.go
	cp config/mailer.toml $(BIN_DIR)/mailer.toml

matcher:
	$(GOENV) go build $(LDFLAGS) -o $(BIN_DIR)/icpc_tb_matcher cmd/matcher/*.go
	cp config/matcher.toml $(BIN_DIR)/matcher.toml

server:
	$(GOENV) go build $(LDFLAGS) -o $(BIN_DIR)/icpc_tb_server cmd/server/*.go
	cp config/server.toml $(BIN_DIR)/server.toml

.PHONY: build
build: mailer matcher server

.PHONY: docker
docker: docker-mailer docker-matcher docker-server

docker-mailer:
	docker build --platform=$(PLATFORM) -t $(REPO)/$(MAILER_IMG):$(GitTag) -f ./build/Dockerfile --target=mailer .

docker-matcher:
	docker build --platform=$(PLATFORM) -t $(REPO)/$(MATCHER_IMG):$(GitTag) -f ./build/Dockerfile --target=matcher .

docker-server:
	docker build --platform=$(PLATFORM) -t $(REPO)/$(SERVER_IMG):$(GitTag) -f ./build/Dockerfile --target=server .

# 保存各个服务的镜像到本地 tar 文件
.PHONY: docker_save
docker_save: docker
	mkdir -p bin_docker/ICPC_backend/image/
	docker save -o bin_docker/ICPC_backend/image/$(MAILER_IMG)_$(GitTag).tar $(REPO)/$(MAILER_IMG):$(GitTag)
	docker save -o bin_docker/ICPC_backend/image/$(MATCHER_IMG)_$(GitTag).tar $(REPO)/$(MATCHER_IMG):$(GitTag)
	docker save -o bin_docker/ICPC_backend/image/$(SERVER_IMG)_$(GitTag).tar $(REPO)/$(SERVER_IMG):$(GitTag)
	cp config/*.toml bin_docker/ICPC_backend/
	docker save -o bin_docker/ICPC_backend/image/redis_alpine.tar redis:7.4.0-alpine

	docker pull postgres:14.0
	docker save -o bin_docker/ICPC_backend/image/postgres_14.0.tar postgres:14.0
	docker pull rabbitmq:4-alpine
	docker save -o bin_docker/ICPC_backend/image/rabbitmq_management.tar rabbitmq:4.0.2-management
	sed -e 's|{{GitTag}}|$(GitTag)|g' -e 's|{{REPO}}|$(REPO)|g' -e 's|{{SERVER_IMG}}|$(SERVER_IMG)|g ' -e 's|{{MAILER_IMG}}|$(MAILER_IMG)|g ' -e 's|{{MATCHER_IMG}}|$(MATCHER_IMG)|g ' deployment/docker-compose.yaml > bin_docker/ICPC_backend/docker-compose.yaml

.PHONY: clean
clean:
	rm -rf $(BIN_DIR) bin_docker/
