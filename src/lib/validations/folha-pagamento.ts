import { z } from 'zod';

/**
 * Zod Schemas - Folha de Pagamento
 * 
 * Schema alinhado com o banco real:
 * cargo_funcao, valor, descontos, faltas, forma_pagamento, status_pagamento, data_pagamento
 */

const paymentStatusValues = ['pago', 'pendente', 'vencido', 'parcial'] as const;
const paymentMethodValues = ['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'boleto', 'vale'] as const;

export const folhaPagamentoSchema = z.object({
    funcionario: z
        .string()
        .min(2, 'Funcionário deve ter pelo menos 2 caracteres')
        .trim(),
    cargoFuncao: z.string().optional().nullable(),
    valor: z
        .number()
        .min(0.01, 'Valor deve ser maior que zero'),
    descontos: z.number().min(0).default(0).nullable().optional(),
    faltas: z.number().min(0).default(0).nullable().optional(),
    formaPagamento: z.enum(paymentMethodValues, {
        message: 'Forma de pagamento inválida',
    }).default('pix'),
    statusPagamento: z.enum(paymentStatusValues, {
        message: 'Status inválido',
    }).default('pago'),
    dataPagamento: z.date({
        message: 'Data de pagamento é obrigatória',
    }),
    periodoReferencia: z.string().optional().nullable(),
    observacoes: z.string().optional().nullable(),
});

export const createFolhaPagamentoSchema = folhaPagamentoSchema;
export const updateFolhaPagamentoSchema = folhaPagamentoSchema.partial();

export type CreateFolhaPagamentoInput = z.infer<typeof createFolhaPagamentoSchema>;
export type UpdateFolhaPagamentoInput = z.infer<typeof updateFolhaPagamentoSchema>;
