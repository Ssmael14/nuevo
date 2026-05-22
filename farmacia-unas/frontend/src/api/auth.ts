import { api } from '@/lib/api';
import type { Usuario } from '@/types';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Usuario;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function logoutApi(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken });
}

export async function getProfile(): Promise<Usuario> {
  const { data } = await api.get<Usuario>('/auth/me');
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/auth/change-password', { currentPassword, newPassword });
}
