import { api } from '@/lib/api';
import type { Usuario } from '@/types';

export interface LoginResponse {
  token: string;
  user: Usuario;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function getProfile(): Promise<Usuario> {
  const { data } = await api.get<Usuario>('/auth/me');
  return data;
}
