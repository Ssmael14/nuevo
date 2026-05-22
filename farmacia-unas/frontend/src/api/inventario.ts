import { api } from '@/lib/api';
import type { Lote, Paginated } from '@/types';

export interface ListLotesParams {
  medicamentoId?: string;
  proveedorId?: string;
  porVencerDias?: number;
  soloConStock?: 'true' | 'false';
  page?: number;
  pageSize?: number;
}

export async function listLotes(params: ListLotesParams = {}) {
  const { data } = await api.get<Paginated<Lote>>('/inventario/lotes', { params });
  return data;
}

export interface CreateLoteInput {
  medicamentoId: string;
  numeroLote: string;
  cantidadInicial: number;
  fechaVencimiento: string;
  precioUnitario?: number | null;
  proveedorId?: string | null;
}

export async function createLote(input: CreateLoteInput) {
  const { data } = await api.post<Lote>('/inventario/lotes', input);
  return data;
}

export async function updateLote(
  id: string,
  input: Partial<{
    numeroLote: string;
    cantidadActual: number;
    fechaVencimiento: string;
    precioUnitario: number | null;
    proveedorId: string | null;
  }>,
) {
  const { data } = await api.put<Lote>(`/inventario/lotes/${id}`, input);
  return data;
}

export async function deleteLote(id: string) {
  await api.delete(`/inventario/lotes/${id}`);
}

export async function getStockCritico() {
  const { data } = await api.get<
    { id: string; codigo: string; nombre: string; stockMinimo: number; stockActual: number }[]
  >('/inventario/stock-critico');
  return data;
}

export async function getPorVencer(dias = 90) {
  const { data } = await api.get<Lote[]>('/inventario/por-vencer', { params: { dias } });
  return data;
}
