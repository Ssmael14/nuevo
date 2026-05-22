import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authenticate, requireRole, validate } from '../../middlewares/auth.js';
import { updateConfiguracionSchema } from './configuracion.schemas.js';
import * as service from './configuracion.service.js';

export const configuracionRouter = Router();

// Publico: subset de configuracion para la pantalla de login (sin secretos)
configuracionRouter.get('/public', async (_req, res) => {
  res.json(await service.getPublicConfiguracion());
});

// Privado: solo ADMIN
configuracionRouter.get('/', authenticate, requireRole(RolUsuario.ADMIN), async (_req, res) => {
  res.json(await service.getConfiguracion());
});

configuracionRouter.put(
  '/',
  authenticate,
  requireRole(RolUsuario.ADMIN),
  validate(updateConfiguracionSchema),
  async (req, res) => {
    res.json(await service.updateConfiguracion(req.body));
  },
);
