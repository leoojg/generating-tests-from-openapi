package main

import (
	"fmt"

	openapi "github.com/leoojg/generating-tests-from-openapi/internal"
)

func main() {
	url := "https://api.apis.guru/v2/specs/spotify.com/1.0.0/openapi.json"

	specJSON, err := openapi.GetSpec(url)
	if err != nil {
		fmt.Printf("Error getting OpenAPI specification: %v\n", err)
		return
	}
	swagger, err := openapi.ParseSpec(specJSON)
	if err != nil {
		fmt.Printf("Error parsing OpenAPI specification: %v\n", err)
		return
	}

	fmt.Printf("OpenAPI Version: %s\n", swagger.Info.Version)
}
