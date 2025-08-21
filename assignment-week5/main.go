package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Student struct
type shoe struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Brand string  `json:"brand"`
	Price float64 `json:"price"`
	Stock int     `json:"stock"`
}

// In-memory database
var shoes = []shoe{
	{ID: "1", Name: "Air Force 1", Brand: "Nike", Price: 3500, Stock: 10},
	{ID: "2", Name: "Ultraboost 22", Brand: "Adidas", Price: 4200, Stock: 5},
	{ID: "3", Name: "574 Classic", Brand: "New Balance", Price: 2800, Stock: 8},
}

func getShoe(c *gin.Context) {
	IDQuery := c.Query("ID")
	if IDQuery != "" {
		var filter []shoe
		for _, shoes := range shoes {
			if fmt.Sprint(shoes.ID) == IDQuery {
				filter = append(filter, shoes)
			}
		}
		c.JSON(http.StatusOK, filter)
		return
	}
	c.JSON(http.StatusOK, shoes)
}

func main() {
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "healthy"})
	})

	api := r.Group("/api/v1")
	api.GET("/shoes", getShoe)

	r.Run(":8080")
}
