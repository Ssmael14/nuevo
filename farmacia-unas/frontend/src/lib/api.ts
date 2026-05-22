import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${api.defaults.baseURL}/auth/refresh`,
      { refreshToken },
    );
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (status === 401 && original && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return api.request(original);
      }
    }

    if (status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        const here = window.location.pathname + window.location.search;
        localStorage.setItem('returnTo', here);
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export function apiErrorMessage(err: unknown, fallback = 'Ocurrio un error'): string {
  const e = err as AxiosError<{ error?: string }>;
  return e.response?.data?.error ?? e.message ?? fallback;
}

export function toastApiError(err: unknown, fallback = 'Ocurrio un error') {
  toast.error(apiErrorMessage(err, fallback));
}
