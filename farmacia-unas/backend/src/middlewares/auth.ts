import { Request, Response, NextFunction } from 'express';
import { RolUsuario } from '@prisma/client';
import { verifyToken, JwtPayload } from '../utils/jwt.js';
import { HttpError } from './errorHandler.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new HttpError(401, 'Token requerido');
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    throw new HttpError(401, 'Token invalido o expirado');
  }
}

export function requireRole(...roles: RolUsuario[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new HttpError(401, 'No autenticado');
    if (!roles.includes(req.user.rol)) {
      throw new HttpError(403, 'No tienes permisos para esta accion');
    }
    next();
  };
}

export function validate(schema: { parse: (data: unknown) => unknown }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse({ body: req.body, params: req.params, query: req.query }) as {
      body?: unknown;
      params?: unknown;
      query?: unknown;
    };
    if (parsed.body) req.body = parsed.body;
    next();
  };
}
