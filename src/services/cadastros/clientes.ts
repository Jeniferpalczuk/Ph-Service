import { createClient } from '@/lib/supabase/client';
import { Cliente } from '@/types';
import { PaginatedResult, BaseQueryParams, formatDateForDB } from '../types';

/**
 * Service Layer - Clientes
 */

function dbToCliente(row: Record<string, unknown>): Cliente {
    return {
        id: row.id as string,
        nome: row.nome as string,
        tipo: row.tipo as 'empresa' | 'pessoa_fisica',
        telefone: row.telefone as string | undefined,
        endereco: row.endereco as string | undefined,
        ativo: row.ativo as boolean,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
    };
}

export interface ClientesQueryParams extends BaseQueryParams {
    tipo?: 'empresa' | 'pessoa_fisica' | 'all';
    ativo?: boolean | 'all';
}

export async function getClientes(
    params: ClientesQueryParams = {}
): Promise<PaginatedResult<Cliente>> {
    const supabase = createClient();
    const { page = 1, pageSize = 20, search = '', tipo = 'all', ativo = 'all' } = params;

    let query = supabase.from('clientes').select('*', { count: 'exact' });

    if (tipo !== 'all') query = query.eq('tipo', tipo);
    if (ativo !== 'all') query = query.eq('ativo', ativo);
    if (search) query = query.or(`nome.ilike.%${search}%,telefone.ilike.%${search}%`);

    query = query.order('nome', { ascending: true });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw new Error(`Erro ao buscar clientes: ${error.message}`);

    return {
        data: (data || []).map(dbToCliente),
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
    };
}

export async function getClienteById(id: string): Promise<Cliente | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single();
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Erro ao buscar cliente: ${error.message}`);
    }
    return data ? dbToCliente(data) : null;
}

export async function createCliente(
    cliente: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
): Promise<Cliente> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('clientes')
        .insert({
            user_id: userId,
            nome: cliente.nome,
            tipo: cliente.tipo,
            telefone: cliente.telefone,
            endereco: cliente.endereco,
            ativo: cliente.ativo ?? true,
        })
        .select()
        .single();

    if (error) throw new Error(`Erro ao criar cliente: ${error.message}`);
    return dbToCliente(data);
}

export async function updateCliente(id: string, updates: Partial<Cliente>): Promise<Cliente> {
    const supabase = createClient();
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.nome !== undefined) updateData.nome = updates.nome;
    if (updates.tipo !== undefined) updateData.tipo = updates.tipo;
    if (updates.telefone !== undefined) updateData.telefone = updates.telefone;
    if (updates.endereco !== undefined) updateData.endereco = updates.endereco;
    if (updates.ativo !== undefined) updateData.ativo = updates.ativo;

    const { data, error } = await supabase.from('clientes').update(updateData).eq('id', id).select().single();
    if (error) throw new Error(`Erro ao atualizar cliente: ${error.message}`);
    return dbToCliente(data);
}

export async function deleteCliente(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw new Error(`Erro ao deletar cliente: ${error.message}`);
}
