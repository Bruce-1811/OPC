export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

export function ok<T>(data: T, message = 'ok'): ApiResponse<T> {
  return { code: 0, message, data };
}

export function fail(code: number, message: string): ApiResponse<null> {
  return { code, message, data: null };
}
