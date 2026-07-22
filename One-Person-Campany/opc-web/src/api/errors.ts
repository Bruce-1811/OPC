import axios from 'axios';
import type { ApiResponse } from './client';

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiResponse | undefined;
    if (body?.message) return body.message;
    if (error.response?.status === 500) return '服务器错误，请查看后端日志';
  }
  return fallback;
}
