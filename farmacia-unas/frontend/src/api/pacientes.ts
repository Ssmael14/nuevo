import { api } from '@/lib/api';
import type { Paciente, Paginated, TipoPaciente } from '@/types';

export interface ListPacientesParams {
  q?: string;
  tipo?: TipoPaciente;
  page?: number;
  pageSize?: number;
}

export async function listPacientes(params: ListPacientesParams = {}) {
  const { data } = await api.get<Paginated<Paciente>>('/pacientes', { params });
  return data;
}

export async function getPaciente(id: string) {
  const { data } = await api.get<Paciente & { entregas: unknown[] }>(`/pacientes/${id}`);
  return data;
}

export interface PacienteInput {
  codigo: string;
  dni?: string | null;
  nombres: string;
  apellidos: string;
  tipo: TipoPaciente;
  facultad?: string | null;
  escuela?: string | null;
  telefono?: string | null;
  email?: string | null;
  fechaNacimiento?: string | null;
}

export async function createPaciente(input: PacienteInput) {
  const { data } = await api.post<Paciente>('/pacientes', input);
  return data;
}

export async function updatePaciente(id: string, input: Partial<PacienteInput> & { activo?: boolean }) {
  const { data } = await api.put<Paciente>(`/pacientes/${id}`, input);
  return data;
}

export async function deletePaciente(id: string) {
  await api.delete(`/pacientes/${id}`);
}
