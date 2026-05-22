export type RolUsuario = 'ADMIN' | 'FARMACEUTICO' | 'ALMACENERO' | 'AUXILIAR';

export type FormaFarmaceutica =
  | 'TABLETA'
  | 'CAPSULA'
  | 'JARABE'
  | 'INYECTABLE'
  | 'CREMA'
  | 'SUSPENSION'
  | 'GOTAS'
  | 'SUPOSITORIO'
  | 'OTRO';

export interface Usuario {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol: RolUsuario;
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string | null;
  createdAt: string;
  _count?: { medicamentos: number };
}

export interface Medicamento {
  id: string;
  codigo: string;
  nombre: string;
  principioActivo?: string | null;
  concentracion?: string | null;
  formaFarmaceutica: FormaFarmaceutica;
  presentacion?: string | null;
  requiereReceta: boolean;
  stockMinimo: number;
  activo: boolean;
  categoriaId?: string | null;
  categoria?: { id: string; nombre: string } | null;
  stockTotal?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}
