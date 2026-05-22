import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authenticate, requireRole, validate } from '../../middlewares/auth.js';
import { createUsuarioSchema, updateUsuarioSchema } from './usuarios.schemas.js';
import * as service from './usuarios.service.js';

export const usuariosRouter = Router();

usuariosRouter.use(authenticate, requireRole(RolUsuario.ADMIN));

usuariosRouter.get('/', async (_req, res) => res.json(await service.list()));
usuariosRouter.get('/:id', async (req, res) => res.json(await service.getById(req.params.id)));
usuariosRouter.post('/', validate(createUsuarioSchema), async (req, res) => {
  res.status(201).json(await service.create(req.body));
});
usuariosRouter.put('/:id', validate(updateUsuarioSchema), async (req, res) => {
  res.json(await service.update(req.params.id, req.body));
});
usuariosRouter.delete('/:id', async (req, res) => {
  res.json(await service.remove(req.params.id));
});
