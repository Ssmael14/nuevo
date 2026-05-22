import jwt, { SignOptions } from 'jsonwebtoken';
import { RolUsuario } from '@prisma/client';
import { env } from '../config/env.js';

export interface JwtPayload {
  sub: string;
  email: string;
  rol: RolUsuario;
  type?: 'access' | 'refresh';
}

export function signAccessToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] },
  );
}

export function signRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiresIn as SignOptions['expiresIn'] },
  );
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as JwtPayload;
}
