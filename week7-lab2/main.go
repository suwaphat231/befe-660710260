package main

import (
	"fmt"
	"os"
)

func getEnv(key, DefaultValue string) string {
	if value := os.Getenv("DB_HOST"); value != "" {
		return value
	}
	return DefaultValue
}

func main() {
	host := getEnv("DB_HOST", "")
	name := getEnv("DB_NAME", "")
	user := getEnv("DB_USER", "")
	password := getEnv("DB_PASSWORD", "")
	port := getEnv("DB_PORT", "")

	conSt := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", host, port, user, password, name)
	fmt.Println(conSt)
}
