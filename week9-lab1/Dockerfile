# ---------- Build stage ----------
FROM golang:1.24.5-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64
RUN go build -o main ./main.go

# ---------- Runtime stage ----------
FROM alpine:latest
WORKDIR /root/

RUN apk add --no-cache curl

COPY --from=builder /app/main .

EXPOSE 8080
ENTRYPOINT ["./main"]