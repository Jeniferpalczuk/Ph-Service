import { z } from 'zod';

/**
 * Zod Schemas - Clientes
 */

const tipoClienteValues = ['empresa', 'pessoa_fisica'] as const;

export const clienteSchema = z.object({
    nome: z
        .string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .trim(),
    tipo: z.enum(tipoClienteValues, {
        message: 'Tipo deve ser "empresa" ou "pessoa_fisica"',
    }),
    telefone: z
        .string()
        .max(20, 'Telefone deve ter no máximo 20 caracteres')
        .optional()
        .nullable(),
    endereco: z
        .string()
        .max(200, 'Endereço deve ter no máximo 200 caracteres')
        .optional()
        .nullable(),
    ativo: z.boolean().default(true),
});

export const createClienteSchema = clienteSchema;
export const updateClienteSchema = clienteSchema.partial();

export type CreateClienteInput = z.infer<typeof createClienteSchema>;
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;
