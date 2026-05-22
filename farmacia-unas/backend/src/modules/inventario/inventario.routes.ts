import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authenticate, requireRole, validate } from '../../middlewares/auth.js';
import {
  createLoteSchema,
  listLotesSchema,
  updateLoteSchema,
} from './inventario.schemas.js';
import * as service from './inventario.service.js';

export const inventarioRouter = Router();

inventarioRouter.use(authenticate);

inventarioRouter.get('/lotes', validate(listLotesSchema), async (req, res) => {
  res.json(
    await service.listLotes(req.query as unknown as Parameters<typeof service.listLotes>[0]),
  );
});

inventarioRouter.get('/stock-critico', async (_req, res) => {
  res.json(await service.stockCritico());
});

inventarioRouter.get('/por-vencer', async (req, res) => {
  const dias = req.query.dias ? Number(req.query.dias) : 90;
  res.json(await service.porVencer(dias));
});

inventarioRouter.post(
  '/lotes',
  requireRole(RolUsuario.ADMIN, RolUsuario.FARMACEUTICO, RolUsuario.ALMACENERO),
  validate(createLoteSchema),
  async (req, res) => res.status(201).json(await service.createLote(req.body)),
);

inventarioRouter.put(
  '/lotes/:id',
  requireRole(RolUsuario.ADMIN, RolUsuario.FARMACEUTICO, RolUsuario.ALMACENERO),
  validate(updateLoteSchema),
  async (req, res) => res.json(await service.updateLote(req.params.id, req.body)),
);

inventarioRouter.delete(
  '/lotes/:id',
  requireRole(RolUsuario.ADMIN),
  async (req, res) => res.json(await service.removeLote(req.params.id)),
);
