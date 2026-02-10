import { z } from 'zod';

/**
 * Zod Schemas - Saídas (Despesas)
 */

export const saidaSchema = z.object({
    descricao: z
        .string()
        .min(2, 'Descrição deve ter pelo menos 2 caracteres')
        .max(200, 'Descrição deve ter no máximo 200 caracteres')
        .trim(),
    valor: z
        .number()
        .min(0.01, 'Valor deve ser maior que zero')
        .max(1000000, 'Valor muito alto'),
    data: z.date({
        message: 'Data é obrigatória',
    }),
    categoria: z
        .string()
        .min(2, 'Categoria deve ter pelo menos 2 caracteres')
        .max(50, 'Categoria deve ter no máximo 50 caracteres')
        .trim(),
    metodoPagamento: z
        .string()
        .optional()
        .nullable(),
    observacoes: z
        .string()
        .max(500, 'Observações devem ter no máximo 500 caracteres')
        .optional()
        .nullable(),
});

export const createSaidaSchema = saidaSchema;
export const updateSaidaSchema = saidaSchema.partial();

export type CreateSaidaInput = z.infer<typeof createSaidaSchema>;
export type UpdateSaidaInput = z.infer<typeof updateSaidaSchema>;
