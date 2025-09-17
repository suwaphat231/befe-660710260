package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	"database/sql"
	"log"

	_ "github.com/lib/pq"
)

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

var db *sql.DB

func initDB() {
	host := getEnv("DB_HOST", "")
	name := getEnv("DB_NAME", "")
	user := getEnv("DB_USER", "")
	password := getEnv("DB_PASSWORD", "")
	port := getEnv("DB_PORT", "")

	conSt := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", host, port, user, password, name)
	var err error
	db, err = sql.Open("postgres", conSt)
	if err != nil {
		log.Fatal("failed to open database")
	}

	err = db.Ping()
	if err != nil {
		fmt.Println(err)
		log.Fatal("failed to connect database")
	}

	log.Println("succesfully connected to database")
}

func main() {
	initDB()
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		err := db.Ping()
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"massage": "unhealthy", "error": err})
			return
		}
		c.JSON(200, gin.H{"status": "OK"})
	})

	// api := r.Group("/api/v1")
	// {
	// api.GET("/books", getBooks)
	// api.GET("/books/:id", getBook)
	// api.POST("/books", createBook)
	// api.PUT("/books/:id", updateBook)
	// api.DELETE("/books/:id", deleteBook)
	// }

	r.Run(":8080")
}
