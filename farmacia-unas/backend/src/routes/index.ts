import { Router } from 'express';
import { prisma } from '../config/db.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { usuariosRouter } from '../modules/usuarios/usuarios.routes.js';
import { categoriasRouter } from '../modules/categorias/categorias.routes.js';
import { medicamentosRouter } from '../modules/medicamentos/medicamentos.routes.js';
import { pacientesRouter } from '../modules/pacientes/pacientes.routes.js';
import { proveedoresRouter } from '../modules/proveedores/proveedores.routes.js';
import { inventarioRouter } from '../modules/inventario/inventario.routes.js';
import { entregasRouter } from '../modules/entregas/entregas.routes.js';
import { reportesRouter } from '../modules/reportes/reportes.routes.js';

export const router = Router();

const startedAt = Date.now();

router.get('/health', async (_req, res) => {
  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - t0;
    res.json({
      status: 'ok',
      database: { status: 'ok', latencyMs: dbLatencyMs },
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      version: '0.2.0',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({ status: 'degraded', database: { status: 'down' } });
  }
});

router.use('/auth', authRouter);
router.use('/usuarios', usuariosRouter);
router.use('/categorias', categoriasRouter);
router.use('/medicamentos', medicamentosRouter);
router.use('/pacientes', pacientesRouter);
router.use('/proveedores', proveedoresRouter);
router.use('/inventario', inventarioRouter);
router.use('/entregas', entregasRouter);
router.use('/reportes', reportesRouter);
