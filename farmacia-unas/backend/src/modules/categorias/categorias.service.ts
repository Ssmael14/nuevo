import { prisma } from '../../config/db.js';
import { HttpError } from '../../middlewares/errorHandler.js';
import type { CreateCategoriaInput, UpdateCategoriaInput } from './categorias.schemas.js';

export async function list() {
  return prisma.categoria.findMany({
    orderBy: { nombre: 'asc' },
    include: { _count: { select: { medicamentos: true } } },
  });
}

export async function getById(id: string) {
  const cat = await prisma.categoria.findUnique({ where: { id } });
  if (!cat) throw new HttpError(404, 'Categoria no encontrada');
  return cat;
}

export async function create(data: CreateCategoriaInput) {
  const exists = await prisma.categoria.findUnique({ where: { nombre: data.nombre } });
  if (exists) throw new HttpError(409, 'Ya existe una categoria con ese nombre');
  return prisma.categoria.create({ data });
}

export async function update(id: string, data: UpdateCategoriaInput) {
  await getById(id);
  return prisma.categoria.update({ where: { id }, data });
}

export async function remove(id: string) {
  await getById(id);
  const enUso = await prisma.medicamento.count({ where: { categoriaId: id } });
  if (enUso > 0) {
    throw new HttpError(409, `No se puede eliminar: ${enUso} medicamento(s) usan esta categoria`);
  }
  return prisma.categoria.delete({ where: { id } });
}
