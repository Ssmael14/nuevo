import { api } from '@/lib/api';
import type { Proveedor } from '@/types';

export async function listProveedores(q?: string) {
  const { data } = await api.get<Proveedor[]>('/proveedores', { params: { q } });
  return data;
}

export interface ProveedorInput {
  ruc: string;
  razonSocial: string;
  nombreComercial?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  contacto?: string | null;
}

export async function createProveedor(input: ProveedorInput) {
  const { data } = await api.post<Proveedor>('/proveedores', input);
  return data;
}

export async function updateProveedor(id: string, input: Partial<ProveedorInput> & { activo?: boolean }) {
  const { data } = await api.put<Proveedor>(`/proveedores/${id}`, input);
  return data;
}

export async function deleteProveedor(id: string) {
  await api.delete(`/proveedores/${id}`);
}
