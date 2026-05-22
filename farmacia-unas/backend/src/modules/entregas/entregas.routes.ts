import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authenticate, requireRole, validate } from '../../middlewares/auth.js';
import {
  createEntregaSchema,
  listEntregasSchema,
} from './entregas.schemas.js';
import * as service from './entregas.service.js';

export const entregasRouter = Router();

entregasRouter.use(authenticate);

entregasRouter.get('/', validate(listEntregasSchema), async (req, res) => {
  res.json(
    await service.listEntregas(req.query as unknown as Parameters<typeof service.listEntregas>[0]),
  );
});

entregasRouter.get('/:id', async (req, res) => {
  res.json(await service.getById(req.params.id));
});

entregasRouter.post(
  '/',
  requireRole(RolUsuario.ADMIN, RolUsuario.FARMACEUTICO, RolUsuario.AUXILIAR),
  validate(createEntregaSchema),
  async (req, res) => {
    res.status(201).json(await service.createEntrega(req.user!.sub, req.body));
  },
);

entregasRouter.post(
  '/:id/anular',
  requireRole(RolUsuario.ADMIN, RolUsuario.FARMACEUTICO),
  async (req, res) => res.json(await service.anularEntrega(req.params.id)),
);
