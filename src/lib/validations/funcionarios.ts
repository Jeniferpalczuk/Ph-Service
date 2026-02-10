import { z } from 'zod';

/**
 * Zod Schemas - Funcionários
 * 
 * Validação centralizada para garantir integridade dos dados antes de chegar ao DB.
 */

export const funcionarioSchema = z.object({
    nome: z
        .string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .trim(),
    cargo: z
        .string()
        .min(2, 'Cargo deve ter pelo menos 2 caracteres')
        .max(50, 'Cargo deve ter no máximo 50 caracteres')
        .trim(),
    telefone: z
        .string()
        .max(20, 'Telefone deve ter no máximo 20 caracteres')
        .optional()
        .nullable(),
    salarioBase: z
        .number()
        .min(0, 'Salário não pode ser negativo')
        .max(1000000, 'Salário muito alto')
        .optional()
        .nullable(),
    dataAdmissao: z
        .date()
        .optional()
        .nullable(),
    dataDemissao: z
        .date()
        .optional()
        .nullable(),
    ativo: z.boolean().default(true),
});

export const createFuncionarioSchema = funcionarioSchema;
export const updateFuncionarioSchema = funcionarioSchema.partial();

export type CreateFuncionarioInput = z.infer<typeof createFuncionarioSchema>;
export type UpdateFuncionarioInput = z.infer<typeof updateFuncionarioSchema>;
