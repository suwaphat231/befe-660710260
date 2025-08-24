package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Student struct
type shoe struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Brand    string  `json:"brand"`
	Price    float64 `json:"price"`
	Stock    int     `json:"stock"`
	Reserved bool    `json:"reserved"`
}

type Customer struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Purchase []shoe `json:"purchase"`
}

// In-memory database
var shoes = []shoe{
	{ID: "1", Name: "Air Force 1", Brand: "Nike", Price: 3500, Stock: 10},
	{ID: "2", Name: "Ultraboost 22", Brand: "Adidas", Price: 4200, Stock: 5},
	{ID: "3", Name: "574 Classic", Brand: "New Balance", Price: 2800, Stock: 8},
}

var customers = []Customer{
	{ID: "1", Name: "John Doe", Email: "john@email.com", Phone: "123-456-7890", Purchase: []shoe{shoes[0], shoes[1]}},
	{ID: "2", Name: "Jane Smith", Email: "jane@email.com", Phone: "987-654-3210", Purchase: []shoe{shoes[2]}},
	{ID: "3", Name: "Alice Johnson", Email: "Alice@email.com", Phone: "555-555-5555", Purchase: []shoe{shoes[1], shoes[2]}},
}

func getShoe(c *gin.Context) {
	IDQuery := c.Query("ID")
	if IDQuery != "" {
		var filter []shoe
		for _, s := range shoes {
			if fmt.Sprint(s.ID) == IDQuery {
				filter = append(filter, s)
			}
		}
		c.JSON(http.StatusOK, filter)
		return
	}
	c.JSON(http.StatusOK, shoes)
}

func reserveShoe(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "shoe id is required"})
		return
	}

	for i, s := range shoes {
		if s.ID == id {
			if s.Reserved {
				c.JSON(http.StatusConflict, gin.H{"message": "Shoe already reserved"})
				return
			}
			shoes[i].Reserved = true
			c.JSON(http.StatusOK, gin.H{
				"message": "Shoe reserved successfully",
				"shoe":    shoes[i],
			})
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Shoe not found"})
}

func main() {
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "healthy"})
	})

	api := r.Group("/api/v1")
	api.GET("/shoes", getShoe)
	api.GET("/reserve", reserveShoe)

	r.Run(":8080")
}
