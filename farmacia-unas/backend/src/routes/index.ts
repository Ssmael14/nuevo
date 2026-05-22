import { Router } from 'express';
import { prisma } from '../config/db.js';

export const router = Router();

router.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'down' });
  }
});

// Modulos (placeholders, se iran completando)
// router.use('/auth', authRouter);
// router.use('/usuarios', usuariosRouter);
// router.use('/pacientes', pacientesRouter);
// router.use('/medicamentos', medicamentosRouter);
// router.use('/inventario', inventarioRouter);
// router.use('/entregas', entregasRouter);
// router.use('/proveedores', proveedoresRouter);
// router.use('/reportes', reportesRouter);
