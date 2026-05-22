import { api } from '@/lib/api';
import type { FormaFarmaceutica, Medicamento, Paginated } from '@/types';

export interface ListMedicamentosParams {
  q?: string;
  categoriaId?: string;
  soloActivos?: 'true' | 'false';
  page?: number;
  pageSize?: number;
}

export async function listMedicamentos(
  params: ListMedicamentosParams = {},
): Promise<Paginated<Medicamento>> {
  const { data } = await api.get<Paginated<Medicamento>>('/medicamentos', { params });
  return data;
}

export interface CreateMedicamentoInput {
  codigo: string;
  nombre: string;
  principioActivo?: string;
  concentracion?: string;
  formaFarmaceutica: FormaFarmaceutica;
  presentacion?: string;
  requiereReceta: boolean;
  stockMinimo: number;
  categoriaId?: string | null;
}

export async function createMedicamento(input: CreateMedicamentoInput) {
  const { data } = await api.post<Medicamento>('/medicamentos', input);
  return data;
}

export async function updateMedicamento(
  id: string,
  input: Partial<CreateMedicamentoInput> & { activo?: boolean },
) {
  const { data } = await api.put<Medicamento>(`/medicamentos/${id}`, input);
  return data;
}

export async function deleteMedicamento(id: string) {
  await api.delete(`/medicamentos/${id}`);
}
