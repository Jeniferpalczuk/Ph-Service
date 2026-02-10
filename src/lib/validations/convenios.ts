import { z } from 'zod';

/**
 * Zod Schemas - Convênios
 */

export const convenioSchema = z.object({
    empresa: z
        .string()
        .min(2, 'Empresa deve ter pelo menos 2 caracteres')
        .max(100, 'Empresa deve ter no máximo 100 caracteres')
        .trim(),
    valor: z
        .number()
        .min(0.01, 'Valor deve ser maior que zero')
        .max(1000000, 'Valor muito alto'),
    periodoReferencia: z
        .string()
        .regex(/^\d{4}-\d{2}$/, 'Formato deve ser YYYY-MM')
        .optional()
        .nullable(),
    dataFechamento: z.date().optional().nullable(),
    dataVencimento: z.date().optional().nullable(),
    dataPagamento: z.date().optional().nullable(),
    statusPagamento: z.enum(['pago', 'pendente', 'vencido', 'parcial']).default('pendente'),
    observacoes: z
        .string()
        .max(500, 'Observações devem ter no máximo 500 caracteres')
        .optional()
        .nullable(),
});

export const createConvenioSchema = convenioSchema;
export const updateConvenioSchema = convenioSchema.partial();

export type CreateConvenioInput = z.infer<typeof createConvenioSchema>;
export type UpdateConvenioInput = z.infer<typeof updateConvenioSchema>;
