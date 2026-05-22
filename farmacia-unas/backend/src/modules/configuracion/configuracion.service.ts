import { prisma } from '../../config/db.js';
import type { UpdateConfiguracionInput } from './configuracion.schemas.js';

const SINGLETON_ID = 'default';

async function ensureExists() {
  return prisma.configuracion.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
  });
}

export async function getConfiguracion() {
  return ensureExists();
}

/**
 * Subset publico (sin auth) — solo campos seguros para mostrar en pantallas
 * accesibles antes del login (ej. nombre, mostrarDemoLogin, logo).
 */
export async function getPublicConfiguracion() {
  const c = await ensureExists();
  return {
    nombreInstitucion: c.nombreInstitucion,
    nombreFarmacia: c.nombreFarmacia,
    mostrarDemoLogin: c.mostrarDemoLogin,
    logoUrl: c.logoUrl,
  };
}

export async function updateConfiguracion(data: UpdateConfiguracionInput) {
  await ensureExists();
  return prisma.configuracion.update({
    where: { id: SINGLETON_ID },
    data: {
      ...data,
      email: data.email === '' ? null : data.email,
    },
  });
}
