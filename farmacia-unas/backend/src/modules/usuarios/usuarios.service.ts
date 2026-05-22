import { prisma } from '../../config/db.js';
import { HttpError } from '../../middlewares/errorHandler.js';
import { hashPassword } from '../../utils/password.js';
import type { CreateUsuarioInput, UpdateUsuarioInput } from './usuarios.schemas.js';

const safeSelect = {
  id: true,
  nombres: true,
  apellidos: true,
  email: true,
  rol: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function list() {
  return prisma.usuario.findMany({ select: safeSelect, orderBy: { apellidos: 'asc' } });
}

export async function getById(id: string) {
  const u = await prisma.usuario.findUnique({ where: { id }, select: safeSelect });
  if (!u) throw new HttpError(404, 'Usuario no encontrado');
  return u;
}

export async function create(data: CreateUsuarioInput) {
  const exists = await prisma.usuario.findUnique({ where: { email: data.email } });
  if (exists) throw new HttpError(409, 'Ya existe un usuario con ese email');
  return prisma.usuario.create({
    data: {
      nombres: data.nombres,
      apellidos: data.apellidos,
      email: data.email,
      rol: data.rol,
      passwordHash: await hashPassword(data.password),
    },
    select: safeSelect,
  });
}

export async function update(id: string, data: UpdateUsuarioInput) {
  await getById(id);
  const updateData: Record<string, unknown> = { ...data };
  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
    delete updateData.password;
  }
  return prisma.usuario.update({ where: { id }, data: updateData, select: safeSelect });
}

export async function remove(id: string) {
  await getById(id);
  return prisma.usuario.update({ where: { id }, data: { activo: false }, select: safeSelect });
}
