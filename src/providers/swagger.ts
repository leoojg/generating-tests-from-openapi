import * as SwaggerParser from 'swagger-parser';
import { OpenAPI } from 'openapi-types';

export class Swagger {
  private spec: OpenAPI.Document;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async init() {
    this.spec = await SwaggerParser.parse(this.url);
    console.log('Swagger spec loaded. Version: ' + (this.spec as any).openapi);
  }

  getEndpoints(): Array<string> {
    const paths = Object.keys(this.spec.paths);
    return paths;
  }

  getReference(ref: string) {
    // TODO: split ref by "/" and access each position of this.spec.components
    // by default this.spec doesn't have a property called "components"
    return (this.spec as any).components.parameters.provider;
  }
}
