import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authenticate, requireRole, validate } from '../../middlewares/auth.js';
import {
  createMedicamentoSchema,
  updateMedicamentoSchema,
  listMedicamentosSchema,
} from './medicamentos.schemas.js';
import * as service from './medicamentos.service.js';

export const medicamentosRouter = Router();

medicamentosRouter.use(authenticate);

medicamentosRouter.get('/', async (req, res) => {
  const parsed = listMedicamentosSchema.parse({ query: req.query });
  res.json(await service.list(parsed.query));
});

medicamentosRouter.get('/by-codigo-barras/:codigo', async (req, res) => {
  res.json(await service.getByCodigoBarras(req.params.codigo));
});

medicamentosRouter.get('/:id', async (req, res) => {
  res.json(await service.getById(req.params.id));
});

medicamentosRouter.post(
  '/',
  requireRole(RolUsuario.ADMIN, RolUsuario.FARMACEUTICO),
  validate(createMedicamentoSchema),
  async (req, res) => {
    res.status(201).json(await service.create(req.body));
  },
);

medicamentosRouter.put(
  '/:id',
  requireRole(RolUsuario.ADMIN, RolUsuario.FARMACEUTICO),
  validate(updateMedicamentoSchema),
  async (req, res) => {
    res.json(await service.update(req.params.id, req.body));
  },
);

medicamentosRouter.delete('/:id', requireRole(RolUsuario.ADMIN), async (req, res) => {
  res.json(await service.remove(req.params.id));
});
