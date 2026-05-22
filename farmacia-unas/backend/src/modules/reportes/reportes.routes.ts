import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import * as service from './reportes.service.js';

export const reportesRouter = Router();

reportesRouter.use(authenticate);

reportesRouter.get('/dashboard', async (_req, res) => res.json(await service.dashboard()));
reportesRouter.get('/entregas-por-dia', async (req, res) => {
  res.json(await service.entregasPorDia(req.query.dias ? Number(req.query.dias) : 30));
});
reportesRouter.get('/entregas-por-tipo', async (req, res) => {
  res.json(await service.entregasPorTipoPaciente(req.query.dias ? Number(req.query.dias) : 30));
});
reportesRouter.get('/top-medicamentos', async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const dias = req.query.dias ? Number(req.query.dias) : 90;
  res.json(await service.topMedicamentos(limit, dias));
});
reportesRouter.get('/stock-por-categoria', async (_req, res) => {
  res.json(await service.stockPorCategoria());
});
