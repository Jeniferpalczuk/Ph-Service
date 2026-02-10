import { z } from 'zod';

/**
 * Zod Schemas - Marmitas
 */

export const marmitaSchema = z.object({
    tamanho: z.enum(['P', 'M', 'G', 'PF']),
    quantidade: z.number().min(1, 'Quantidade deve ser pelo menos 1'),
    valorUnitario: z.number().min(0),
    valorTotal: z.number().min(0),
    dataEntrega: z.date(),
    observacoes: z.string().optional().nullable(),
});

export const createMarmitaSchema = marmitaSchema;
export const updateMarmitaSchema = marmitaSchema.partial();

export type CreateMarmitaInput = z.infer<typeof createMarmitaSchema>;
export type UpdateMarmitaInput = z.infer<typeof updateMarmitaSchema>;

// Input para criação em lote (diário)
export const createMarmitasLoteSchema = z.object({
    dataEntrega: z.date(),
    marmitas: z.array(z.object({
        tamanho: z.enum(['P', 'M', 'G', 'PF']),
        quantidade: z.number().min(1),
        valorUnitario: z.number().min(0),
        valorTotal: z.number().min(0),
    })).min(1, 'Adicione pelo menos uma marmita'),
});

export type CreateMarmitasLoteInput = z.infer<typeof createMarmitasLoteSchema>;
