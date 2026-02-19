import { createClient } from '@/lib/supabase/client';
import { PagamentoFuncionario, PaymentStatus, PaymentMethod } from '@/types';
import { PaginatedResult, BaseQueryParams, DateRangeParams, formatDateForDB, parseDBDate } from '../types';
import { sanitizeSearch } from '@/lib/security';

/**
 * Service Layer - Folha de Pagamento
 */

function dbToPagamento(row: Record<string, unknown>): PagamentoFuncionario {
    return {
        id: row.id as string,
        funcionario: row.funcionario as string,
        cargoFuncao: row.cargo_funcao as string,
        valor: parseFloat(row.valor as string),
        descontos: row.descontos ? parseFloat(row.descontos as string) : undefined,
        faltas: row.faltas ? parseFloat(row.faltas as string) : undefined,
        formaPagamento: row.forma_pagamento as PaymentMethod,
        statusPagamento: row.status_pagamento as PaymentStatus,
        dataPagamento: parseDBDate(row.data_pagamento as string)!,
        observacoes: row.observacoes as string | undefined,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
    };
}

export interface FolhaPagamentoQueryParams extends BaseQueryParams, DateRangeParams {
    status?: PaymentStatus | 'all';
    funcionario?: string;
    cargo?: string;
    mes?: number; // 0-11
    ano?: number;
}

export async function getFolhaPagamento(
    params: FolhaPagamentoQueryParams = {}
): Promise<PaginatedResult<PagamentoFuncionario>> {
    const supabase = createClient();
    const {
        page = 1,
        pageSize = 20,
        search = '',
        status = 'all',
        startDate,
        endDate,
        funcionario,
        cargo
    } = params;

    let query = supabase.from('folha_pagamento').select('*', { count: 'exact' });

    if (status !== 'all') query = query.eq('status_pagamento', status);
    if (funcionario) {
        const safeFuncionario = sanitizeSearch(funcionario);
        if (safeFuncionario) query = query.ilike('funcionario', `%${safeFuncionario}%`);
    }
    if (cargo) query = query.eq('cargo_funcao', cargo);
    const safeSearch = sanitizeSearch(search);
    if (safeSearch) query = query.or(`funcionario.ilike.%${safeSearch}%,cargo_funcao.ilike.%${safeSearch}%`);
    if (startDate) query = query.gte('data_pagamento', startDate);
    if (endDate) query = query.lte('data_pagamento', endDate);

    query = query.order('data_pagamento', { ascending: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw new Error(`Erro ao buscar folha de pagamento: ${error.message}`);

    return {
        data: (data || []).map(dbToPagamento),
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
    };
}

export async function getPagamentoById(id: string): Promise<PagamentoFuncionario | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('folha_pagamento').select('*').eq('id', id).single();
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Erro ao buscar pagamento: ${error.message}`);
    }
    return data ? dbToPagamento(data) : null;
}

export async function createPagamento(
    pagamento: Omit<PagamentoFuncionario, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
): Promise<PagamentoFuncionario> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('folha_pagamento')
        .insert({
            user_id: userId,
            funcionario: pagamento.funcionario,
            cargo_funcao: pagamento.cargoFuncao,
            valor: pagamento.valor,
            descontos: pagamento.descontos,
            faltas: pagamento.faltas,
            forma_pagamento: pagamento.formaPagamento,
            status_pagamento: pagamento.statusPagamento,
            data_pagamento: formatDateForDB(pagamento.dataPagamento),
            observacoes: pagamento.observacoes,
        })
        .select()
        .single();

    if (error) throw new Error(`Erro ao criar pagamento: ${error.message}`);
    return dbToPagamento(data);
}

export async function updatePagamento(id: string, updates: Partial<PagamentoFuncionario>): Promise<PagamentoFuncionario> {
    const supabase = createClient();
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.funcionario !== undefined) updateData.funcionario = updates.funcionario;
    if (updates.cargoFuncao !== undefined) updateData.cargo_funcao = updates.cargoFuncao;
    if (updates.valor !== undefined) updateData.valor = updates.valor;
    if (updates.descontos !== undefined) updateData.descontos = updates.descontos;
    if (updates.faltas !== undefined) updateData.faltas = updates.faltas;
    if (updates.formaPagamento !== undefined) updateData.forma_pagamento = updates.formaPagamento;
    if (updates.statusPagamento !== undefined) updateData.status_pagamento = updates.statusPagamento;
    if (updates.dataPagamento !== undefined) updateData.data_pagamento = formatDateForDB(updates.dataPagamento);
    if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;

    const { data, error } = await supabase.from('folha_pagamento').update(updateData).eq('id', id).select().single();
    if (error) throw new Error(`Erro ao atualizar pagamento: ${error.message}`);
    return dbToPagamento(data);
}

export async function deletePagamento(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('folha_pagamento').delete().eq('id', id);
    if (error) throw new Error(`Erro ao deletar pagamento: ${error.message}`);
}

/**
 * Calcula o valor líquido de um funcionário
 */
export function calcularValorLiquido(
    salarioBase: number,
    totalVales: number,
    diasFalta: number
): number {
    const valorDia = salarioBase / 30; // Mês comercial
    const descontoFaltas = valorDia * diasFalta;
    const liquido = Math.max(0, salarioBase - totalVales - descontoFaltas);
    return parseFloat(liquido.toFixed(2));
}

/**
 * Busca resumo da folha para um período
 */
export async function getFolhaStats(
    startDate: string,
    endDate: string
): Promise<{
    totalPago: number;
    totalPendente: number;
    totalDescontos: number;
    quantidadePagamentos: number;
}> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('folha_pagamento')
        .select('valor, descontos, status_pagamento')
        .gte('data_pagamento', startDate)
        .lte('data_pagamento', endDate);

    if (error) throw new Error(`Erro ao buscar stats da folha: ${error.message}`);

    const pagamentos = data || [];

    return {
        totalPago: pagamentos
            .filter(p => p.status_pagamento === 'pago')
            .reduce((sum, p) => sum + parseFloat(p.valor as string || '0'), 0),
        totalPendente: pagamentos
            .filter(p => p.status_pagamento === 'pendente')
            .reduce((sum, p) => sum + parseFloat(p.valor as string || '0'), 0),
        totalDescontos: pagamentos
            .reduce((sum, p) => sum + parseFloat(p.descontos as string || '0'), 0),
        quantidadePagamentos: pagamentos.length,
    };
}
