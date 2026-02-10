import { z } from 'zod';

/**
 * Zod Schemas - Fornecedores
 */

export const fornecedorSchema = z.object({
    nome: z
        .string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .trim(),
    servico: z
        .string()
        .min(2, 'Serviço deve ter pelo menos 2 caracteres')
        .max(100, 'Serviço deve ter no máximo 100 caracteres')
        .trim(),
    telefone: z
        .string()
        .max(20, 'Telefone deve ter no máximo 20 caracteres')
        .optional()
        .nullable(),
    ativo: z.boolean().default(true),
});

export const createFornecedorSchema = fornecedorSchema;
export const updateFornecedorSchema = fornecedorSchema.partial();

export type CreateFornecedorInput = z.infer<typeof createFornecedorSchema>;
export type UpdateFornecedorInput = z.infer<typeof updateFornecedorSchema>;
