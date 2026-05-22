import { z } from 'zod';

const formaFarmaceutica = z.enum([
  'TABLETA',
  'CAPSULA',
  'JARABE',
  'INYECTABLE',
  'CREMA',
  'SUSPENSION',
  'GOTAS',
  'SUPOSITORIO',
  'OTRO',
]);

export const createMedicamentoSchema = z.object({
  body: z.object({
    codigo: z.string().min(2).max(50),
    nombre: z.string().min(2).max(150),
    principioActivo: z.string().max(150).optional(),
    concentracion: z.string().max(50).optional(),
    formaFarmaceutica: formaFarmaceutica.default('TABLETA'),
    presentacion: z.string().max(150).optional(),
    requiereReceta: z.boolean().default(false),
    stockMinimo: z.number().int().min(0).default(10),
    categoriaId: z.string().uuid().optional().nullable(),
  }),
});

export const updateMedicamentoSchema = z.object({
  body: z.object({
    codigo: z.string().min(2).max(50).optional(),
    nombre: z.string().min(2).max(150).optional(),
    principioActivo: z.string().max(150).optional().nullable(),
    concentracion: z.string().max(50).optional().nullable(),
    formaFarmaceutica: formaFarmaceutica.optional(),
    presentacion: z.string().max(150).optional().nullable(),
    requiereReceta: z.boolean().optional(),
    stockMinimo: z.number().int().min(0).optional(),
    categoriaId: z.string().uuid().optional().nullable(),
    activo: z.boolean().optional(),
  }),
});

export const listMedicamentosSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    categoriaId: z.string().uuid().optional(),
    soloActivos: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export type CreateMedicamentoInput = z.infer<typeof createMedicamentoSchema>['body'];
export type UpdateMedicamentoInput = z.infer<typeof updateMedicamentoSchema>['body'];
