import { api } from '@/lib/api';
import type { Categoria } from '@/types';

export async function listCategorias(): Promise<Categoria[]> {
  const { data } = await api.get<Categoria[]>('/categorias');
  return data;
}

export async function createCategoria(input: { nombre: string; descripcion?: string }) {
  const { data } = await api.post<Categoria>('/categorias', input);
  return data;
}

export async function updateCategoria(
  id: string,
  input: { nombre?: string; descripcion?: string | null },
) {
  const { data } = await api.put<Categoria>(`/categorias/${id}`, input);
  return data;
}

export async function deleteCategoria(id: string) {
  await api.delete(`/categorias/${id}`);
}
