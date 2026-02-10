import { z } from 'zod';

/**
 * Zod Schemas - Vales
 */

const valeStatusValues = ['aberto', 'quitado', 'parcial'] as const;

export const valeSchema = z.object({
    funcionario: z
        .string()
        .min(2, 'Nome do funcionário deve ter pelo menos 2 caracteres')
        .max(100, 'Nome do funcionário deve ter no máximo 100 caracteres')
        .trim(),
    valor: z
        .number()
        .min(0.01, 'Valor deve ser maior que zero')
        .max(100000, 'Valor muito alto'),
    data: z.date({
        message: 'Data é obrigatória',
    }),
    motivo: z
        .string()
        .min(2, 'Motivo deve ter pelo menos 2 caracteres')
        .max(200, 'Motivo deve ter no máximo 200 caracteres')
        .trim(),
    status: z.enum(valeStatusValues, {
        message: 'Status inválido',
    }).default('aberto'),
    valorPago: z.number().min(0).optional().nullable(),
    dataPagamento: z.date().optional().nullable(),
    observacoes: z
        .string()
        .max(500, 'Observações devem ter no máximo 500 caracteres')
        .optional()
        .nullable(),
});

export const createValeSchema = valeSchema;
export const updateValeSchema = valeSchema.partial();

export type CreateValeInput = z.infer<typeof createValeSchema>;
export type UpdateValeInput = z.infer<typeof updateValeSchema>;
