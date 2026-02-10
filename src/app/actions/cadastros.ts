'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
    createClienteSchema, updateClienteSchema, CreateClienteInput, UpdateClienteInput
} from '@/lib/validations/clientes';
import {
    createFornecedorSchema, updateFornecedorSchema, CreateFornecedorInput, UpdateFornecedorInput
} from '@/lib/validations/fornecedores';
import { z } from 'zod';

type ActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string; errors?: z.ZodFormattedError<unknown> };

async function getAuthenticatedUser() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Não autorizado');
    return user;
}

// ===========================================
// CLIENTES
// ===========================================

export async function createClienteAction(input: CreateClienteInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();
        const parsed = createClienteSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Dados inválidos', errors: parsed.error.format() };

        const supabase = await createClient();
        const { data, error } = await supabase.from('clientes').insert({
            user_id: user.id,
            nome: parsed.data.nome,
            tipo: parsed.data.tipo,
            telefone: parsed.data.telefone,
            endereco: parsed.data.endereco,
            ativo: parsed.data.ativo,
        }).select('id').single();

        if (error) return { success: false, error: 'Erro ao criar cliente' };
        revalidatePath('/cadastros');
        return { success: true, data: { id: data.id } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function updateClienteAction(id: string, input: UpdateClienteInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();
        const parsed = updateClienteSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Dados inválidos', errors: parsed.error.format() };

        const supabase = await createClient();
        const { error } = await supabase.from('clientes').update({
            ...parsed.data,
            updated_at: new Date().toISOString(),
        }).eq('id', id).eq('user_id', user.id);

        if (error) return { success: false, error: 'Erro ao atualizar cliente' };
        revalidatePath('/cadastros');
        return { success: true, data: { id } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

// ===========================================
// FORNECEDORES
// ===========================================

export async function createFornecedorAction(input: CreateFornecedorInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();
        const parsed = createFornecedorSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Dados inválidos', errors: parsed.error.format() };

        const supabase = await createClient();
        const { data, error } = await supabase.from('fornecedores').insert({
            user_id: user.id,
            nome: parsed.data.nome,
            servico: parsed.data.servico,
            telefone: parsed.data.telefone,
            ativo: parsed.data.ativo,
        }).select('id').single();

        if (error) return { success: false, error: 'Erro ao criar fornecedor' };
        revalidatePath('/cadastros');
        return { success: true, data: { id: data.id } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function updateFornecedorAction(id: string, input: UpdateFornecedorInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();
        const parsed = updateFornecedorSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Dados inválidos', errors: parsed.error.format() };

        const supabase = await createClient();
        const { error } = await supabase.from('fornecedores').update({
            ...parsed.data,
            updated_at: new Date().toISOString(),
        }).eq('id', id).eq('user_id', user.id);

        if (error) return { success: false, error: 'Erro ao atualizar fornecedor' };
        revalidatePath('/cadastros');
        return { success: true, data: { id } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function deleteClienteAction(id: string): Promise<ActionResult<void>> {
    try {
        const user = await getAuthenticatedUser();
        const supabase = await createClient();
        const { error } = await supabase.from('clientes').delete().eq('id', id).eq('user_id', user.id);
        if (error) return { success: false, error: 'Erro ao excluir cliente' };
        revalidatePath('/cadastros');
        return { success: true, data: undefined };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function deleteFornecedorAction(id: string): Promise<ActionResult<void>> {
    try {
        const user = await getAuthenticatedUser();
        const supabase = await createClient();
        const { error } = await supabase.from('fornecedores').delete().eq('id', id).eq('user_id', user.id);
        if (error) return { success: false, error: 'Erro ao excluir fornecedor' };
        revalidatePath('/cadastros');
        return { success: true, data: undefined };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}
