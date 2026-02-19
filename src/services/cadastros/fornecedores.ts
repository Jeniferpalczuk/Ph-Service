import { createClient } from '@/lib/supabase/client';
import { Fornecedor } from '@/types';
import { PaginatedResult, BaseQueryParams, formatDateForDB } from '../types';
import { sanitizeSearch } from '@/lib/security';

/**
 * Service Layer - Fornecedores
 */

function dbToFornecedor(row: Record<string, unknown>): Fornecedor {
    return {
        id: row.id as string,
        nome: row.nome as string,
        telefone: row.telefone as string, // Antes contato
        servico: row.servico as string, // Antes categoria
        ativo: row.ativo as boolean,
        observacoes: row.observacoes as string | undefined,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
    };
}

export interface FornecedoresQueryParams extends BaseQueryParams {
    servico?: string;
    ativo?: boolean | 'all';
}

export async function getFornecedores(
    params: FornecedoresQueryParams = {}
): Promise<PaginatedResult<Fornecedor>> {
    const supabase = createClient();
    const { page = 1, pageSize = 20, search = '', servico, ativo = 'all' } = params;

    let query = supabase.from('fornecedores').select('*', { count: 'exact' });

    if (servico) query = query.eq('servico', servico);
    if (ativo !== 'all') query = query.eq('ativo', ativo);
    const safeSearch = sanitizeSearch(search);
    if (safeSearch) query = query.or(`nome.ilike.%${safeSearch}%,servico.ilike.%${safeSearch}%`);

    query = query.order('nome', { ascending: true });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw new Error(`Erro ao buscar fornecedores: ${error.message}`);

    return {
        data: (data || []).map(dbToFornecedor),
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
    };
}

export async function getFornecedorById(id: string): Promise<Fornecedor | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('fornecedores').select('*').eq('id', id).single();
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Erro ao buscar fornecedor: ${error.message}`);
    }
    return data ? dbToFornecedor(data) : null;
}

export async function createFornecedor(
    fornecedor: Omit<Fornecedor, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
): Promise<Fornecedor> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('fornecedores')
        .insert({
            user_id: userId,
            nome: fornecedor.nome,
            telefone: fornecedor.telefone, // Antes contato
            servico: fornecedor.servico, // Antes categoria
            ativo: fornecedor.ativo ?? true,
            observacoes: fornecedor.observacoes,
        })
        .select()
        .single();

    if (error) throw new Error(`Erro ao criar fornecedor: ${error.message}`);
    return dbToFornecedor(data);
}

export async function updateFornecedor(id: string, updates: Partial<Fornecedor>): Promise<Fornecedor> {
    const supabase = createClient();
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.nome !== undefined) updateData.nome = updates.nome;
    if (updates.telefone !== undefined) updateData.telefone = updates.telefone; // Antes contato
    if (updates.servico !== undefined) updateData.servico = updates.servico; // Antes categoria
    if (updates.ativo !== undefined) updateData.ativo = updates.ativo;
    if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;

    const { data, error } = await supabase.from('fornecedores').update(updateData).eq('id', id).select().single();
    if (error) throw new Error(`Erro ao atualizar fornecedor: ${error.message}`);
    return dbToFornecedor(data);
}

export async function deleteFornecedor(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('fornecedores').delete().eq('id', id);
    if (error) throw new Error(`Erro ao deletar fornecedor: ${error.message}`);
}
