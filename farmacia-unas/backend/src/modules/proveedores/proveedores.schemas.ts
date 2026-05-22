import { z } from 'zod';

export const createProveedorSchema = z.object({
  body: z.object({
    ruc: z.string().min(11).max(11),
    razonSocial: z.string().min(2).max(200),
    nombreComercial: z.string().max(200).optional().nullable(),
    direccion: z.string().max(300).optional().nullable(),
    telefono: z.string().max(20).optional().nullable(),
    email: z.string().email().optional().nullable(),
    contacto: z.string().max(150).optional().nullable(),
  }),
});

export const updateProveedorSchema = z.object({
  body: createProveedorSchema.shape.body.partial().extend({
    activo: z.boolean().optional(),
  }),
});

export type CreateProveedorInput = z.infer<typeof createProveedorSchema>['body'];
export type UpdateProveedorInput = z.infer<typeof updateProveedorSchema>['body'];
