import { z } from 'zod';

export const createCategoriaSchema = z.object({
  body: z.object({
    nombre: z.string().min(2).max(100),
    descripcion: z.string().max(500).optional(),
  }),
});

export const updateCategoriaSchema = z.object({
  body: z.object({
    nombre: z.string().min(2).max(100).optional(),
    descripcion: z.string().max(500).optional().nullable(),
  }),
});

export type CreateCategoriaInput = z.infer<typeof createCategoriaSchema>['body'];
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>['body'];
