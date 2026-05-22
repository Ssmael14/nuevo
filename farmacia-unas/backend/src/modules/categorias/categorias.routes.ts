import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authenticate, requireRole, validate } from '../../middlewares/auth.js';
import { createCategoriaSchema, updateCategoriaSchema } from './categorias.schemas.js';
import * as service from './categorias.service.js';

export const categoriasRouter = Router();

categoriasRouter.use(authenticate);

categoriasRouter.get('/', async (_req, res) => {
  res.json(await service.list());
});

categoriasRouter.get('/:id', async (req, res) => {
  res.json(await service.getById(req.params.id));
});

categoriasRouter.post(
  '/',
  requireRole(RolUsuario.ADMIN, RolUsuario.FARMACEUTICO),
  validate(createCategoriaSchema),
  async (req, res) => {
    res.status(201).json(await service.create(req.body));
  },
);

categoriasRouter.put(
  '/:id',
  requireRole(RolUsuario.ADMIN, RolUsuario.FARMACEUTICO),
  validate(updateCategoriaSchema),
  async (req, res) => {
    res.json(await service.update(req.params.id, req.body));
  },
);

categoriasRouter.delete('/:id', requireRole(RolUsuario.ADMIN), async (req, res) => {
  await service.remove(req.params.id);
  res.status(204).send();
});
