import { z } from 'zod';

const rol = z.enum(['ADMIN', 'FARMACEUTICO', 'ALMACENERO', 'AUXILIAR']);

export const createUsuarioSchema = z.object({
  body: z.object({
    nombres: z.string().min(2).max(100),
    apellidos: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(6),
    rol: rol.default('AUXILIAR'),
  }),
});

export const updateUsuarioSchema = z.object({
  body: z.object({
    nombres: z.string().min(2).max(100).optional(),
    apellidos: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    rol: rol.optional(),
    activo: z.boolean().optional(),
    password: z.string().min(6).optional(),
  }),
});

export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>['body'];
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>['body'];
