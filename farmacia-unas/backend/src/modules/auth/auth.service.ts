import { prisma } from '../../config/db.js';
import { comparePassword, hashPassword } from '../../utils/password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.js';
import { HttpError } from '../../middlewares/errorHandler.js';
import { audit } from '../../utils/audit.js';
import type { ChangePasswordInput, LoginInput, RefreshInput } from './auth.schemas.js';

function refreshExpiryDate(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

export async function login(input: LoginInput, ip?: string) {
  const usuario = await prisma.usuario.findUnique({ where: { email: input.email } });
  if (!usuario || !usuario.activo) {
    throw new HttpError(401, 'Credenciales invalidas');
  }
  const ok = await comparePassword(input.password, usuario.passwordHash);
  if (!ok) throw new HttpError(401, 'Credenciales invalidas');

  const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      usuarioId: usuario.id,
      expiresAt: refreshExpiryDate(),
    },
  });

  await audit({ usuarioId: usuario.id, accion: 'LOGIN', entidad: 'Usuario', entidadId: usuario.id, ip });

  return {
    accessToken,
    refreshToken,
    user: {
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      rol: usuario.rol,
    },
  };
}

export async function refresh(input: RefreshInput) {
  let payload;
  try {
    payload = verifyRefreshToken(input.refreshToken);
  } catch {
    throw new HttpError(401, 'Refresh token invalido');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: input.refreshToken } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new HttpError(401, 'Refresh token revocado o expirado');
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: payload.sub } });
  if (!usuario || !usuario.activo) throw new HttpError(401, 'Usuario invalido');

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  const newPayload = { sub: usuario.id, email: usuario.email, rol: usuario.rol };
  const accessToken = signAccessToken(newPayload);
  const refreshToken = signRefreshToken(newPayload);

  await prisma.refreshToken.create({
    data: { token: refreshToken, usuarioId: usuario.id, expiresAt: refreshExpiryDate() },
  });

  return { accessToken, refreshToken };
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { revoked: true },
  });
}

export async function getProfile(userId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      email: true,
      rol: true,
      activo: true,
      createdAt: true,
    },
  });
  if (!usuario) throw new HttpError(404, 'Usuario no encontrado');
  return usuario;
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
  if (!usuario) throw new HttpError(404, 'Usuario no encontrado');
  const ok = await comparePassword(input.currentPassword, usuario.passwordHash);
  if (!ok) throw new HttpError(400, 'Contrasena actual incorrecta');
  await prisma.usuario.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(input.newPassword) },
  });
  await prisma.refreshToken.updateMany({ where: { usuarioId: userId }, data: { revoked: true } });
}
