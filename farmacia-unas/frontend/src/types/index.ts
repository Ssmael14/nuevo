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

export type TipoPaciente = 'ALUMNO' | 'DOCENTE' | 'ADMINISTRATIVO';

export type EstadoEntrega = 'ENTREGADA' | 'ANULADA';

export interface Usuario {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol: RolUsuario;
  activo?: boolean;
  createdAt?: string;
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
  codigoBarras?: string | null;
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

export interface Paciente {
  id: string;
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
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Proveedor {
  id: string;
  ruc: string;
  razonSocial: string;
  nombreComercial?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  contacto?: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lote {
  id: string;
  numeroLote: string;
  medicamentoId: string;
  medicamento?: { id: string; codigo: string; nombre: string };
  cantidadInicial: number;
  cantidadActual: number;
  fechaIngreso: string;
  fechaVencimiento: string;
  precioUnitario?: string | null;
  proveedorId?: string | null;
  proveedor?: { id: string; razonSocial: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface DetalleEntrega {
  id: string;
  cantidad: number;
  indicaciones?: string | null;
  medicamento: { id: string; codigo: string; nombre: string };
  lote: { id: string; numeroLote: string; fechaVencimiento: string };
}

export interface Entrega {
  id: string;
  numero: string;
  fecha: string;
  estado: EstadoEntrega;
  diagnostico?: string | null;
  numeroReceta?: string | null;
  observaciones?: string | null;
  paciente: Pick<Paciente, 'id' | 'codigo' | 'nombres' | 'apellidos' | 'tipo'>;
  usuario: { id: string; nombres: string; apellidos: string };
  detalles: DetalleEntrega[];
}

export interface DashboardStats {
  totalMedicamentos: number;
  totalPacientes: number;
  entregasHoy: number;
  entregasMes: number;
  lotesPorVencer: number;
  medicamentosStockBajo: number;
}

export interface Configuracion {
  id: string;
  nombreInstitucion: string;
  nombreFarmacia: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  rucInstitucion?: string | null;
  mostrarDemoLogin: boolean;
  permitirRegistroAuto: boolean;
  diasAlertaVencimiento: number;
  textoComprobante?: string | null;
  logoUrl?: string | null;
  updatedAt: string;
}

export interface PublicConfiguracion {
  nombreInstitucion: string;
  nombreFarmacia: string;
  mostrarDemoLogin: boolean;
  logoUrl?: string | null;
}

export interface Paginated<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}
