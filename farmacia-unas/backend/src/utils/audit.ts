import { prisma } from '../config/db.js';
import { logger } from '../config/logger.js';

export interface AuditEntry {
  usuarioId?: string | null;
  accion: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'REFRESH' | string;
  entidad: string;
  entidadId?: string | null;
  detalles?: unknown;
  ip?: string | null;
}

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        usuarioId: entry.usuarioId ?? null,
        accion: entry.accion,
        entidad: entry.entidad,
        entidadId: entry.entidadId ?? null,
        detalles: entry.detalles
          ? (JSON.parse(JSON.stringify(entry.detalles)) as Record<string, unknown>)
          : undefined,
        ip: entry.ip ?? null,
      },
    });
  } catch (err) {
    logger.error({ err, entry }, 'No se pudo registrar audit log');
  }
}
