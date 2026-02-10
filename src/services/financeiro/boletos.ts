import { createClient } from '@/lib/supabase/client';
import { Boleto, PaymentStatus } from '@/types';
import { PaginatedResult, BaseQueryParams, DateRangeParams, formatDateForDB, parseDBDate } from '../types';

/**
 * Service Layer - Boletos
 */

function dbToBoleto(row: Record<string, unknown>): Boleto {
    return {
        id: row.id as string,
        cliente: row.cliente as string,
        valor: parseFloat(row.valor as string),
        banco: row.banco as string,
        dataVencimento: parseDBDate(row.data_vencimento as string)!,
        dataPagamento: parseDBDate(row.data_pagamento as string),
        statusPagamento: row.status_pagamento as PaymentStatus,
        observacoes: row.observacoes as string | undefined,
        convenioId: row.convenio_id as string | undefined,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
    };
}

export interface BoletosQueryParams extends BaseQueryParams, DateRangeParams {
    status?: PaymentStatus | 'all';
    cliente?: string;
    banco?: string;
}

export async function getBoletos(
    params: BoletosQueryParams = {}
): Promise<PaginatedResult<Boleto>> {
    const supabase = createClient();
    const {
        page = 1,
        pageSize = 20,
        search = '',
        status = 'all',
        startDate,
        endDate,
        banco
    } = params;

    let query = supabase.from('boletos').select('*', { count: 'exact' });

    if (status !== 'all') query = query.eq('status_pagamento', status);
    if (banco) query = query.eq('banco', banco);
    if (search) query = query.or(`cliente.ilike.%${search}%,observacoes.ilike.%${search}%`);
    if (startDate) query = query.gte('data_vencimento', startDate);
    if (endDate) query = query.lte('data_vencimento', endDate);

    // Ordenação: Pendentes primeiro, depois por vencimento
    query = query
        .order('status_pagamento', { ascending: true }) // 'pago' vem depois de 'pendente'
        .order('data_vencimento', { ascending: true });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw new Error(`Erro ao buscar boletos: ${error.message}`);

    return {
        data: (data || []).map(dbToBoleto),
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
    };
}

export async function getBoletoById(id: string): Promise<Boleto | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('boletos').select('*').eq('id', id).single();
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Erro ao buscar boleto: ${error.message}`);
    }
    return data ? dbToBoleto(data) : null;
}

export async function createBoleto(
    boleto: Omit<Boleto, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
): Promise<Boleto> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('boletos')
        .insert({
            user_id: userId,
            cliente: boleto.cliente,
            valor: boleto.valor,
            banco: boleto.banco,
            data_vencimento: formatDateForDB(boleto.dataVencimento),
            data_pagamento: formatDateForDB(boleto.dataPagamento),
            status_pagamento: boleto.statusPagamento,
            observacoes: boleto.observacoes,
            convenio_id: boleto.convenioId,
        })
        .select()
        .single();

    if (error) throw new Error(`Erro ao criar boleto: ${error.message}`);
    return dbToBoleto(data);
}

export async function updateBoleto(id: string, updates: Partial<Boleto>): Promise<Boleto> {
    const supabase = createClient();
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.cliente !== undefined) updateData.cliente = updates.cliente;
    if (updates.valor !== undefined) updateData.valor = updates.valor;
    if (updates.banco !== undefined) updateData.banco = updates.banco;
    if (updates.dataVencimento !== undefined) updateData.data_vencimento = formatDateForDB(updates.dataVencimento);
    if (updates.dataPagamento !== undefined) updateData.data_pagamento = formatDateForDB(updates.dataPagamento);
    if (updates.statusPagamento !== undefined) updateData.status_pagamento = updates.statusPagamento;
    if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;

    const { data, error } = await supabase.from('boletos').update(updateData).eq('id', id).select().single();
    if (error) throw new Error(`Erro ao atualizar boleto: ${error.message}`);
    return dbToBoleto(data);
}

export async function deleteBoleto(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('boletos').delete().eq('id', id);
    if (error) throw new Error(`Erro ao deletar boleto: ${error.message}`);
}

/**
 * Busca resumo de boletos para dashboard
 */
export async function getBoletosStats(): Promise<{
    totalPendente: number;
    totalPago: number;
    totalVencido: number;
    quantidadePendente: number;
    quantidadeVencido: number;
}> {
    const supabase = createClient();

    const today = new Date().toISOString().split('T')[0];

    const [pendentes, pagos, vencidos] = await Promise.all([
        supabase.from('boletos').select('valor').eq('status_pagamento', 'pendente').gte('data_vencimento', today),
        supabase.from('boletos').select('valor').eq('status_pagamento', 'pago'),
        supabase.from('boletos').select('valor').eq('status_pagamento', 'pendente').lt('data_vencimento', today),
    ]);

    const sumValues = (items: { valor: unknown }[] | null) =>
        (items || []).reduce((sum, item) => sum + parseFloat(item.valor as string || '0'), 0);

    return {
        totalPendente: sumValues(pendentes.data),
        totalPago: sumValues(pagos.data),
        totalVencido: sumValues(vencidos.data),
        quantidadePendente: (pendentes.data || []).length,
        quantidadeVencido: (vencidos.data || []).length,
    };
}
