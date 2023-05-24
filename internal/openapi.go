package openapi

import (
	"fmt"
	"io"
	"net/http"

	"github.com/go-openapi/spec"
)

// GetSpec retrieves the OpenAPI specification in JSON format from the provided URL.
func GetSpec(url string) ([]byte, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("error making HTTP request: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response body: %v", err)
	}

	return body, nil
}

// ParseSpec parses the OpenAPI specification in JSON format and returns a spec.Swagger object.
func ParseSpec(specJSON []byte) (*spec.Swagger, error) {
	swagger := new(spec.Swagger)
	err := swagger.UnmarshalJSON(specJSON)
	if err != nil {
		return nil, fmt.Errorf("error parsing OpenAPI specification: %v", err)
	}

	return swagger, nil
}
