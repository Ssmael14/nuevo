import { Prisma, TipoPaciente } from '@prisma/client';
import { prisma } from '../../config/db.js';
import { HttpError } from '../../middlewares/errorHandler.js';
import type {
  CreatePacienteInput,
  UpdatePacienteInput,
} from './pacientes.schemas.js';

interface ListParams {
  q?: string;
  tipo?: TipoPaciente;
  page: number;
  pageSize: number;
}

export async function list(params: ListParams) {
  const where: Prisma.PacienteWhereInput = {};
  if (params.q) {
    where.OR = [
      { codigo: { contains: params.q, mode: 'insensitive' } },
      { dni: { contains: params.q, mode: 'insensitive' } },
      { nombres: { contains: params.q, mode: 'insensitive' } },
      { apellidos: { contains: params.q, mode: 'insensitive' } },
    ];
  }
  if (params.tipo) where.tipo = params.tipo;

  const [total, items] = await Promise.all([
    prisma.paciente.count({ where }),
    prisma.paciente.findMany({
      where,
      orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
  ]);

  return { total, page: params.page, pageSize: params.pageSize, items };
}

export async function getById(id: string) {
  const p = await prisma.paciente.findUnique({
    where: { id },
    include: {
      entregas: {
        take: 10,
        orderBy: { fecha: 'desc' },
        include: { detalles: { include: { medicamento: true } } },
      },
    },
  });
  if (!p) throw new HttpError(404, 'Paciente no encontrado');
  return p;
}

function prepareData(input: CreatePacienteInput | UpdatePacienteInput) {
  const { fechaNacimiento, ...rest } = input;
  return {
    ...rest,
    fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
  } as Prisma.PacienteUncheckedCreateInput;
}

export async function create(data: CreatePacienteInput) {
  const exists = await prisma.paciente.findUnique({ where: { codigo: data.codigo } });
  if (exists) throw new HttpError(409, 'Ya existe un paciente con ese codigo');
  return prisma.paciente.create({ data: prepareData(data) });
}

export async function update(id: string, data: UpdatePacienteInput) {
  await getById(id);
  return prisma.paciente.update({ where: { id }, data: prepareData(data) });
}

export async function remove(id: string) {
  await getById(id);
  return prisma.paciente.update({ where: { id }, data: { activo: false } });
}
