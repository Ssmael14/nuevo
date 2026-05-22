import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db.js';
import { HttpError } from '../../middlewares/errorHandler.js';
import type { CreateLoteInput, UpdateLoteInput } from './inventario.schemas.js';

interface ListParams {
  medicamentoId?: string;
  proveedorId?: string;
  porVencerDias?: number;
  soloConStock?: 'true' | 'false';
  page: number;
  pageSize: number;
}

export async function listLotes(params: ListParams) {
  const where: Prisma.LoteWhereInput = {};
  if (params.medicamentoId) where.medicamentoId = params.medicamentoId;
  if (params.proveedorId) where.proveedorId = params.proveedorId;
  if (params.porVencerDias) {
    const limit = new Date(Date.now() + params.porVencerDias * 24 * 60 * 60 * 1000);
    where.fechaVencimiento = { lte: limit, gte: new Date() };
  }
  if (params.soloConStock === 'true') where.cantidadActual = { gt: 0 };

  const [total, items] = await Promise.all([
    prisma.lote.count({ where }),
    prisma.lote.findMany({
      where,
      orderBy: { fechaVencimiento: 'asc' },
      include: {
        medicamento: { select: { id: true, codigo: true, nombre: true } },
        proveedor: { select: { id: true, razonSocial: true } },
      },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
  ]);

  return { total, page: params.page, pageSize: params.pageSize, items };
}

export async function createLote(data: CreateLoteInput) {
  const med = await prisma.medicamento.findUnique({ where: { id: data.medicamentoId } });
  if (!med) throw new HttpError(404, 'Medicamento no encontrado');

  const dup = await prisma.lote.findUnique({
    where: { medicamentoId_numeroLote: { medicamentoId: data.medicamentoId, numeroLote: data.numeroLote } },
  });
  if (dup) throw new HttpError(409, 'Ya existe un lote con ese numero para este medicamento');

  return prisma.lote.create({
    data: {
      medicamentoId: data.medicamentoId,
      numeroLote: data.numeroLote,
      cantidadInicial: data.cantidadInicial,
      cantidadActual: data.cantidadInicial,
      fechaVencimiento: new Date(data.fechaVencimiento),
      precioUnitario: data.precioUnitario ?? undefined,
      proveedorId: data.proveedorId ?? undefined,
    },
  });
}

export async function updateLote(id: string, data: UpdateLoteInput) {
  const lote = await prisma.lote.findUnique({ where: { id } });
  if (!lote) throw new HttpError(404, 'Lote no encontrado');

  return prisma.lote.update({
    where: { id },
    data: {
      ...data,
      fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : undefined,
    },
  });
}

export async function removeLote(id: string) {
  const lote = await prisma.lote.findUnique({
    where: { id },
    include: { _count: { select: { detallesEntrega: true } } },
  });
  if (!lote) throw new HttpError(404, 'Lote no encontrado');
  if (lote._count.detallesEntrega > 0) {
    throw new HttpError(409, 'No se puede eliminar: el lote tiene entregas asociadas');
  }
  return prisma.lote.delete({ where: { id } });
}

export async function stockCritico() {
  const meds = await prisma.medicamento.findMany({
    where: { activo: true },
    include: { lotes: { select: { cantidadActual: true } } },
  });
  return meds
    .map((m) => ({
      id: m.id,
      codigo: m.codigo,
      nombre: m.nombre,
      stockMinimo: m.stockMinimo,
      stockActual: m.lotes.reduce((acc, l) => acc + l.cantidadActual, 0),
    }))
    .filter((m) => m.stockActual < m.stockMinimo)
    .sort((a, b) => a.stockActual - b.stockActual);
}

export async function porVencer(dias = 90) {
  const limite = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  return prisma.lote.findMany({
    where: {
      fechaVencimiento: { lte: limite, gte: new Date() },
      cantidadActual: { gt: 0 },
    },
    include: { medicamento: { select: { id: true, codigo: true, nombre: true } } },
    orderBy: { fechaVencimiento: 'asc' },
  });
}
