import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email invalido'),
    password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshInput = z.infer<typeof refreshSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
