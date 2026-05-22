import { Router } from 'express';
import { prisma } from '../config/db.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { categoriasRouter } from '../modules/categorias/categorias.routes.js';
import { medicamentosRouter } from '../modules/medicamentos/medicamentos.routes.js';

export const router = Router();

router.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'down' });
  }
});

router.use('/auth', authRouter);
router.use('/categorias', categoriasRouter);
router.use('/medicamentos', medicamentosRouter);
