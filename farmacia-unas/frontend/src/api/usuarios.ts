import { api } from '@/lib/api';
import type { RolUsuario, Usuario } from '@/types';

export async function listUsuarios() {
  const { data } = await api.get<Usuario[]>('/usuarios');
  return data;
}

export interface UsuarioInput {
  nombres: string;
  apellidos: string;
  email: string;
  password?: string;
  rol: RolUsuario;
}

export async function createUsuario(input: UsuarioInput & { password: string }) {
  const { data } = await api.post<Usuario>('/usuarios', input);
  return data;
}

export async function updateUsuario(
  id: string,
  input: Partial<UsuarioInput> & { activo?: boolean },
) {
  const { data } = await api.put<Usuario>(`/usuarios/${id}`, input);
  return data;
}

export async function deleteUsuario(id: string) {
  await api.delete(`/usuarios/${id}`);
}
