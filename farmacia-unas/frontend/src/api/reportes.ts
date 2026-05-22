import { api } from '@/lib/api';
import type { DashboardStats } from '@/types';

export async function getDashboard() {
  const { data } = await api.get<DashboardStats>('/reportes/dashboard');
  return data;
}

export async function getEntregasPorDia(dias = 30) {
  const { data } = await api.get<{ dia: string; cantidad: number }[]>(
    '/reportes/entregas-por-dia',
    { params: { dias } },
  );
  return data;
}

export async function getEntregasPorTipo(dias = 30) {
  const { data } = await api.get<{ tipo: string; cantidad: number }[]>(
    '/reportes/entregas-por-tipo',
    { params: { dias } },
  );
  return data;
}

export async function getTopMedicamentos(limit = 10, dias = 90) {
  const { data } = await api.get<
    { id: string; codigo: string; nombre: string; total: number }[]
  >('/reportes/top-medicamentos', { params: { limit, dias } });
  return data;
}

export async function getStockPorCategoria() {
  const { data } = await api.get<{ categoria: string; stock: number }[]>(
    '/reportes/stock-por-categoria',
  );
  return data;
}
