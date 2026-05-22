import { api } from '@/lib/api';
import type { Entrega, Paginated } from '@/types';

export interface ListEntregasParams {
  desde?: string;
  hasta?: string;
  pacienteId?: string;
  page?: number;
  pageSize?: number;
}

export async function listEntregas(params: ListEntregasParams = {}) {
  const { data } = await api.get<Paginated<Entrega>>('/entregas', { params });
  return data;
}

export async function getEntrega(id: string) {
  const { data } = await api.get<Entrega>(`/entregas/${id}`);
  return data;
}

export interface CreateEntregaInput {
  pacienteId: string;
  diagnostico?: string | null;
  numeroReceta?: string | null;
  observaciones?: string | null;
  items: { medicamentoId: string; cantidad: number; indicaciones?: string | null }[];
}

export async function createEntrega(input: CreateEntregaInput) {
  const { data } = await api.post<Entrega>('/entregas', input);
  return data;
}

export async function anularEntrega(id: string) {
  const { data } = await api.post<Entrega>(`/entregas/${id}/anular`);
  return data;
}
