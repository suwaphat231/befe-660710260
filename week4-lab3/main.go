package main

import (
	"errors"
	"fmt"
)

type Student struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Email string  `json:"email"`
	Year  int     `json:"year"`
	GPA   float64 `json:"gpa"`
}

func (s *Student) IsHonor() bool {
	return s.GPA >= 3.50
}

func (s *Student) Validate() error {
	if s.Name == "" {
		return errors.New("name is required")
	}
	if s.Year < 1 || s.Year > 4 {
		return errors.New("year must be between 1 and 4")
	}
	if s.GPA < 0 || s.GPA > 4. {
		return errors.New("GPA must be between 0.0 and 4.0")
	}
	return nil
}

func main() {

	// st := Student({ID:"1", Name: "Suwaphat", Email:"suwapatch@gmail.com", Year:4, GPA:3.85})
	students := []Student{
		{ID: "1", Name: "Suwaphat", Email: "suwapatch@gmail.com", Year: 4, GPA: 3.85},
		{ID: "2", Name: "John", Email: "John@gmail.com", Year: 3, GPA: 2.85},
	}
	newStudent := Student{ID: "3", Name: "Arthur", Email: "Arthur@hotmail.com", Year: 2, GPA: 3.75}
	students = append(students, newStudent)

	for i, student := range students {
		fmt.Printf("%d Honor = %v\n", i, student.IsHonor())
		fmt.Printf("%d Validation = %v\n", i, student.Validate())
	}

}
