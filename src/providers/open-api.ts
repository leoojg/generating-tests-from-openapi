import * as SwaggerParser from 'swagger-parser';
import { OpenAPI, OpenAPIV3_1 } from 'openapi-types';

export class OpenApi {
  private spec: OpenAPIV3_1.Document;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async init() {
    this.spec = (await SwaggerParser.parse(this.url)) as OpenAPIV3_1.Document;
    console.log('Swagger spec loaded. Version: ' + (this.spec as any).openapi);

    const firstPath = this.getEndpoints()[0];
    const path = this.spec.paths[firstPath];
    const response = path.get.responses['200'];
    console.log(response);
  }

  getEndpoints(): Array<string> {
    const paths = Object.keys(this.spec.paths);
    return paths;
  }

  handleComponentObject(
    ref: string,
  ):
    | OpenAPIV3_1.SchemaObject
    | OpenAPIV3_1.ResponsesObject
    | OpenAPIV3_1.ParameterObject
    | OpenAPIV3_1.ExampleObject
    | OpenAPIV3_1.RequestBodyObject
    | OpenAPIV3_1.HeaderObject
    | OpenAPIV3_1.SecuritySchemeObject
    | OpenAPIV3_1.LinkObject
    | OpenAPIV3_1.CallbackObject
    | OpenAPIV3_1.PathItemObject {
    const type = ref.split('/')[2];
    switch (type) {
      case 'schemas':
        return this.getSchemaObject(ref);
      case 'responses':
        return this.getResponseObject(ref);
      case 'parameters':
        return this.getParameterObject(ref);
      case 'examples':
        return this.getExampleObject(ref);
      case 'requestBodies':
        return this.getRequestBodiesObject(ref);
      case 'headers':
        return this.getHeadersObject(ref);
      case 'securitySchemes':
        return this.getSecuritySchemesObject(ref);
      case 'links':
        return this.getLinksObject(ref);
      case 'callbacks':
        return this.getCallbacksObject(ref);
      case 'pathItems':
        return this.getPathItemsObject(ref);
    }
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
