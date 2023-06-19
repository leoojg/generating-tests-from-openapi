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
export type HTTP_METHODS = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';

export const HTTP_METHODS_AVAILABLE_FOR_TESTING = {
  get: true,
  put: false,
  post: false,
  delete: false,
  options: false,
  head: false,
  patch: false,
  trace: false,
} as const;
