import { z } from 'zod';

export const createEntregaSchema = z.object({
  body: z.object({
    pacienteId: z.string().uuid(),
    diagnostico: z.string().max(500).optional().nullable(),
    numeroReceta: z.string().max(50).optional().nullable(),
    observaciones: z.string().max(500).optional().nullable(),
    items: z
      .array(
        z.object({
          medicamentoId: z.string().uuid(),
          cantidad: z.number().int().min(1),
          indicaciones: z.string().max(300).optional().nullable(),
        }),
      )
      .min(1, 'Debe entregar al menos un medicamento'),
  }),
});

export const listEntregasSchema = z.object({
  query: z.object({
    desde: z.string().datetime().optional(),
    hasta: z.string().datetime().optional(),
    pacienteId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export type CreateEntregaInput = z.infer<typeof createEntregaSchema>['body'];
