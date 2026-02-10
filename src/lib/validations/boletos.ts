import { z } from 'zod';

/**
 * Zod Schemas - Boletos
 */

const statusPagamentoValues = ['pago', 'pendente', 'vencido', 'parcial'] as const;

export const boletoSchema = z.object({
    cliente: z
        .string()
        .min(2, 'Cliente deve ter pelo menos 2 caracteres')
        .max(100, 'Cliente deve ter no máximo 100 caracteres')
        .trim(),
    valor: z
        .number()
        .min(0.01, 'Valor deve ser maior que zero')
        .max(10000000, 'Valor muito alto'),
    banco: z
        .string()
        .min(2, 'Banco deve ter pelo menos 2 caracteres')
        .max(50, 'Banco deve ter no máximo 50 caracteres')
        .trim(),
    dataVencimento: z.date({
        message: 'Data de vencimento é obrigatória',
    }),
    dataPagamento: z.date().optional().nullable(),
    statusPagamento: z.enum(statusPagamentoValues, {
        message: 'Status inválido',
    }),
    observacoes: z
        .string()
        .max(500, 'Observações devem ter no máximo 500 caracteres')
        .optional()
        .nullable(),
    convenioId: z.string().uuid().optional().nullable(),
});

export const createBoletoSchema = boletoSchema;
export const updateBoletoSchema = boletoSchema.partial();

export type CreateBoletoInput = z.infer<typeof createBoletoSchema>;
export type UpdateBoletoInput = z.infer<typeof updateBoletoSchema>;
