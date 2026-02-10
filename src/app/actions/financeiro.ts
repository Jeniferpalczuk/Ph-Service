'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
    createConvenioSchema, updateConvenioSchema, CreateConvenioInput, UpdateConvenioInput
} from '@/lib/validations/convenios';
import {
    createSaidaSchema, updateSaidaSchema, CreateSaidaInput, UpdateSaidaInput
} from '@/lib/validations/saidas';
import {
    createCaixaSchema, updateCaixaSchema, CreateCaixaInput, UpdateCaixaInput
} from '@/lib/validations/caixa';
import { z } from 'zod';

type ActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string; errors?: z.ZodFormattedError<unknown> };

function formatDateForDB(date: Date | undefined | null): string | null {
    if (!date) return null;
    return date instanceof Date ? date.toISOString().split('T')[0] : date;
}

async function getAuthenticatedUser() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Não autorizado');
    return user;
}

// ===========================================
// CONVÊNIOS
// ===========================================

export async function createConvenioAction(input: CreateConvenioInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();
        const parsed = createConvenioSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Dados inválidos', errors: parsed.error.format() };

        const supabase = await createClient();
        const { data, error } = await supabase.from('convenios').insert({
            user_id: user.id,
            empresa: parsed.data.empresa,
            valor: parsed.data.valor,
            periodo_referencia: parsed.data.periodoReferencia,
            data_fechamento: formatDateForDB(parsed.data.dataFechamento),
            data_vencimento: formatDateForDB(parsed.data.dataVencimento),
            data_pagamento: formatDateForDB(parsed.data.dataPagamento),
            status_pagamento: parsed.data.statusPagamento,
            observacoes: parsed.data.observacoes,
        }).select('id').single();

        if (error) return { success: false, error: 'Erro ao criar convênio' };
        revalidatePath('/convenios');
        return { success: true, data: { id: data.id } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function updateConvenioAction(id: string, input: UpdateConvenioInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();
        const parsed = updateConvenioSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Dados inválidos', errors: parsed.error.format() };

        const supabase = await createClient();
        const { data, error } = await supabase.from('convenios').update({
            empresa: parsed.data.empresa,
            valor: parsed.data.valor,
            periodo_referencia: parsed.data.periodoReferencia,
            data_fechamento: formatDateForDB(parsed.data.dataFechamento),
            data_vencimento: formatDateForDB(parsed.data.dataVencimento),
            data_pagamento: formatDateForDB(parsed.data.dataPagamento),
            status_pagamento: parsed.data.statusPagamento,
            observacoes: parsed.data.observacoes,
        }).eq('id', id).eq('user_id', user.id).select('id').single();

        if (error) return { success: false, error: 'Erro ao atualizar convênio' };
        revalidatePath('/convenios');
        return { success: true, data: { id: data.id } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function deleteConvenioAction(id: string): Promise<ActionResult<void>> {
    try {
        const user = await getAuthenticatedUser();
        const supabase = await createClient();
        const { error } = await supabase.from('convenios').delete().eq('id', id).eq('user_id', user.id);
        if (error) return { success: false, error: 'Erro ao excluir convênio' };
        revalidatePath('/convenios');
        return { success: true, data: undefined };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

// ===========================================
// SAÍDAS
// ===========================================

export async function createSaidaAction(input: CreateSaidaInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();
        const parsed = createSaidaSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Dados inválidos', errors: parsed.error.format() };

        const supabase = await createClient();
        const { data, error } = await supabase.from('saidas').insert({
            user_id: user.id,
            descricao: parsed.data.descricao,
            valor: parsed.data.valor,
            data: formatDateForDB(parsed.data.data),
            categoria: parsed.data.categoria,
            metodo_pagamento: parsed.data.metodoPagamento,
            observacoes: parsed.data.observacoes,
        }).select('id').single();

        if (error) return { success: false, error: 'Erro ao criar saída' };
        revalidatePath('/saidas');
        revalidatePath('/dashboard');
        return { success: true, data: { id: data.id } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function updateSaidaAction(id: string, input: UpdateSaidaInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();
        const parsed = updateSaidaSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Dados inválidos', errors: parsed.error.format() };

        const supabase = await createClient();
        const { data, error } = await supabase.from('saidas').update({
            descricao: parsed.data.descricao,
            valor: parsed.data.valor,
            data: formatDateForDB(parsed.data.data),
            categoria: parsed.data.categoria,
            metodo_pagamento: parsed.data.metodoPagamento,
            observacoes: parsed.data.observacoes,
        }).eq('id', id).eq('user_id', user.id).select('id').single();

        if (error) return { success: false, error: 'Erro ao atualizar saída' };
        revalidatePath('/saidas');
        revalidatePath('/dashboard');
        return { success: true, data: { id: data.id } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function deleteSaidaAction(id: string): Promise<ActionResult<void>> {
    try {
        const user = await getAuthenticatedUser();
        const supabase = await createClient();
        const { error } = await supabase.from('saidas').delete().eq('id', id).eq('user_id', user.id);
        if (error) return { success: false, error: 'Erro ao excluir saída' };
        revalidatePath('/saidas');
        revalidatePath('/dashboard');
        return { success: true, data: undefined };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

// ===========================================
// CAIXA
// ===========================================

export async function createCaixaAction(input: CreateCaixaInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();
        const parsed = createCaixaSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Dados inválidos', errors: parsed.error.format() };

        const supabase = await createClient();
        const { data, error } = await supabase.from('fechamentos_caixa').insert({
            user_id: user.id,
            data: formatDateForDB(parsed.data.data),
            funcionario: parsed.data.funcionario,
            turno: parsed.data.turno,
            entrada_dinheiro: parsed.data.entradas.dinheiro,
            entrada_pix: parsed.data.entradas.pix,
            entrada_credito: parsed.data.entradas.credito,
            entrada_debito: parsed.data.entradas.debito,
            entrada_alimentacao: parsed.data.entradas.alimentacao,
            saidas: parsed.data.saidas,
            observacoes: parsed.data.observacoes,
        }).select('id').single();

        if (error) return { success: false, error: 'Erro ao criar fechamento de caixa' };
        revalidatePath('/caixa');
        revalidatePath('/dashboard');
        return { success: true, data: { id: data.id } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function deleteCaixaAction(id: string): Promise<ActionResult<void>> {
    try {
        const user = await getAuthenticatedUser();
        const supabase = await createClient();
        const { error } = await supabase.from('fechamentos_caixa').delete().eq('id', id).eq('user_id', user.id);
        if (error) return { success: false, error: 'Erro ao excluir fechamento' };
        revalidatePath('/caixa');
        revalidatePath('/dashboard');
        return { success: true, data: undefined };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}
