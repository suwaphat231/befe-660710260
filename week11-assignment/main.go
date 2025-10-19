package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
	_ "week11-assignment/docs"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	_ "github.com/swaggo/swag"
)

type ErrorResponse struct {
	Message string `json:"message"`
}

var db *sql.DB

type Book struct {
	ID     int     `json:"id"`
	Title  string  `json:"title"`
	Author string  `json:"author"`
	ISBN   string  `json:"isbn"`
	Year   int     `json:"year"`
	Price  float64 `json:"price"`

	Category      string   `json:"category"`
	OriginalPrice *float64 `json:"original_price,omitempty"`
	Discount      int      `json:"discount"`
	CoverImage    string   `json:"cover_image"`
	Rating        float64  `json:"rating"`
	ReviewsCount  int      `json:"reviews_count"`
	IsNew         bool     `json:"is_new"`
	Pages         *int     `json:"pages,omitempty"`
	Language      string   `json:"language"`
	Publisher     string   `json:"publisher"`
	Description   string   `json:"description"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func initDB() {
	var err error

	// อ่านค่าจาก environment
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "bookstore_user")
	password := getEnv("DB_PASSWORD", "bookstore_password")
	name := getEnv("DB_NAME", "bookstore")

	// แสดงค่าที่ใช้เชื่อมต่อ (ไม่แสดง password เพื่อความปลอดภัย)
	log.Println("📡 Connecting to database with:")
	log.Printf("Host: %s | Port: %s | User: %s | DB Name: %s\n", host, port, user, name)

	// สร้าง connection string
	conStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, name)

	// เปิด connection
	db, err = sql.Open("postgres", conStr)
	if err != nil {
		log.Fatalf("❌ Failed to open database: %v", err)
	}

	// ตั้งค่า connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(20)
	db.SetConnMaxLifetime(5 * time.Minute)

	// ทดสอบการเชื่อมต่อ
	if err = db.Ping(); err != nil {
		log.Fatalf("❌ Failed to ping database: %v", err)
	}

	log.Println("✅ Successfully connected to database.")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getHealth(c *gin.Context) {
	err := db.Ping()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"message": "Unhealthy", "error": err})
		return
	}
	c.JSON(200, gin.H{"message": "healthy"})
}

// @Summary     Get book by ID
// @Description Get details of specific book
// @Tags        Books
// @Accept      json
// @Produce     json
// @Param       id   path      int  true  "Book ID"
// @Success     200  {object}  Book
// @Failure     404  {object}  ErrorResponse
// @Failure     500  {object}  ErrorResponse
// @Router      /books/{id} [get]
// @Summary     Get book by ID
// @Description Get details of specific book
// @Tags        Books
// @Accept      json
// @Produce     json
// @Param       id   path      int  true  "Book ID"
// @Success     200  {object}  Book
// @Failure     404  {object}  ErrorResponse
// @Failure     500  {object}  ErrorResponse
// @Router      /books/{id} [get]
func getBook(c *gin.Context) {
	id := c.Param("id")
	var book Book

	err := db.QueryRow(`
        SELECT id, title, author, isbn, year, price,
               category, original_price, discount, cover_image,
               rating, reviews_count, is_new, pages,
               language, publisher, description,
               created_at, updated_at
        FROM books WHERE id = $1`, id).
		Scan(
			&book.ID, &book.Title, &book.Author, &book.ISBN, &book.Year, &book.Price,
			&book.Category, &book.OriginalPrice, &book.Discount, &book.CoverImage,
			&book.Rating, &book.ReviewsCount, &book.IsNew, &book.Pages,
			&book.Language, &book.Publisher, &book.Description,
			&book.CreatedAt, &book.UpdatedAt,
		)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, book)
}

// @Summary     Get new books
// @Description Get latest books ordered by created date
// @Tags        Books
// @Accept      json
// @Produce     json
// @Param       limit  query    int  false  "Number of books to return (default 5)"
// @Success     200   {array}   Book
// @Failure     500   {object}  ErrorResponse
// @Router      /books/new [get]
func getNewBooks(c *gin.Context) {
	rows, err := db.Query(`
        SELECT id, title, author, isbn, year, price,
               category, original_price, discount, cover_image,
               rating, reviews_count, is_new, pages,
               language, publisher, description,
               created_at, updated_at
        FROM books 
        WHERE is_new = true
        ORDER BY created_at DESC 
        LIMIT 5
    `)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var books []Book
	for rows.Next() {
		var book Book
		err := rows.Scan(
			&book.ID, &book.Title, &book.Author, &book.ISBN, &book.Year, &book.Price,
			&book.Category, &book.OriginalPrice, &book.Discount, &book.CoverImage,
			&book.Rating, &book.ReviewsCount, &book.IsNew, &book.Pages,
			&book.Language, &book.Publisher, &book.Description,
			&book.CreatedAt, &book.UpdatedAt,
		)
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

// @Summary     Get all books
// @Description Get all books or filter by year/category
// @Tags        Books
// @Accept      json
// @Produce     json
// @Param       year      query  int     false  "Filter by year"
// @Param       category  query  string  false  "Filter by category"
// @Success     200  {array}   Book
// @Failure     500  {object}  ErrorResponse
// @Router      /books [get]
func getAllBooks(c *gin.Context) {
	var rows *sql.Rows
	var err error

	yearQ := c.Query("year")
	categoryQ := c.Query("category")

	baseQuery := `
        SELECT id, title, author, isbn, year, price,
               category, original_price, discount, cover_image,
               rating, reviews_count, is_new, pages,
               language, publisher, description,
               created_at, updated_at
        FROM books
    `

	if yearQ != "" && categoryQ != "" {
		rows, err = db.Query(baseQuery+" WHERE year = $1 AND category = $2", yearQ, categoryQ)
	} else if yearQ != "" {
		rows, err = db.Query(baseQuery+" WHERE year = $1", yearQ)
	} else if categoryQ != "" {
		rows, err = db.Query(baseQuery+" WHERE category = $1", categoryQ)
	} else {
		rows, err = db.Query(baseQuery)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var books []Book
	for rows.Next() {
		var book Book
		err := rows.Scan(
			&book.ID, &book.Title, &book.Author, &book.ISBN, &book.Year, &book.Price,
			&book.Category, &book.OriginalPrice, &book.Discount, &book.CoverImage,
			&book.Rating, &book.ReviewsCount, &book.IsNew, &book.Pages,
			&book.Language, &book.Publisher, &book.Description,
			&book.CreatedAt, &book.UpdatedAt,
		)
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

// @Summary Create a new book
// @Description Create a new book with all fields
// @Tags Books
// @Accept  json
// @Produce  json
// @Param   book  body  Book  true  "Book object"
// @Success 201  {object}  Book
// @Failure 400  {object}  ErrorResponse
// @Failure 500  {object}  ErrorResponse
// @Router  /books [post]
func createBook(c *gin.Context) {
	var newBook Book

	if err := c.ShouldBindJSON(&newBook); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var id int
	var createdAt, updatedAt time.Time

	err := db.QueryRow(`
        INSERT INTO books (
            title, author, isbn, year, price,
            category, original_price, discount, cover_image,
            rating, reviews_count, is_new, pages,
            language, publisher, description
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id, created_at, updated_at`,
		newBook.Title, newBook.Author, newBook.ISBN, newBook.Year, newBook.Price,
		newBook.Category, newBook.OriginalPrice, newBook.Discount, newBook.CoverImage,
		newBook.Rating, newBook.ReviewsCount, newBook.IsNew, newBook.Pages,
		newBook.Language, newBook.Publisher, newBook.Description,
	).Scan(&id, &createdAt, &updatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	newBook.ID = id
	newBook.CreatedAt = createdAt
	newBook.UpdatedAt = updatedAt

	c.JSON(http.StatusCreated, newBook)
}

// @Summary     Update a book
// @Description Update book details by ID
// @Tags        Books
// @Accept      json
// @Produce     json
// @Param       id    path      int   true  "Book ID"
// @Param       book  body      Book  true  "Book object"
// @Success     200  {object}   Book
// @Failure     400  {object}   ErrorResponse
// @Failure     404  {object}   ErrorResponse
// @Failure     500  {object}   ErrorResponse
// @Router      /books/{id} [put]
func updateBook(c *gin.Context) {
	id := c.Param("id")
	var updateBook Book

	if err := c.ShouldBindJSON(&updateBook); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var updatedAt time.Time
	err := db.QueryRow(`
        UPDATE books
        SET title = $1, author = $2, isbn = $3, year = $4, price = $5,
            category = $6, original_price = $7, discount = $8, cover_image = $9,
            rating = $10, reviews_count = $11, is_new = $12, pages = $13,
            language = $14, publisher = $15, description = $16
        WHERE id = $17
        RETURNING updated_at`,
		updateBook.Title, updateBook.Author, updateBook.ISBN, updateBook.Year, updateBook.Price,
		updateBook.Category, updateBook.OriginalPrice, updateBook.Discount, updateBook.CoverImage,
		updateBook.Rating, updateBook.ReviewsCount, updateBook.IsNew, updateBook.Pages,
		updateBook.Language, updateBook.Publisher, updateBook.Description,
		id,
	).Scan(&updatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	updateBook.UpdatedAt = updatedAt
	c.JSON(http.StatusOK, updateBook)
}

// @Summary     Delete a book
// @Description Delete book by ID
// @Tags        Books
// @Accept      json
// @Produce     json
// @Param       id   path      int     true  "Book ID"
// @Success     200  {object}  map[string]interface{}
// @Failure     404  {object}  ErrorResponse
// @Failure     500  {object}  ErrorResponse
// @Router      /books/{id} [delete]
func deleteBook(c *gin.Context) {
	id := c.Param("id")

	result, err := db.Exec("DELETE FROM books WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error message": err.Error()})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error message": err.Error()})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found!!!"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "book deleted successfully"})
}

// @Summary     Get all categories
// @Description Get list of all book categories
// @Tags        Books
// @Accept      json
// @Produce     json
// @Success     200  {array}   string
// @Failure     500  {object}  ErrorResponse
// @Router      /categories [get]
func getCategories(c *gin.Context) {
	rows, err := db.Query(`
        SELECT DISTINCT category 
        FROM books 
        WHERE category IS NOT NULL AND category != ''
        ORDER BY category
    `)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var categories []string
	for rows.Next() {
		var category string
		if err := rows.Scan(&category); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		categories = append(categories, category)
	}

	if categories == nil {
		categories = []string{}
	}
	c.JSON(http.StatusOK, categories)
}

// @Summary     Search books
// @Description Search books by title, author, or description
// @Tags        Books
// @Accept      json
// @Produce     json
// @Param       q  query    string  true  "Search keyword"
// @Success     200  {array}   Book
// @Failure     400  {object}  ErrorResponse
// @Failure     500  {object}  ErrorResponse
// @Router      /books/search [get]
func searchBooks(c *gin.Context) {
	keyword := c.Query("q")
	if keyword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "search keyword is required"})
		return
	}

	searchPattern := "%" + keyword + "%"
	rows, err := db.Query(`
        SELECT id, title, author, isbn, year, price,
               category, original_price, discount, cover_image,
               rating, reviews_count, is_new, pages,
               language, publisher, description,
               created_at, updated_at
        FROM books
        WHERE title ILIKE $1 OR author ILIKE $1 OR description ILIKE $1
        ORDER BY rating DESC, title
    `, searchPattern)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var books []Book
	for rows.Next() {
		var book Book
		err := rows.Scan(
			&book.ID, &book.Title, &book.Author, &book.ISBN, &book.Year, &book.Price,
			&book.Category, &book.OriginalPrice, &book.Discount, &book.CoverImage,
			&book.Rating, &book.ReviewsCount, &book.IsNew, &book.Pages,
			&book.Language, &book.Publisher, &book.Description,
			&book.CreatedAt, &book.UpdatedAt,
		)
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

// @Summary     Get featured books
// @Description Get books with high ratings (4.0+)
// @Tags        Books
// @Accept      json
// @Produce     json
// @Param       limit  query    int  false  "Number of books to return (default 10)"
// @Success     200  {array}   Book
// @Failure     500  {object}  ErrorResponse
// @Router      /books/featured [get]
func getFeaturedBooks(c *gin.Context) {
	limit := c.DefaultQuery("limit", "10")

	rows, err := db.Query(`
        SELECT id, title, author, isbn, year, price,
               category, original_price, discount, cover_image,
               rating, reviews_count, is_new, pages,
               language, publisher, description,
               created_at, updated_at
        FROM books
        WHERE rating >= 4.0
        ORDER BY rating DESC, reviews_count DESC
        LIMIT $1
    `, limit)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var books []Book
	for rows.Next() {
		var book Book
		err := rows.Scan(
			&book.ID, &book.Title, &book.Author, &book.ISBN, &book.Year, &book.Price,
			&book.Category, &book.OriginalPrice, &book.Discount, &book.CoverImage,
			&book.Rating, &book.ReviewsCount, &book.IsNew, &book.Pages,
			&book.Language, &book.Publisher, &book.Description,
			&book.CreatedAt, &book.UpdatedAt,
		)
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

// @Summary     Get discounted books
// @Description Get books with discount greater than 0
// @Tags        Books
// @Accept      json
// @Produce     json
// @Success     200  {array}   Book
// @Failure     500  {object}  ErrorResponse
// @Router      /books/discounted [get]
func getDiscountedBooks(c *gin.Context) {
	rows, err := db.Query(`
        SELECT id, title, author, isbn, year, price,
               category, original_price, discount, cover_image,
               rating, reviews_count, is_new, pages,
               language, publisher, description,
               created_at, updated_at
        FROM books
        WHERE discount > 0
        ORDER BY discount DESC, rating DESC
    `)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var books []Book
	for rows.Next() {
		var book Book
		err := rows.Scan(
			&book.ID, &book.Title, &book.Author, &book.ISBN, &book.Year, &book.Price,
			&book.Category, &book.OriginalPrice, &book.Discount, &book.CoverImage,
			&book.Rating, &book.ReviewsCount, &book.IsNew, &book.Pages,
			&book.Language, &book.Publisher, &book.Description,
			&book.CreatedAt, &book.UpdatedAt,
		)
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

// @title           Simple API Example
// @version         1.0
// @description     This is a simple example of using Gin with Swagger.
// @host            localhost:8080
// @BasePath        /api/v1
func main() {
	initDB()
	defer db.Close()

	r := gin.Default()
	r.GET("/health", getHealth)

	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	r.Use(cors.New(config))

	r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	api := r.Group("/api/v1")
	{
		api.GET("/books", getAllBooks)
		api.GET("/books/new", getNewBooks)
		api.GET("/books/search", searchBooks)
		api.GET("/books/featured", getFeaturedBooks)
		api.GET("/books/discounted", getDiscountedBooks)
		api.GET("/books/:id", getBook)
		api.POST("/books", createBook)
		api.PUT("/books/:id", updateBook)
		api.DELETE("/books/:id", deleteBook)
		api.GET("/categories", getCategories) // ✅ ตรวจสอบว่ามีบรรทัดนี้
	}

	r.Run(":8080")
}
