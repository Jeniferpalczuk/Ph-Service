'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
    createMarmitaSchema, updateMarmitaSchema, CreateMarmitaInput, UpdateMarmitaInput,
    createMarmitasLoteSchema, CreateMarmitasLoteInput
} from '@/lib/validations/marmitas';
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

export async function createMarmitaAction(input: CreateMarmitaInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();
        const parsed = createMarmitaSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Dados inválidos', errors: parsed.error.format() };

        const supabase = await createClient();
        const { data, error } = await supabase.from('marmitas').insert({
            user_id: user.id,
            tamanho: parsed.data.tamanho,
            quantidade: parsed.data.quantidade,
            valor_unitario: parsed.data.valorUnitario,
            valor_total: parsed.data.valorTotal,
            data_entrega: formatDateForDB(parsed.data.dataEntrega),
            observacoes: parsed.data.observacoes,
        }).select('id').single();

        if (error) return { success: false, error: 'Erro ao criar marmita' };
        revalidatePath('/marmitas');
        return { success: true, data: { id: data.id } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function createMarmitasLoteAction(input: CreateMarmitasLoteInput): Promise<ActionResult<{ count: number }>> {
    try {
        const user = await getAuthenticatedUser();
        const parsed = createMarmitasLoteSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Dados inválidos', errors: parsed.error.format() };

        const supabase = await createClient();
        const inserts = parsed.data.marmitas.map(m => ({
            user_id: user.id,
            tamanho: m.tamanho,
            quantidade: m.quantidade,
            valor_unitario: m.valorUnitario,
            valor_total: m.valorTotal,
            data_entrega: formatDateForDB(parsed.data.dataEntrega),
        }));

        const { error } = await supabase.from('marmitas').insert(inserts);

        if (error) return { success: false, error: 'Erro ao criar marmitas em lote' };
        revalidatePath('/marmitas');
        return { success: true, data: { count: inserts.length } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function updateMarmitaAction(id: string, input: UpdateMarmitaInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();
        const parsed = updateMarmitaSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Dados inválidos', errors: parsed.error.format() };

        const supabase = await createClient();
        const { data, error } = await supabase.from('marmitas').update({
            tamanho: parsed.data.tamanho,
            quantidade: parsed.data.quantidade,
            valor_unitario: parsed.data.valorUnitario,
            valor_total: parsed.data.valorTotal,
            data_entrega: formatDateForDB(parsed.data.dataEntrega),
            observacoes: parsed.data.observacoes,
            updated_at: new Date().toISOString(),
        }).eq('id', id).eq('user_id', user.id).select('id').single();

        if (error) return { success: false, error: 'Erro ao atualizar marmita' };
        revalidatePath('/marmitas');
        return { success: true, data: { id: data.id } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function deleteMarmitaAction(id: string): Promise<ActionResult<void>> {
    try {
        const user = await getAuthenticatedUser();
        const supabase = await createClient();
        const { error } = await supabase.from('marmitas').delete().eq('id', id).eq('user_id', user.id);
        if (error) return { success: false, error: 'Erro ao excluir marmita' };
        revalidatePath('/marmitas');
        return { success: true, data: undefined };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}
