import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authenticate, requireRole, validate } from '../../middlewares/auth.js';
import {
  createPacienteSchema,
  listPacientesSchema,
  updatePacienteSchema,
} from './pacientes.schemas.js';
import * as service from './pacientes.service.js';

export const pacientesRouter = Router();

pacientesRouter.use(authenticate);

pacientesRouter.get('/', validate(listPacientesSchema), async (req, res) => {
  res.json(
    await service.list(
      req.query as unknown as Parameters<typeof service.list>[0],
    ),
  );
});

pacientesRouter.get('/:id', async (req, res) => {
  res.json(await service.getById(req.params.id));
});

pacientesRouter.post(
  '/',
  requireRole(RolUsuario.ADMIN, RolUsuario.FARMACEUTICO, RolUsuario.AUXILIAR),
  validate(createPacienteSchema),
  async (req, res) => res.status(201).json(await service.create(req.body)),
);

pacientesRouter.put(
  '/:id',
  requireRole(RolUsuario.ADMIN, RolUsuario.FARMACEUTICO, RolUsuario.AUXILIAR),
  validate(updatePacienteSchema),
  async (req, res) => res.json(await service.update(req.params.id, req.body)),
);

pacientesRouter.delete('/:id', requireRole(RolUsuario.ADMIN), async (req, res) => {
  res.json(await service.remove(req.params.id));
});
