import { createClient } from '@/lib/supabase/client';
import { Vale, ValeStatus } from '@/types';
import { PaginatedResult, BaseQueryParams, DateRangeParams, formatDateForDB, parseDBDate } from '../types';
import { sanitizeSearch } from '@/lib/security';

/**
 * Service Layer - Vales
 */

function dbToVale(row: Record<string, unknown>): Vale {
    return {
        id: row.id as string,
        funcionario: row.funcionario as string,
        valor: parseFloat(row.valor as string),
        data: parseDBDate(row.data as string)!,
        motivo: row.motivo as string,
        status: row.status as ValeStatus,
        valorPago: row.valor_pago ? parseFloat(row.valor_pago as string) : undefined,
        dataPagamento: parseDBDate(row.data_pagamento as string),
        observacoes: row.observacoes as string | undefined,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
    };
}

export interface ValesQueryParams extends BaseQueryParams, DateRangeParams {
    status?: ValeStatus | 'all';
    funcionario?: string;
}

export async function getVales(
    params: ValesQueryParams = {}
): Promise<PaginatedResult<Vale>> {
    const supabase = createClient();
    const {
        page = 1,
        pageSize = 20,
        search = '',
        status = 'all',
        startDate,
        endDate,
        funcionario
    } = params;

    let query = supabase.from('vales').select('*', { count: 'exact' });

    if (status !== 'all') query = query.eq('status', status);
    if (funcionario) query = query.eq('funcionario', funcionario);
    const safeSearch = sanitizeSearch(search);
    if (safeSearch) query = query.or(`funcionario.ilike.%${safeSearch}%,motivo.ilike.%${safeSearch}%`);
    if (startDate) query = query.gte('data', startDate);
    if (endDate) query = query.lte('data', endDate);

    query = query.order('data', { ascending: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw new Error(`Erro ao buscar vales: ${error.message}`);

    return {
        data: (data || []).map(dbToVale),
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
    };
}

export async function getValeById(id: string): Promise<Vale | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('vales').select('*').eq('id', id).single();
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Erro ao buscar vale: ${error.message}`);
    }
    return data ? dbToVale(data) : null;
}

/**
 * Busca vales pendentes de um funcionário específico
 */
export async function getValesPendentesByFuncionario(funcionarioNome: string): Promise<Vale[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('vales')
        .select('*')
        .eq('funcionario', funcionarioNome)
        .eq('status', 'aberto')
        .order('data', { ascending: false });

    if (error) throw new Error(`Erro ao buscar vales pendentes: ${error.message}`);
    return (data || []).map(dbToVale);
}

/**
 * Calcula total de vales pendentes de um funcionário
 */
export async function getTotalValesPendentes(funcionarioNome: string): Promise<number> {
    const vales = await getValesPendentesByFuncionario(funcionarioNome);
    return vales.reduce((sum, v) => sum + v.valor, 0);
}

export async function createVale(
    vale: Omit<Vale, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
): Promise<Vale> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('vales')
        .insert({
            user_id: userId,
            funcionario: vale.funcionario,
            valor: vale.valor,
            data: formatDateForDB(vale.data),
            motivo: vale.motivo,
            status: vale.status || 'aberto',
            valor_pago: vale.valorPago,
            data_pagamento: formatDateForDB(vale.dataPagamento),
            observacoes: vale.observacoes,
        })
        .select()
        .single();

    if (error) throw new Error(`Erro ao criar vale: ${error.message}`);
    return dbToVale(data);
}

export async function updateVale(id: string, updates: Partial<Vale>): Promise<Vale> {
    const supabase = createClient();
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.funcionario !== undefined) updateData.funcionario = updates.funcionario;
    if (updates.valor !== undefined) updateData.valor = updates.valor;
    if (updates.data !== undefined) updateData.data = formatDateForDB(updates.data);
    if (updates.motivo !== undefined) updateData.motivo = updates.motivo;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.valorPago !== undefined) updateData.valor_pago = updates.valorPago;
    if (updates.dataPagamento !== undefined) updateData.data_pagamento = formatDateForDB(updates.dataPagamento);
    if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;

    const { data, error } = await supabase.from('vales').update(updateData).eq('id', id).select().single();
    if (error) throw new Error(`Erro ao atualizar vale: ${error.message}`);
    return dbToVale(data);
}

export async function deleteVale(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('vales').delete().eq('id', id);
    if (error) throw new Error(`Erro ao deletar vale: ${error.message}`);
}

/**
 * Quita múltiplos vales de um funcionário (usado na folha de pagamento)
 */
export async function quitarValesFuncionario(
    funcionarioNome: string,
    observacaoExtra?: string
): Promise<void> {
    const valesPendentes = await getValesPendentesByFuncionario(funcionarioNome);

    for (const vale of valesPendentes) {
        await updateVale(vale.id, {
            status: 'quitado',
            observacoes: `${vale.observacoes || ''} [Baixa Automática Folha] ${observacaoExtra || ''}`.trim()
        });
    }
}
