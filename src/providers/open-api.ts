import * as SwaggerParser from 'swagger-parser';
import { OpenAPIV3_1 } from 'openapi-types';
import { Validator } from 'jsonschema';
import {
  HTTP_AVAILABLE_METHODS,
  HttpMethods,
  AVAILABLE_FOR_TESTING,
  Token,
  MappedToken,
  TestingOptionRequest,
  TestingOptionResponse,
  Evaluate,
} from 'src/constants';

type OpenApiPath = {
  name: string;
  parameters: Array<OpenAPIV3_1.ParameterObject>;
  methods: {
    [key in HttpMethods]?: {
      parameters: Array<OpenAPIV3_1.ParameterObject>;
      requestBody?: OpenAPIV3_1.RequestBodyObject;
      responses: OpenAPIV3_1.ResponsesObject;
      callbacks?: OpenAPIV3_1.CallbackObject;
      security: Array<OpenAPIV3_1.SecurityRequirementObject>;
      servers: Array<OpenAPIV3_1.ServerObject>;
    };
  };
};

export class OpenApi {
  private spec: OpenAPIV3_1.Document;
  private url: string;

  private paths: Array<OpenApiPath> = [];

  constructor(url: string) {
    this.url = url;
  }

  async init() {
    this.spec = (await SwaggerParser.dereference(this.url)) as OpenAPIV3_1.Document;
    console.log('Swagger spec loaded. Version: ' + (this.spec as any).openapi);
    this.format();
    this.extractTokens();
  }

  getTitle() {
    return this.spec.info.title;
  }

  getSpec() {
    return this.spec;
  }

  extractTokens() {
    const testingMethods = Object.keys(HTTP_AVAILABLE_METHODS).filter(
      (method) => AVAILABLE_FOR_TESTING[method],
    ) as Array<HttpMethods>;
    const tokens: Map<string, Token> = new Map();
    this.paths.forEach((path) => {
      testingMethods.forEach((method) => {
        if (path.methods[method]) {
          const possibleTokens: Map<string, OpenAPIV3_1.ParameterObject> = new Map();
          path.methods[method].parameters.forEach((parameter: OpenAPIV3_1.ParameterObject) => {
            possibleTokens.set(parameter.name, parameter);
          });
          path.parameters.forEach((parameter) => {
            possibleTokens.set(parameter.name, parameter);
          });
          for (const parameter of possibleTokens.values()) {
            if (parameter.in === 'path' || parameter.in === 'query') {
              tokens.set(parameter.name, {
                name: parameter.name,
                description: parameter.description,
                in: parameter.in,
                schema: parameter.schema as OpenAPIV3_1.SchemaObject,
              });
            }
          }
        }
      });
    });
    return tokens;
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

  generateTests(mappedTokens: Record<string, MappedToken>, quantity: number) {
    const testCases: Array<TestingOptionRequest> = [];
    console.log('Generating tests...');
    this.paths.forEach((path) => {
      const methods = Object.keys(path.methods) as Array<HttpMethods>;
      for (const method of methods) {
        if (AVAILABLE_FOR_TESTING[method]) {
          const methodConfig = path.methods[method];
          const availableParameters = methodConfig.parameters.concat(
            path.parameters.filter((parameter) => !methodConfig.parameters.find((p) => p.name === parameter.name)),
          );
          for (let i = 0; i < quantity; i++) {
            const testCase: TestingOptionRequest = {
              baseURL: this.spec.servers[0].url,
              method,
              url: path.name,
              path: path.name,
            };
            availableParameters.forEach((parameter) => {
              const selectedValue =
                mappedTokens[parameter.name].availableTokens[
                  Math.ceil(Math.random() * mappedTokens[parameter.name].availableTokens.length) %
                    mappedTokens[parameter.name].availableTokens.length
                ];
              if (parameter.in === 'path') {
                testCase.url = testCase.url.replace(`{${parameter.name}}`, encodeURIComponent(selectedValue as string));
              }
              if (parameter.in === 'query' && (parameter.required || Math.random() > 0.5)) {
                testCase.params = {
                  ...testCase.params,
                  [parameter.name]: selectedValue,
                };
              }
            });
            testCases.push(testCase);
            if (availableParameters.length === 0) {
              break;
            }
          }
        }
      }
    });
    console.log('Tests generated.');
    return testCases;
  }

  evaluateResponses(results: Array<TestingOptionResponse>) {
    const validator = new Validator();
    const pathEvaluation: Record<string, Evaluate> = {};
    results.forEach((result) => {
      const { path, method } = result;

      if (!pathEvaluation[path]) {
        pathEvaluation[path] = {
          success: true,
          successfullRequests: 0,
          failedRequests: 0,
          totalRequests: 0,
          failedRequestsDetails: [],
          successRate: 0,
          errors: [],
        };
      }
      pathEvaluation[path].totalRequests++;

      const responses = this.spec.paths[path][method as HttpMethods].responses;
      if (!responses[result.status]) {
        pathEvaluation[path].errors.push(`Response ${result.status} not defined`);
        pathEvaluation[path].failedRequestsDetails.push(result);
        pathEvaluation[path].success = false;
        pathEvaluation[path].failedRequests++;
        return;
      }

      const schema = (responses[String(result.status)] as OpenAPIV3_1.ResponseObject).content['application/json']
        .schema as OpenAPIV3_1.SchemaObject;

      try {
        const validation = validator.validate(schema, result.data);
        if (!validation.valid) {
          throw new Error(validation.errors[0].message);
        }
      } catch (error) {
        pathEvaluation[path].errors.push(error);
        pathEvaluation[path].failedRequestsDetails.push(result);
        pathEvaluation[path].success = false;
        pathEvaluation[path].failedRequests++;
        return;
      }

      pathEvaluation[path].successfullRequests++;
    });
    Object.keys(pathEvaluation).forEach((path) => {
      pathEvaluation[path].successRate = pathEvaluation[path].successfullRequests / pathEvaluation[path].totalRequests;
    });
    return pathEvaluation;
  }

  getEndpointParameters(path: string) {
    return this.spec.paths[path].parameters;
  }

  getMethodResponses(path: string, method: HttpMethods) {
    return this.spec.paths[path][method].responses;
  }

  getRequestBody(path: string, method: HttpMethods) {
    return this.spec.paths[path][method].requestBody;
  }

  getMethodParameters(path: string, method: HttpMethods) {
    return this.spec.paths[path][method].parameters;
  }

  getPathMethods(path: string): Array<HttpMethods> {
    const methods = Object.keys(this.spec.paths[path]);
    return methods.filter((method) => HTTP_AVAILABLE_METHODS[method]) as Array<HttpMethods>;
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
