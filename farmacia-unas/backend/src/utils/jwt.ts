import jwt, { SignOptions } from 'jsonwebtoken';
import { RolUsuario } from '@prisma/client';
import { env } from '../config/env.js';

export interface JwtPayload {
  sub: string;
  email: string;
  rol: RolUsuario;
}

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
