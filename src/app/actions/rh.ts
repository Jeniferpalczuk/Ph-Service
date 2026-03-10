'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
    createFolhaPagamentoSchema, CreateFolhaPagamentoInput,
    updateFolhaPagamentoSchema, UpdateFolhaPagamentoInput
} from '@/lib/validations/folha-pagamento';
import { ActionResult, getAuthenticatedUser, formatDateForDB, validateId } from './shared';

// ===========================================
// FOLHA DE PAGAMENTO
// Alinhado com schema real do banco:
// cargo_funcao, valor, descontos, faltas, forma_pagamento, status_pagamento
// ===========================================

export async function createFolhaPagamentoAction(input: CreateFolhaPagamentoInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();
        const parsed = createFolhaPagamentoSchema.safeParse(input);
        if (!parsed.success) {
            console.error('[createFolhaPagamentoAction] Validation:', parsed.error.issues);
            return { success: false, error: 'Dados inválidos', errors: parsed.error.format() };
        }

        const supabase = await createClient();
        const { data, error } = await supabase.from('folha_pagamento').insert({
            user_id: user.id,
            funcionario: parsed.data.funcionario,
            cargo_funcao: parsed.data.cargoFuncao || null,
            valor: parsed.data.valor,
            descontos: parsed.data.descontos ?? 0,
            faltas: parsed.data.faltas ?? 0,
            forma_pagamento: parsed.data.formaPagamento,
            status_pagamento: parsed.data.statusPagamento,
            data_pagamento: formatDateForDB(parsed.data.dataPagamento),
            periodo_referencia: parsed.data.periodoReferencia || null,
            observacoes: parsed.data.observacoes || null,
        }).select('id').single();

        if (error) {
            console.error('[createFolhaPagamentoAction] DB Error:', JSON.stringify(error));
            return { success: false, error: 'Erro ao registrar pagamento' };
        }
        revalidatePath('/folha-pagamento');
        return { success: true, data: { id: data.id } };
    } catch (err) {
        console.error('[createFolhaPagamentoAction] Error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function updateFolhaPagamentoAction(id: string, input: UpdateFolhaPagamentoInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();
        const idError = validateId(id);
        if (idError) return idError;
        const parsed = updateFolhaPagamentoSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Dados inválidos', errors: parsed.error.format() };

        const supabase = await createClient();

        // Mapeamento dinâmico — só atualiza campos que foram passados
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        };
        if (parsed.data.funcionario !== undefined) updateData.funcionario = parsed.data.funcionario;
        if (parsed.data.cargoFuncao !== undefined) updateData.cargo_funcao = parsed.data.cargoFuncao;
        if (parsed.data.valor !== undefined) updateData.valor = parsed.data.valor;
        if (parsed.data.descontos !== undefined) updateData.descontos = parsed.data.descontos;
        if (parsed.data.faltas !== undefined) updateData.faltas = parsed.data.faltas;
        if (parsed.data.formaPagamento !== undefined) updateData.forma_pagamento = parsed.data.formaPagamento;
        if (parsed.data.statusPagamento !== undefined) updateData.status_pagamento = parsed.data.statusPagamento;
        if (parsed.data.dataPagamento !== undefined) updateData.data_pagamento = formatDateForDB(parsed.data.dataPagamento);
        if (parsed.data.periodoReferencia !== undefined) updateData.periodo_referencia = parsed.data.periodoReferencia;
        if (parsed.data.observacoes !== undefined) updateData.observacoes = parsed.data.observacoes;

        const { data, error } = await supabase.from('folha_pagamento')
            .update(updateData)
            .eq('id', id).eq('user_id', user.id).select('id').single();

        if (error) {
            console.error('[updateFolhaPagamentoAction] DB Error:', JSON.stringify(error));
            return { success: false, error: 'Erro ao atualizar pagamento' };
        }
        revalidatePath('/folha-pagamento');
        return { success: true, data: { id: data.id } };
    } catch (err) {
        console.error('[updateFolhaPagamentoAction] Error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function deleteFolhaPagamentoAction(id: string): Promise<ActionResult<void>> {
    try {
        const user = await getAuthenticatedUser();
        const idError = validateId(id);
        if (idError) return idError;
        const supabase = await createClient();
        const { error } = await supabase.from('folha_pagamento').delete().eq('id', id).eq('user_id', user.id);
        if (error) return { success: false, error: 'Erro ao excluir pagamento' };
        revalidatePath('/folha-pagamento');
        return { success: true, data: undefined };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}
