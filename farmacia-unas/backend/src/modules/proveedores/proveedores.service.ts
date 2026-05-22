import { prisma } from '../../config/db.js';
import { HttpError } from '../../middlewares/errorHandler.js';
import type {
  CreateProveedorInput,
  UpdateProveedorInput,
} from './proveedores.schemas.js';

export async function list(q?: string) {
  return prisma.proveedor.findMany({
    where: q
      ? {
          OR: [
            { ruc: { contains: q, mode: 'insensitive' } },
            { razonSocial: { contains: q, mode: 'insensitive' } },
            { nombreComercial: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { razonSocial: 'asc' },
  });
}

export async function getById(id: string) {
  const p = await prisma.proveedor.findUnique({ where: { id } });
  if (!p) throw new HttpError(404, 'Proveedor no encontrado');
  return p;
}

export async function create(data: CreateProveedorInput) {
  const exists = await prisma.proveedor.findUnique({ where: { ruc: data.ruc } });
  if (exists) throw new HttpError(409, 'Ya existe un proveedor con ese RUC');
  return prisma.proveedor.create({ data });
}

export async function update(id: string, data: UpdateProveedorInput) {
  await getById(id);
  return prisma.proveedor.update({ where: { id }, data });
}

export async function remove(id: string) {
  await getById(id);
  return prisma.proveedor.update({ where: { id }, data: { activo: false } });
}
