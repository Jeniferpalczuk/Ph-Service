'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
    createFolhaPagamentoSchema, CreateFolhaPagamentoInput,
    updateFolhaPagamentoSchema, UpdateFolhaPagamentoInput
} from '@/lib/validations/folha-pagamento';
import { ActionResult, getAuthenticatedUser, formatDateForDB, formatDatabaseError, validateId } from './shared';

const FOLHA_SAIDA_MARKER_PREFIX = '[FOLHA_PAGAMENTO:';

function getFolhaSaidaMarker(folhaId: string) {
    return `${FOLHA_SAIDA_MARKER_PREFIX}${folhaId}]`;
}

function getFolhaSaidaPayload(
    folhaId: string,
    folha: {
        funcionario: string;
        valor: number;
        formaPagamento: string;
        dataPagamento: Date;
        periodoReferencia?: string | null;
        observacoes?: string | null;
    }
) {
    const marker = getFolhaSaidaMarker(folhaId);
    const periodo = folha.periodoReferencia ? ` - ${folha.periodoReferencia}` : '';
    const observacoes = [marker, folha.observacoes].filter(Boolean).join(' ');

    return {
        descricao: `Pagamento de funcionário - ${folha.funcionario}${periodo}`,
        valor: folha.valor,
        data: formatDateForDB(folha.dataPagamento),
        categoria: 'funcionarios',
        fornecedor: folha.funcionario,
        forma_pagamento: folha.formaPagamento,
        observacoes,
    };
}

async function syncFolhaPagamentoSaida(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    folhaId: string,
    folha: {
        funcionario: string;
        valor: number;
        formaPagamento: string;
        statusPagamento: string;
        dataPagamento: Date;
        periodoReferencia?: string | null;
        observacoes?: string | null;
    }
) {
    const marker = getFolhaSaidaMarker(folhaId);

    if (folha.statusPagamento !== 'pago') {
        const { error } = await supabase
            .from('saidas')
            .delete()
            .eq('user_id', userId)
            .ilike('observacoes', `%${marker}%`);

        if (error) throw new Error(formatDatabaseError(error, 'Erro ao remover despesa da folha'));
        return;
    }

    const payload = getFolhaSaidaPayload(folhaId, folha);
    const { data: existing, error: findError } = await supabase
        .from('saidas')
        .select('id')
        .eq('user_id', userId)
        .ilike('observacoes', `%${marker}%`)
        .maybeSingle();

    if (findError) throw new Error(formatDatabaseError(findError, 'Erro ao buscar despesa da folha'));

    if (existing?.id) {
        const { error } = await supabase
            .from('saidas')
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq('id', existing.id)
            .eq('user_id', userId)
            .select('id')
            .single();

        if (error) throw new Error(formatDatabaseError(error, 'Erro ao atualizar despesa da folha'));
        return;
    }

    const { error } = await supabase.from('saidas').insert({
        user_id: userId,
        ...payload,
    });

    if (error) throw new Error(formatDatabaseError(error, 'Erro ao criar despesa da folha'));
}

// ===========================================
// FOLHA DE PAGAMENTO
// Alinhado com schema real do banco:
// cargo_funcao, valor, descontos, forma_pagamento, status_pagamento, data_pagamento, observacoes
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
            forma_pagamento: parsed.data.formaPagamento,
            status_pagamento: parsed.data.statusPagamento,
            data_pagamento: formatDateForDB(parsed.data.dataPagamento),
            observacoes: parsed.data.observacoes || null,
        }).select('id').single();

        if (error) {
            console.error('[createFolhaPagamentoAction] DB Error:', JSON.stringify(error));
            return { success: false, error: formatDatabaseError(error, 'Erro ao registrar pagamento') };
        }

        await syncFolhaPagamentoSaida(supabase, user.id, data.id, {
            funcionario: parsed.data.funcionario,
            valor: parsed.data.valor,
            formaPagamento: parsed.data.formaPagamento,
            statusPagamento: parsed.data.statusPagamento,
            dataPagamento: parsed.data.dataPagamento,
            periodoReferencia: parsed.data.periodoReferencia,
            observacoes: parsed.data.observacoes,
        });

        revalidatePath('/folha-pagamento');
        revalidatePath('/saidas');
        revalidatePath('/dashboard');
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
        if (parsed.data.formaPagamento !== undefined) updateData.forma_pagamento = parsed.data.formaPagamento;
        if (parsed.data.statusPagamento !== undefined) updateData.status_pagamento = parsed.data.statusPagamento;
        if (parsed.data.dataPagamento !== undefined) updateData.data_pagamento = formatDateForDB(parsed.data.dataPagamento);
        if (parsed.data.observacoes !== undefined) updateData.observacoes = parsed.data.observacoes;

        const { data, error } = await supabase.from('folha_pagamento')
            .update(updateData)
            .eq('id', id).eq('user_id', user.id).select('id').single();

        if (error) {
            console.error('[updateFolhaPagamentoAction] DB Error:', JSON.stringify(error));
            return { success: false, error: formatDatabaseError(error, 'Erro ao atualizar pagamento') };
        }

        const { data: folhaAtualizada, error: folhaError } = await supabase
            .from('folha_pagamento')
            .select('funcionario, valor, forma_pagamento, status_pagamento, data_pagamento, observacoes')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (folhaError) {
            console.error('[updateFolhaPagamentoAction] Sync Fetch Error:', JSON.stringify(folhaError));
            return {
                success: false,
                error: formatDatabaseError(folhaError, 'Pagamento atualizado, mas houve erro ao sincronizar despesa')
            };
        }

        await syncFolhaPagamentoSaida(supabase, user.id, id, {
            funcionario: folhaAtualizada.funcionario,
            valor: parseFloat(folhaAtualizada.valor as string),
            formaPagamento: folhaAtualizada.forma_pagamento,
            statusPagamento: folhaAtualizada.status_pagamento,
            dataPagamento: new Date(`${folhaAtualizada.data_pagamento}T12:00:00`),
            periodoReferencia: parsed.data.periodoReferencia,
            observacoes: parsed.data.observacoes ?? folhaAtualizada.observacoes,
        });

        revalidatePath('/folha-pagamento');
        revalidatePath('/saidas');
        revalidatePath('/dashboard');
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
        const marker = getFolhaSaidaMarker(id);
        const { error: saidaError } = await supabase
            .from('saidas')
            .delete()
            .eq('user_id', user.id)
            .ilike('observacoes', `%${marker}%`);

        if (saidaError) {
            console.error('[deleteFolhaPagamentoAction] Linked expense DB Error:', saidaError);
            return { success: false, error: formatDatabaseError(saidaError, 'Erro ao excluir despesa vinculada') };
        }

        const { data, error } = await supabase.from('folha_pagamento')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)
            .select('id')
            .single();
        if (error) {
            console.error('[deleteFolhaPagamentoAction] DB Error:', error);
            return { success: false, error: formatDatabaseError(error, 'Erro ao excluir pagamento') };
        }
        if (!data) return { success: false, error: 'Pagamento não encontrado ou não pertence ao usuário atual.' };
        revalidatePath('/folha-pagamento');
        revalidatePath('/saidas');
        revalidatePath('/dashboard');
        return { success: true, data: undefined };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}
