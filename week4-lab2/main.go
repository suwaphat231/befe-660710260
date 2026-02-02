package main

import (
	"fmt"
)

// var email string = "suwapatch@gmail.com" ถ้าอยู่ข้างนอกฟังก์ชัน ต้องใส่ var

func main() {
	//var name string = "Suwaphat"
	var age int = 20

	email := "Suwpatch@gmail.com"
	gpa := 3.85

	firstname, lastname := "Suwaphat", "watthakicharoen"

	fmt.Printf("Name %s %s, age %d, email %s, gpa %.2f\n", firstname, lastname, age, email, gpa)

}
