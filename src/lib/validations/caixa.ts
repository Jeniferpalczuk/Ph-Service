import { z } from 'zod';

const valorCaixaSchema = z.number()
    .refine(Number.isFinite, 'Informe um valor numérico válido')
    .min(0, 'O valor não pode ser negativo')
    .default(0);

const caixaBaseSchema = z.object({
    data: z.date().or(z.string().transform(v => new Date(v))),
    funcionario: z.string().min(1, "O funcionário é obrigatório"),
    turno: z.enum(['manha', 'tarde']),
    entradas: z.object({
        dinheiro: valorCaixaSchema,
        pix: valorCaixaSchema,
        credito: valorCaixaSchema,
        debito: valorCaixaSchema,
        alimentacao: valorCaixaSchema,
    }),
    saidas: valorCaixaSchema,
    saidaDescricao: z.string().max(200, 'O nome da saída deve ter no máximo 200 caracteres').optional().nullable(),
    observacoes: z.string().optional().nullable(),
});

export const createCaixaSchema = caixaBaseSchema.superRefine((data, ctx) => {
    if (data.saidas > 0 && !data.saidaDescricao?.trim()) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['saidaDescricao'],
            message: 'Informe o nome da saída',
        });
    }
});

export const updateCaixaSchema = caixaBaseSchema.partial();

// As Server Actions receive the raw payload, keep the input type here instead
// of the transformed output type (the date may arrive as YYYY-MM-DD string).
export type CreateCaixaInput = z.input<typeof createCaixaSchema>;
export type UpdateCaixaInput = z.input<typeof updateCaixaSchema>;
