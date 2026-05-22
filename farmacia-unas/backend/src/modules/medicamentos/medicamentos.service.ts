import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db.js';
import { HttpError } from '../../middlewares/errorHandler.js';
import type {
  CreateMedicamentoInput,
  UpdateMedicamentoInput,
} from './medicamentos.schemas.js';

interface ListParams {
  q?: string;
  categoriaId?: string;
  soloActivos?: 'true' | 'false';
  page: number;
  pageSize: number;
}

export async function list(params: ListParams) {
  const where: Prisma.MedicamentoWhereInput = {};
  if (params.q) {
    where.OR = [
      { nombre: { contains: params.q, mode: 'insensitive' } },
      { codigo: { contains: params.q, mode: 'insensitive' } },
      { principioActivo: { contains: params.q, mode: 'insensitive' } },
    ];
  }
  if (params.categoriaId) where.categoriaId = params.categoriaId;
  if (params.soloActivos === 'true') where.activo = true;
  if (params.soloActivos === 'false') where.activo = false;

  const [total, items] = await Promise.all([
    prisma.medicamento.count({ where }),
    prisma.medicamento.findMany({
      where,
      include: {
        categoria: { select: { id: true, nombre: true } },
        lotes: { select: { cantidadActual: true } },
      },
      orderBy: { nombre: 'asc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
  ]);

  return {
    total,
    page: params.page,
    pageSize: params.pageSize,
    items: items.map(({ lotes, ...m }) => ({
      ...m,
      stockTotal: lotes.reduce((acc, l) => acc + l.cantidadActual, 0),
    })),
  };
}

export async function getById(id: string) {
  const med = await prisma.medicamento.findUnique({
    where: { id },
    include: {
      categoria: true,
      lotes: { orderBy: { fechaVencimiento: 'asc' } },
    },
  });
  if (!med) throw new HttpError(404, 'Medicamento no encontrado');
  return med;
}

export async function create(data: CreateMedicamentoInput) {
  const exists = await prisma.medicamento.findUnique({ where: { codigo: data.codigo } });
  if (exists) throw new HttpError(409, 'Ya existe un medicamento con ese codigo');
  return prisma.medicamento.create({ data });
}

export async function update(id: string, data: UpdateMedicamentoInput) {
  await getById(id);
  if (data.codigo) {
    const otro = await prisma.medicamento.findFirst({
      where: { codigo: data.codigo, NOT: { id } },
    });
    if (otro) throw new HttpError(409, 'Ya existe otro medicamento con ese codigo');
  }
  return prisma.medicamento.update({ where: { id }, data });
}

export async function remove(id: string) {
  await getById(id);
  const tieneLotes = await prisma.lote.count({ where: { medicamentoId: id } });
  if (tieneLotes > 0) {
    // Soft delete: marcamos inactivo en lugar de borrar para conservar historial
    return prisma.medicamento.update({ where: { id }, data: { activo: false } });
  }
  return prisma.medicamento.delete({ where: { id } });
}
