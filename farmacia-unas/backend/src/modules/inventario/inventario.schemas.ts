import { z } from 'zod';

export const createLoteSchema = z.object({
  body: z.object({
    medicamentoId: z.string().uuid(),
    numeroLote: z.string().min(1).max(50),
    cantidadInicial: z.number().int().min(1),
    fechaVencimiento: z.string().datetime(),
    precioUnitario: z.number().nonnegative().optional().nullable(),
    proveedorId: z.string().uuid().optional().nullable(),
  }),
});

export const updateLoteSchema = z.object({
  body: z.object({
    numeroLote: z.string().min(1).max(50).optional(),
    cantidadActual: z.number().int().min(0).optional(),
    fechaVencimiento: z.string().datetime().optional(),
    precioUnitario: z.number().nonnegative().optional().nullable(),
    proveedorId: z.string().uuid().optional().nullable(),
  }),
});

export const listLotesSchema = z.object({
  query: z.object({
    medicamentoId: z.string().uuid().optional(),
    proveedorId: z.string().uuid().optional(),
    porVencerDias: z.coerce.number().int().min(1).optional(),
    soloConStock: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export type CreateLoteInput = z.infer<typeof createLoteSchema>['body'];
export type UpdateLoteInput = z.infer<typeof updateLoteSchema>['body'];
