import { z } from 'zod';

/**
 * Zod Schemas - Folha de Pagamento
 */

export const folhaPagamentoSchema = z.object({
    funcionario: z
        .string()
        .min(2, 'Funcionário deve ter pelo menos 2 caracteres')
        .trim(),
    cargo: z.string().optional().nullable(),
    salarioBase: z.number().min(0),
    dataPagamento: z.date(),
    periodoReferencia: z.string().regex(/^\d{4}-\d{2}$/),

    // Proventos
    horasExtras: z.number().min(0).default(0),
    valorHorasExtras: z.number().min(0).default(0),
    adicionalNoturno: z.number().min(0).default(0),
    outrosProventos: z.number().min(0).default(0),

    // Descontos
    faltas: z.number().min(0).default(0),
    valorFaltas: z.number().min(0).default(0),
    vales: z.number().min(0).default(0),
    marmitas: z.number().min(0).default(0),
    outrosDescontos: z.number().min(0).default(0),

    // Totais
    valorLiquido: z.number(),
    status: z.enum(['pago', 'pendente', 'cancelado']).default('pago'),
    observacoes: z.string().optional().nullable(),
});

export const createFolhaPagamentoSchema = folhaPagamentoSchema;
export const updateFolhaPagamentoSchema = folhaPagamentoSchema.partial();

export type CreateFolhaPagamentoInput = z.infer<typeof createFolhaPagamentoSchema>;
export type UpdateFolhaPagamentoInput = z.infer<typeof updateFolhaPagamentoSchema>;
