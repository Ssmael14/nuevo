import { z } from 'zod';

export const updateConfiguracionSchema = z.object({
  body: z.object({
    nombreInstitucion: z.string().min(2).max(200).optional(),
    nombreFarmacia: z.string().min(2).max(200).optional(),
    direccion: z.string().max(300).optional().nullable(),
    telefono: z.string().max(50).optional().nullable(),
    email: z.string().email().optional().nullable().or(z.literal('')),
    rucInstitucion: z.string().max(11).optional().nullable(),
    mostrarDemoLogin: z.boolean().optional(),
    permitirRegistroAuto: z.boolean().optional(),
    diasAlertaVencimiento: z.number().int().min(1).max(365).optional(),
    textoComprobante: z.string().max(500).optional().nullable(),
    logoUrl: z.string().max(500).optional().nullable(),
  }),
});

export type UpdateConfiguracionInput = z.infer<typeof updateConfiguracionSchema>['body'];
