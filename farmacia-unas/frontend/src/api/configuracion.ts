import { api } from '@/lib/api';
import type { Configuracion, PublicConfiguracion } from '@/types';

export async function getConfiguracion(): Promise<Configuracion> {
  const { data } = await api.get<Configuracion>('/configuracion');
  return data;
}

export async function getConfiguracionPublica(): Promise<PublicConfiguracion> {
  const { data } = await api.get<PublicConfiguracion>('/configuracion/public');
  return data;
}

export interface ConfiguracionInput {
  nombreInstitucion?: string;
  nombreFarmacia?: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  rucInstitucion?: string | null;
  mostrarDemoLogin?: boolean;
  permitirRegistroAuto?: boolean;
  diasAlertaVencimiento?: number;
  textoComprobante?: string | null;
  logoUrl?: string | null;
}

export async function updateConfiguracion(input: ConfiguracionInput): Promise<Configuracion> {
  const { data } = await api.put<Configuracion>('/configuracion', input);
  return data;
}
