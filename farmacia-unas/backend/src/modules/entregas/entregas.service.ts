import { EstadoEntrega, Prisma } from '@prisma/client';
import { prisma } from '../../config/db.js';
import { HttpError } from '../../middlewares/errorHandler.js';
import type { CreateEntregaInput } from './entregas.schemas.js';

interface ListParams {
  desde?: string;
  hasta?: string;
  pacienteId?: string;
  page: number;
  pageSize: number;
}

async function nextNumero(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ENT-${year}-`;
  const last = await prisma.entrega.findFirst({
    where: { numero: { startsWith: prefix } },
    orderBy: { numero: 'desc' },
    select: { numero: true },
  });
  const lastN = last ? Number(last.numero.slice(prefix.length)) : 0;
  return `${prefix}${String(lastN + 1).padStart(5, '0')}`;
}

export async function listEntregas(params: ListParams) {
  const where: Prisma.EntregaWhereInput = {};
  if (params.pacienteId) where.pacienteId = params.pacienteId;
  if (params.desde || params.hasta) {
    where.fecha = {};
    if (params.desde) where.fecha.gte = new Date(params.desde);
    if (params.hasta) where.fecha.lte = new Date(params.hasta);
  }

  const [total, items] = await Promise.all([
    prisma.entrega.count({ where }),
    prisma.entrega.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        paciente: { select: { id: true, codigo: true, nombres: true, apellidos: true, tipo: true } },
        usuario: { select: { id: true, nombres: true, apellidos: true } },
        detalles: {
          include: {
            medicamento: { select: { id: true, codigo: true, nombre: true } },
            lote: { select: { id: true, numeroLote: true, fechaVencimiento: true } },
          },
        },
      },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
  ]);

  return { total, page: params.page, pageSize: params.pageSize, items };
}

export async function getById(id: string) {
  const entrega = await prisma.entrega.findUnique({
    where: { id },
    include: {
      paciente: true,
      usuario: { select: { id: true, nombres: true, apellidos: true, email: true } },
      detalles: { include: { medicamento: true, lote: true } },
    },
  });
  if (!entrega) throw new HttpError(404, 'Entrega no encontrada');
  return entrega;
}

/**
 * Crea una entrega aplicando FEFO (First Expired First Out):
 * descuenta del lote con fecha de vencimiento mas proxima.
 */
export async function createEntrega(usuarioId: string, input: CreateEntregaInput) {
  const paciente = await prisma.paciente.findUnique({ where: { id: input.pacienteId } });
  if (!paciente || !paciente.activo) throw new HttpError(404, 'Paciente no encontrado o inactivo');

  return prisma.$transaction(async (tx) => {
    const detalles: { medicamentoId: string; loteId: string; cantidad: number; indicaciones?: string | null }[] = [];

    for (const item of input.items) {
      const med = await tx.medicamento.findUnique({ where: { id: item.medicamentoId } });
      if (!med || !med.activo) {
        throw new HttpError(404, `Medicamento ${item.medicamentoId} no encontrado`);
      }

      let restante = item.cantidad;
      const lotes = await tx.lote.findMany({
        where: {
          medicamentoId: item.medicamentoId,
          cantidadActual: { gt: 0 },
          fechaVencimiento: { gte: new Date() },
        },
        orderBy: { fechaVencimiento: 'asc' },
      });

      const stockDisponible = lotes.reduce((a, l) => a + l.cantidadActual, 0);
      if (stockDisponible < item.cantidad) {
        throw new HttpError(
          400,
          `Stock insuficiente para "${med.nombre}". Disponible: ${stockDisponible}, solicitado: ${item.cantidad}`,
        );
      }

      for (const lote of lotes) {
        if (restante <= 0) break;
        const tomar = Math.min(lote.cantidadActual, restante);
        await tx.lote.update({
          where: { id: lote.id },
          data: { cantidadActual: lote.cantidadActual - tomar },
        });
        detalles.push({
          medicamentoId: item.medicamentoId,
          loteId: lote.id,
          cantidad: tomar,
          indicaciones: item.indicaciones,
        });
        restante -= tomar;
      }
    }

    const numero = await nextNumero();
    return tx.entrega.create({
      data: {
        numero,
        estado: EstadoEntrega.ENTREGADA,
        pacienteId: input.pacienteId,
        usuarioId,
        diagnostico: input.diagnostico,
        numeroReceta: input.numeroReceta,
        observaciones: input.observaciones,
        detalles: { create: detalles },
      },
      include: {
        paciente: true,
        detalles: { include: { medicamento: true, lote: true } },
      },
    });
  });
}

export async function anularEntrega(id: string) {
  const entrega = await prisma.entrega.findUnique({
    where: { id },
    include: { detalles: true },
  });
  if (!entrega) throw new HttpError(404, 'Entrega no encontrada');
  if (entrega.estado === EstadoEntrega.ANULADA) {
    throw new HttpError(400, 'La entrega ya esta anulada');
  }

  return prisma.$transaction(async (tx) => {
    for (const d of entrega.detalles) {
      await tx.lote.update({
        where: { id: d.loteId },
        data: { cantidadActual: { increment: d.cantidad } },
      });
    }
    return tx.entrega.update({
      where: { id },
      data: { estado: EstadoEntrega.ANULADA },
    });
  });
}
