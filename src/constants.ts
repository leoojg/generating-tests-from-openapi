import { AxiosRequestConfig } from 'axios';
import { OpenAPIV3_1 } from 'openapi-types';

export const HTTP_AVAILABLE_METHODS = {
  get: true,
  put: true,
  post: true,
  delete: true,
  options: true,
  head: true,
  patch: true,
  trace: true,
} as const;
export type HttpMethods = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';

export const AVAILABLE_FOR_TESTING = {
  get: true,
  put: false,
  post: false,
  delete: false,
  options: false,
  head: false,
  patch: false,
  trace: false,
} as const;

export type MappedToken = {
  token: Token;
  availableTokens: Array<unknown>;
};

export type Token = {
  name: string;
  description: string;
  in: 'query' | 'path';
  schema: OpenAPIV3_1.SchemaObject;
};

export type TestingOptionRequest = AxiosRequestConfig & { path: string };
export type TestingOptionResponse = { data: unknown; status: number } & TestingOptionRequest;

type Evaluation = {
  total: number;
  success: number;
  failed: number;
  unknown: number;
};

type StatusEvaluation = '2xx' | '4xx' | '5xx' | 'unknown';

export type EvaluationStatus = {
  [key in StatusEvaluation]?: Evaluation;
};

export type StatusResponse = { [key in StatusEvaluation]?: Array<TestingOptionResponse> };
