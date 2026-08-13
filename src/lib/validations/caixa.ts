import { z } from 'zod';

export const createCaixaSchema = z.object({
    data: z.date().or(z.string().transform(v => new Date(v))),
    funcionario: z.string().min(1, "O funcionário é obrigatório"),
    turno: z.enum(['manha', 'tarde']),
    entradas: z.object({
        dinheiro: z.number().default(0),
        pix: z.number().default(0),
        credito: z.number().default(0),
        debito: z.number().default(0),
        alimentacao: z.number().default(0),
    }),
    saidas: z.number().default(0),
    saidaDescricao: z.string().max(200, 'Nome da saida deve ter no maximo 200 caracteres').optional().nullable(),
    observacoes: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
    if (data.saidas > 0 && !data.saidaDescricao?.trim()) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['saidaDescricao'],
            message: 'Informe o nome da saida',
        });
    }
});

export const updateCaixaSchema = createCaixaSchema.partial();

export type CreateCaixaInput = z.infer<typeof createCaixaSchema>;
export type UpdateCaixaInput = z.infer<typeof updateCaixaSchema>;
