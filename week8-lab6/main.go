package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	"database/sql"
	"log"

	"time"

	"strconv"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type Book struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Author    string    `json:"author"`
	ISBN      string    `json:"isbn"`
	Year      int       `json:"year"`
	Price     float64   `json:"price"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

var db *sql.DB

func initDB() {

	_ = godotenv.Load("../bookstoredatabase/.env")

	host := getEnv("DB_HOST", getEnv("POSTGRES_HOST", "localhost"))
	name := getEnv("DB_NAME", getEnv("POSTGRES_DB", "bookstore"))
	user := getEnv("DB_USER", getEnv("POSTGRES_USER", "postgres"))
	password := getEnv("DB_PASSWORD", getEnv("POSTGRES_PASSWORD", "password"))
	port := getEnv("DB_PORT", getEnv("POSTGRES_PORT", "5432"))

	// validate กันพลาด
	if host == "" || name == "" || user == "" || port == "" {
		log.Fatalf("missing DB envs: host=%q name=%q user=%q port=%q", host, name, user, port)
	}

	conSt := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, name,
	)

	var err error
	db, err = sql.Open("postgres", conSt)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err = db.Ping(); err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}
	log.Println("succesfully connected to database")
}

func getAllBooks(c *gin.Context) {
	yearInput := c.Query("year") // ถ้ามี ?year=2020 เข้ามา
	var rows *sql.Rows
	var err error

	if yearInput != "" {
		// filter ตามปี
		rows, err = db.Query("SELECT id, title, author, isbn, year, price, created_at, updated_at FROM books WHERE year = $1", yearInput)
	} else {
		// ถ้าไม่ส่ง year มาจะดึงทั้งหมด
		rows, err = db.Query("SELECT id, title, author, isbn, year, price, created_at, updated_at FROM books")
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var books []Book
	for rows.Next() {
		var book Book
		err := rows.Scan(&book.ID, &book.Title, &book.Author, &book.ISBN, &book.Year, &book.Price, &book.CreatedAt, &book.UpdatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		books = append(books, book)
	}

	if books == nil {
		books = []Book{}
	}

	c.JSON(http.StatusOK, books)
}

func getBook(c *gin.Context) {
	id := c.Param("id")
	var book Book

	// QueryRow ใช้เมื่อคาดว่าจะได้ผลลัพธ์ 0 หรือ 1 แถว
	err := db.QueryRow("SELECT id, title, author FROM books WHERE id = $1", id).
		Scan(&book.ID, &book.Title, &book.Author)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, book)
}
func createBook(c *gin.Context) {
	var newBook Book

	if err := c.ShouldBindJSON(&newBook); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ใช้ RETURNING เพื่อดึงค่าที่ database generate (id, timestamps)
	var id int
	var createdAt, updatedAt time.Time

	err := db.QueryRow(
		`INSERT INTO books (title, author, isbn, year, price)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, created_at, updated_at`,
		newBook.Title, newBook.Author, newBook.ISBN, newBook.Year, newBook.Price,
	).Scan(&id, &createdAt, &updatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	newBook.ID = id
	newBook.CreatedAt = createdAt
	newBook.UpdatedAt = updatedAt

	c.JSON(http.StatusCreated, newBook) // ใช้ 201 Created
}
func updateBook(c *gin.Context) {
	idParam := c.Param("id")
	ID, err := strconv.Atoi(idParam) // แปลง string -> int
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var updateBook Book
	if err := c.ShouldBindJSON(&updateBook); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var updatedAt time.Time
	err = db.QueryRow(
		`UPDATE books
         SET title = $1, author = $2, isbn = $3, year = $4, price = $5
         WHERE id = $6
         RETURNING id, updated_at`,
		updateBook.Title, updateBook.Author, updateBook.ISBN,
		updateBook.Year, updateBook.Price, ID,
	).Scan(&ID, &updatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	updateBook.ID = ID
	updateBook.UpdatedAt = updatedAt
	c.JSON(http.StatusOK, updateBook)
}
func deleteBook(c *gin.Context) {
	id := c.Param("id")

	result, err := db.Exec("DELETE FROM books WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "book deleted successfully"})
}
func main() {
	err := godotenv.Load("../bookstoredatabase/.env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	initDB()
	defer db.Close()
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		err := db.Ping()
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"massage": "unhealthy", "error": err})
			return
		}
		c.JSON(200, gin.H{"status": "OK"})
	})

	api := r.Group("/api/v1")
	{
		api.GET("/books", getAllBooks)
		api.GET("/books/:id", getBook)
		api.POST("/books", createBook)
		api.PUT("/books/:id", updateBook)
		api.DELETE("/books/:id", deleteBook)
	}

	r.Run(":8080")
}
