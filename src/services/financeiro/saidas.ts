import { createClient } from '@/lib/supabase/client';
import { Saida, ExpenseCategory, PaymentMethod } from '@/types';
import { PaginatedResult, BaseQueryParams, DateRangeParams, formatDateForDB, parseDBDate } from '../types';
import { sanitizeSearch } from '@/lib/security';

/**
 * Service Layer - Saídas (Despesas)
 */

function dbToSaida(row: Record<string, unknown>): Saida {
    return {
        id: row.id as string,
        descricao: row.descricao as string,
        categoria: row.categoria as ExpenseCategory,
        valor: parseFloat(row.valor as string),
        formaPagamento: row.forma_pagamento as PaymentMethod,
        data: parseDBDate(row.data as string)!,
        fornecedor: row.fornecedor as string | undefined,
        observacoes: row.observacoes as string | undefined,
        anexos: (row.anexos as any[]) || [],
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
    };
}

export interface SaidasQueryParams extends BaseQueryParams, DateRangeParams {
    categoria?: ExpenseCategory | 'all';
    fornecedor?: string;
}

export async function getSaidas(
    params: SaidasQueryParams = {}
): Promise<PaginatedResult<Saida>> {
    const supabase = createClient();
    const {
        page = 1,
        pageSize = 20,
        search = '',
        categoria = 'all',
        startDate,
        endDate,
        fornecedor
    } = params;

    let query = supabase.from('saidas').select('*', { count: 'exact' });

    if (categoria !== 'all') query = query.eq('categoria', categoria);
    if (fornecedor) query = query.eq('fornecedor', fornecedor);
    const safeSearch = sanitizeSearch(search);
    if (safeSearch) query = query.or(`descricao.ilike.%${safeSearch}%,fornecedor.ilike.%${safeSearch}%`);
    if (startDate) query = query.gte('data', startDate);
    if (endDate) query = query.lte('data', endDate);

    query = query.order('data', { ascending: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw new Error(`Erro ao buscar saídas: ${error.message}`);

    return {
        data: (data || []).map(dbToSaida),
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
    };
}

export async function getSaidaById(id: string): Promise<Saida | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('saidas').select('*').eq('id', id).single();
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Erro ao buscar saída: ${error.message}`);
    }
    return data ? dbToSaida(data) : null;
}

export async function createSaida(
    saida: Omit<Saida, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
): Promise<Saida> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('saidas')
        .insert({
            user_id: userId,
            descricao: saida.descricao,
            categoria: saida.categoria,
            valor: saida.valor,
            forma_pagamento: saida.formaPagamento,
            data: formatDateForDB(saida.data),
            fornecedor: saida.fornecedor,
            observacoes: saida.observacoes,
            anexos: saida.anexos,
        })
        .select()
        .single();

    if (error) throw new Error(`Erro ao criar saída: ${error.message}`);
    return dbToSaida(data);
}

export async function updateSaida(id: string, updates: Partial<Saida>): Promise<Saida> {
    const supabase = createClient();
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.descricao !== undefined) updateData.descricao = updates.descricao;
    if (updates.categoria !== undefined) updateData.categoria = updates.categoria;
    if (updates.valor !== undefined) updateData.valor = updates.valor;
    if (updates.formaPagamento !== undefined) updateData.forma_pagamento = updates.formaPagamento;
    if (updates.data !== undefined) updateData.data = formatDateForDB(updates.data);
    if (updates.fornecedor !== undefined) updateData.fornecedor = updates.fornecedor;
    if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;
    if (updates.anexos !== undefined) updateData.anexos = updates.anexos;

    const { data, error } = await supabase.from('saidas').update(updateData).eq('id', id).select().single();
    if (error) throw new Error(`Erro ao atualizar saída: ${error.message}`);
    return dbToSaida(data);
}

export async function deleteSaida(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('saidas').delete().eq('id', id);
    if (error) throw new Error(`Erro ao deletar saída: ${error.message}`);
}

/**
 * Busca total de saídas por período
 */
export async function getSaidasTotal(startDate: string, endDate: string): Promise<number> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('saidas')
        .select('valor')
        .gte('data', startDate)
        .lte('data', endDate);

    if (error) throw new Error(`Erro ao buscar total de saídas: ${error.message}`);

    return (data || []).reduce((sum: any, item: any) => sum + parseFloat(item.valor as string || '0'), 0);
}