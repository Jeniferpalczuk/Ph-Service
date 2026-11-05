import { z } from 'zod';

/**
 * Zod Schemas - Convênios
 */

export const convenioSchema = z.object({
    empresa: z
        .string()
        .trim()
        .min(2, 'Empresa deve ter pelo menos 2 caracteres')
        .max(100, 'Empresa deve ter no máximo 100 caracteres'),
    tipoFechamento: z
        .enum(['mensal', 'quinzenal', 'semanal', 'personalizado']),
    valor: z
        .number()
        .min(0.01, 'Valor deve ser maior que zero')
        .max(1000000, 'Valor muito alto'),
    banco: z
        .string()
        .trim()
        .min(2, 'Banco deve ter pelo menos 2 caracteres')
        .max(100, 'Banco deve ter no máximo 100 caracteres'),
    periodoReferencia: z
        .string()
        .trim()
        .min(1, 'Informe o período de referência')
        .max(100, 'O período deve ter no máximo 100 caracteres'),
    dataFechamento: z.date({ message: 'Informe uma data de fechamento válida' }),
    dataVencimento: z.date({ message: 'Informe uma data de vencimento válida' }),
    dataPagamento: z.date().optional().nullable(),
    statusPagamento: z.enum(['pago', 'pendente', 'vencido', 'parcial']),
    observacoes: z
        .string()
        .max(500, 'Observações devem ter no máximo 500 caracteres')
        .optional()
        .nullable(),
});

// Defaults belong to creation only: Zod 4 applies them even inside .partial().
export const createConvenioSchema = convenioSchema.extend({
    tipoFechamento: convenioSchema.shape.tipoFechamento.default('mensal'),
    statusPagamento: convenioSchema.shape.statusPagamento.default('pendente'),
});
export const updateConvenioSchema = convenioSchema.partial();

export type CreateConvenioInput = z.infer<typeof createConvenioSchema>;
export type UpdateConvenioInput = z.infer<typeof updateConvenioSchema>;
