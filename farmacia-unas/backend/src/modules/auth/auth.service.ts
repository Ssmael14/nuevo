import { prisma } from '../../config/db.js';
import { comparePassword } from '../../utils/password.js';
import { signToken } from '../../utils/jwt.js';
import { HttpError } from '../../middlewares/errorHandler.js';
import type { LoginInput } from './auth.schemas.js';

export async function login(input: LoginInput) {
  const usuario = await prisma.usuario.findUnique({ where: { email: input.email } });
  if (!usuario || !usuario.activo) {
    throw new HttpError(401, 'Credenciales invalidas');
  }
  const ok = await comparePassword(input.password, usuario.passwordHash);
  if (!ok) {
    throw new HttpError(401, 'Credenciales invalidas');
  }
  const token = signToken({ sub: usuario.id, email: usuario.email, rol: usuario.rol });
  return {
    token,
    user: {
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      rol: usuario.rol,
    },
  };
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
