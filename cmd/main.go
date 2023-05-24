package main

import (
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/go-openapi/spec"
)

func main() {
	url := "https://api.apis.guru/v2/specs/spotify.com/1.0.0/openapi.json"

	resp, err := http.Get(url)
	if err != nil {
		fmt.Printf("Error making HTTP request: %v\n", err)
		return
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Error reading response body: %v\n", err)
		return
	}

	swagger := new(spec.Swagger)
	err = swagger.UnmarshalJSON(body)
	if err != nil {
		fmt.Printf("Error parsing OpenAPI specification: %v\n", err)
		return
	}

	for path, pathItem := range swagger.Paths.Paths {
		fmt.Println("Path:", path)

		// Retrieve the HTTP methods for the path
		methods := []string{}
		if pathItem.Get != nil {
			methods = append(methods, "GET")
		}
		if pathItem.Post != nil {
			methods = append(methods, "POST")
		}
		if pathItem.Put != nil {
			methods = append(methods, "PUT")
		}
		if pathItem.Delete != nil {
			methods = append(methods, "DELETE")
		}
		// Add support for other HTTP methods as needed

		fmt.Println("Methods:", methods)
		fmt.Println()
	}
}
