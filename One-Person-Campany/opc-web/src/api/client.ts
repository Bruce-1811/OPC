import axios from 'axios';

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

export const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

const TOKEN_KEY = 'token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export async function getHealth() {
  const { data } = await http.get<ApiResponse<{ status: string }>>('/health');
  return data;
}
