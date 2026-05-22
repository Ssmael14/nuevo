import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authenticate, requireRole, validate } from '../../middlewares/auth.js';
import {
  createProveedorSchema,
  updateProveedorSchema,
} from './proveedores.schemas.js';
import * as service from './proveedores.service.js';

export const proveedoresRouter = Router();

proveedoresRouter.use(authenticate);

proveedoresRouter.get('/', async (req, res) => {
  res.json(await service.list(typeof req.query.q === 'string' ? req.query.q : undefined));
});

proveedoresRouter.get('/:id', async (req, res) => res.json(await service.getById(req.params.id)));

proveedoresRouter.post(
  '/',
  requireRole(RolUsuario.ADMIN, RolUsuario.FARMACEUTICO, RolUsuario.ALMACENERO),
  validate(createProveedorSchema),
  async (req, res) => res.status(201).json(await service.create(req.body)),
);

proveedoresRouter.put(
  '/:id',
  requireRole(RolUsuario.ADMIN, RolUsuario.FARMACEUTICO, RolUsuario.ALMACENERO),
  validate(updateProveedorSchema),
  async (req, res) => res.json(await service.update(req.params.id, req.body)),
);

proveedoresRouter.delete('/:id', requireRole(RolUsuario.ADMIN), async (req, res) => {
  res.json(await service.remove(req.params.id));
});
