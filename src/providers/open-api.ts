import * as SwaggerParser from 'swagger-parser';
import { OpenAPIV3_1 } from 'openapi-types';
import { HTTP_AVAILABLE_METHODS } from 'src/constants';
import { AxiosRequestConfig } from 'axios';
import { JSONSchemaFaker } from 'json-schema-faker';

type HTTP_METHODS = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';
type OpenApiPath = {
  name: string;
  parameters: Array<OpenAPIV3_1.ParameterObject>;
  methods: {
    [key in HTTP_METHODS]?: {
      parameters: Array<OpenAPIV3_1.ParameterObject>;
      requestBody?: OpenAPIV3_1.RequestBodyObject;
      responses: OpenAPIV3_1.ResponsesObject;
      callbacks?: OpenAPIV3_1.CallbackObject;
      security: Array<OpenAPIV3_1.SecurityRequirementObject>;
      servers: Array<OpenAPIV3_1.ServerObject>;
    };
  };
};

type TestingOption = {
  name: string;
  method: HTTP_METHODS;
  availableParameters: Array<OpenAPIV3_1.ParameterObject>;
  requestBody?: OpenAPIV3_1.RequestBodyObject;
  responses: OpenAPIV3_1.ResponsesObject;
  requests: Array<TestingOptionRequest>;
};

type TestingOptionRequest = AxiosRequestConfig & { isValid: boolean };

type Token = {
  name: string;
  description: string;
  in: 'query' | 'header' | 'cookie' | 'path';
  schema: OpenAPIV3_1.SchemaObject;
};

export class OpenApi {
  private spec: OpenAPIV3_1.Document;
  private url: string;

  private paths: Array<OpenApiPath> = [];
  private testingOptions: Array<TestingOption> = [];

  constructor(url: string) {
    this.url = url;
  }

  async init() {
    this.spec = (await SwaggerParser.dereference(this.url)) as OpenAPIV3_1.Document;
    console.log('Swagger spec loaded. Version: ' + (this.spec as any).openapi);
    this.format();
    // this.generateTests();
    //
  }

  extractTokens() {
    const tokens: Array<Token> = [];
    this.paths.forEach((path) => {});
  }

  format() {
    console.log('Formatting spec...');
    const endpoints = this.getEndpoints();
    for (const endpoint of endpoints) {
      const path: OpenApiPath = {
        name: endpoint,
        parameters: [],
        methods: {},
      };
      const methods = this.getPathMethods(endpoint);
      const pathParameters = this.getEndpointParameters(endpoint);
      if (Array.isArray(pathParameters)) {
        path.parameters.push(
          ...pathParameters.map((parameter) =>
            this.handleReferenceObject<OpenAPIV3_1.ParameterObject>(parameter, this.getParameterObject.bind(this)),
          ),
        );
      }
      for (const method of methods) {
        path.methods[method] = {
          parameters: [],
          requestBody: null,
          responses: {},
          callbacks: {},
          security: [],
          servers: [],
        };

        const parameters = this.getMethodParameters(endpoint, method);
        if (Array.isArray(parameters)) {
          path.methods[method].parameters.push(
            ...parameters.map((parameter) =>
              this.handleReferenceObject<OpenAPIV3_1.ParameterObject>(parameter, this.getParameterObject.bind(this)),
            ),
          );
        }
        const requestBody = this.getRequestBody(endpoint, method);
        path.methods[method].requestBody = this.handleReferenceObject<OpenAPIV3_1.RequestBodyObject>(
          requestBody,
          this.getRequestBodiesObject.bind(this),
        );
        const responses = this.getMethodResponses(endpoint, method);
        path.methods[method].responses = this.handleReferenceObject<OpenAPIV3_1.ResponsesObject>(
          responses,
          this.getResponseObject.bind(this),
        );
        // TODO: study how callbacks, security and servers are used
      }
      this.paths.push(path);
    }
    console.log('Spec formatted.');
  }

  generateTests() {
    console.log('Generating tests...');
    this.paths.forEach((path) => this.generateTest(path));
    console.log('Tests generated.');
  }

  generateRequest(testingOption: TestingOption) {
    const config: TestingOptionRequest = {
      params: {},
      headers: {},
      isValid: true,
    };

    testingOption.availableParameters.forEach((parameter) => {
      switch (parameter.in) {
        case 'query':
          config.params[parameter.name] = this.generateData(parameter.schema as OpenAPIV3_1.SchemaObject, config);
          break;
        case 'header':
          // TODO: implement header support
          break;
        case 'cookie':
          // TODO: implement cookie support
          break;
      }
    });

    if (testingOption.requestBody && testingOption.requestBody.content['application/json']) {
      config.data = this.generateData(testingOption.requestBody.content['application/json'].schema, config);
    }

    if (config.isValid) {
      testingOption.requests.push(config);
    }
  }

  generateData(schema: OpenAPIV3_1.SchemaObject, config: TestingOptionRequest) {
    try {
      return JSONSchemaFaker.generate(schema as any);
    } catch {
      config.isValid = false;
      return null;
    }
  }

  generateTest(path: OpenApiPath) {
    //
    for (const method of Object.keys(path.methods) as HTTP_METHODS[]) {
      const methodConfig = path.methods[method];
      const availableParameters = methodConfig.parameters.concat(
        path.parameters.filter((parameter) => !methodConfig.parameters.find((p) => p.name === parameter.name)),
      );
      const testingOption = {
        name: method.toUpperCase() + ': ' + path.name,
        availableParameters,
        method,
        requestBody: methodConfig.requestBody,
        responses: methodConfig.responses,
        requests: [],
      };
      this.generateRequest(testingOption);
      this.testingOptions.push(testingOption);
    }
  }

  getEndpointParameters(path: string) {
    return this.spec.paths[path].parameters;
  }

  getMethodResponses(path: string, method: HTTP_METHODS) {
    return this.spec.paths[path][method].responses;
  }

  getRequestBody(path: string, method: HTTP_METHODS) {
    return this.spec.paths[path][method].requestBody;
  }

  getMethodParameters(path: string, method: HTTP_METHODS) {
    return this.spec.paths[path][method].parameters;
  }

  getPathMethods(path: string): Array<HTTP_METHODS> {
    const methods = Object.keys(this.spec.paths[path]);
    return methods.filter((method) => HTTP_AVAILABLE_METHODS[method]) as Array<HTTP_METHODS>;
  }

  getEndpoints(): Array<string> {
    const paths = Object.keys(this.spec.paths);
    return paths;
  }

  IsRef(object: unknown): boolean {
    return object?.hasOwnProperty('$ref');
  }

  handleReferenceObject<T>(parameter: T | OpenAPIV3_1.ReferenceObject, resolveReference: (ref: string) => T): T {
    if (this.IsRef(parameter)) {
      return resolveReference(parameter['$ref']);
    }
    return parameter as T;
  }

  getSchemaObject(ref: string): OpenAPIV3_1.SchemaObject {
    return this.spec['components']['schemas'][ref];
  }

  // TODO: check for possible circular references
  getResponseObject(ref: string): OpenAPIV3_1.ResponseObject {
    const response = this.spec['components']['responses'][ref];
    if (response['$ref']) {
      return this.getResponseObject(response['$ref'].split('/').pop());
    }
    return response as OpenAPIV3_1.ResponseObject;
  }

  getParameterObject(ref: string): OpenAPIV3_1.ParameterObject {
    const response = this.spec['components']['responses'][ref];
    if (response['$ref']) {
      return this.getParameterObject(response['$ref'].split('/').pop());
    }
    return response as OpenAPIV3_1.ParameterObject;
  }

  getExampleObject(ref: string): OpenAPIV3_1.ExampleObject {
    return this.spec['components']['examples'][ref];
  }

  getRequestBodiesObject(ref: string): OpenAPIV3_1.RequestBodyObject {
    const response = this.spec['components']['responses'][ref];
    if (response['$ref']) {
      return this.getRequestBodiesObject(response['$ref'].split('/').pop());
    }
    return response as OpenAPIV3_1.RequestBodyObject;
  }

  getHeadersObject(ref: string): OpenAPIV3_1.HeaderObject {
    return this.spec['components']['headers'][ref];
  }

  getSecuritySchemesObject(ref: string): OpenAPIV3_1.SecuritySchemeObject {
    const response = this.spec['components']['responses'][ref];
    if (response['$ref']) {
      return this.getSecuritySchemesObject(response['$ref'].split('/').pop());
    }
    return response as OpenAPIV3_1.SecuritySchemeObject;
  }

  getLinksObject(ref: string): OpenAPIV3_1.LinkObject {
    return this.spec['components']['links'][ref];
  }

  getCallbacksObject(ref: string): OpenAPIV3_1.CallbackObject {
    const response = this.spec['components']['responses'][ref];
    if (response['$ref']) {
      return this.getCallbacksObject(response['$ref'].split('/').pop());
    }
    return response as OpenAPIV3_1.CallbackObject;
  }

  getPathItemsObject(ref: string): OpenAPIV3_1.PathItemObject {
    return this.spec['components']['pathItems'][ref];
  }
}
