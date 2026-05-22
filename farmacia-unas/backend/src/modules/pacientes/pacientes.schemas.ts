import { z } from 'zod';

const tipo = z.enum(['ALUMNO', 'DOCENTE', 'ADMINISTRATIVO']);

export const createPacienteSchema = z.object({
  body: z.object({
    codigo: z.string().min(2).max(50),
    dni: z.string().min(8).max(15).optional().nullable(),
    nombres: z.string().min(2).max(100),
    apellidos: z.string().min(2).max(100),
    tipo,
    facultad: z.string().max(150).optional().nullable(),
    escuela: z.string().max(150).optional().nullable(),
    telefono: z.string().max(20).optional().nullable(),
    email: z.string().email().optional().nullable(),
    fechaNacimiento: z.string().datetime().optional().nullable(),
  }),
});

export const updatePacienteSchema = z.object({
  body: createPacienteSchema.shape.body.partial().extend({
    activo: z.boolean().optional(),
  }),
});

export const listPacientesSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    tipo: tipo.optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export type CreatePacienteInput = z.infer<typeof createPacienteSchema>['body'];
export type UpdatePacienteInput = z.infer<typeof updatePacienteSchema>['body'];
