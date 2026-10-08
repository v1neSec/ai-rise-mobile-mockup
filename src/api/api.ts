import { create, isAxiosError, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '@/src/utils/config';
import { tokenStorage } from './tokenStorage';

export const api = create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let onUnauthorizedCallback: () => void = () => {};
export const setUnauthorizedCallback = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

const isPublicRequest = (config: InternalAxiosRequestConfig) => {
  const path = (config.url ?? '').split('?')[0];
  return ['/token/', '/token/refresh/'].includes(path)
    || (config.method === 'post' && ['/passenger/', '/driver/'].includes(path))
    || (path.startsWith('/dashboard/') && !path.startsWith('/dashboard/admin/'));
};

api.interceptors.request.use(async (config) => {
  if (!isPublicRequest(config)) {
    const token = await tokenStorage.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  // Let Axios generate the multipart boundary for photo uploads.
  if (config.data instanceof FormData) config.headers.delete('Content-Type');
  return config;
});

let isHandling401 = false;
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config;
    if (error.response?.status === 401 && config && !isPublicRequest(config) && !isHandling401) {
      isHandling401 = true;
      try {
        const currentToken = await tokenStorage.getAccessToken();
        // A delayed response from an old session must not log out a new one.
        if (currentToken && config.headers.Authorization === `Bearer ${currentToken}`) {
          try { await tokenStorage.clearTokens(); }
          finally { onUnauthorizedCallback(); }
        }
      } catch {
        // Preserve the original request error for the screen's error handler.
      } finally { isHandling401 = false; }
    }
    return Promise.reject(error);
  },
);

export const getApiErrorMessage = (error: unknown): string => {
  if (!isAxiosError(error)) return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  if (!error.response) return error.code === 'ECONNABORTED'
    ? 'The request timed out. Please try again.'
    : 'Cannot reach the server. Check your connection and try again.';
  if (error.response.status >= 500) return 'The server is having a problem. Please try again later.';
  const collect = (value: unknown): string[] => {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(collect);
    if (value && typeof value === 'object') return Object.values(value).flatMap(collect);
    return [];
  };
  const data: unknown = error.response.data;
  return (typeof data === 'object' && data !== null ? collect(data).join('\n') : '')
    || `Request failed (${error.response.status}). Please try again.`;
};
