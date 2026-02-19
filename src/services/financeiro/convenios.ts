import { createClient } from '@/lib/supabase/client';
import { Convenio, PaymentStatus, ClosingType } from '@/types';
import { PaginatedResult, BaseQueryParams, DateRangeParams, formatDateForDB, parseDBDate } from '../types';
import { sanitizeSearch } from '@/lib/security';

/**
 * Service Layer - Convênios
 */

function dbToConvenio(row: Record<string, unknown>): Convenio {
    return {
        id: row.id as string,
        empresaCliente: row.empresa_cliente as string,
        tipoFechamento: row.tipo_fechamento as ClosingType,
        periodoReferencia: row.periodo_referencia as string,
        dataFechamento: parseDBDate(row.data_fechamento as string)!,
        valorBoleto: parseFloat(row.valor_boleto as string),
        banco: row.banco as string,
        dataVencimento: parseDBDate(row.data_vencimento as string)!,
        dataPagamento: parseDBDate(row.data_pagamento as string),
        statusPagamento: row.status_pagamento as PaymentStatus,
        notaFiscal: row.nota_fiscal as string | undefined,
        enviadoPara: row.enviado_para as string | undefined,
        observacoes: row.observacoes as string | undefined,
        anexos: (row.anexos as any[]) || [],
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
    };
}

export interface ConveniosQueryParams extends BaseQueryParams, DateRangeParams {
    status?: PaymentStatus | 'all';
    empresa?: string;
}

export async function getConvenios(
    params: ConveniosQueryParams = {}
): Promise<PaginatedResult<Convenio>> {
    const supabase = createClient();
    const {
        page = 1,
        pageSize = 20,
        search = '',
        status = 'all',
        startDate,
        endDate,
        empresa
    } = params;

    let query = supabase.from('convenios').select('*', { count: 'exact' });

    if (status !== 'all') query = query.eq('status_pagamento', status);
    if (empresa) query = query.eq('empresa_cliente', empresa);
    const safeSearch = sanitizeSearch(search);
    if (safeSearch) query = query.or(`empresa_cliente.ilike.%${safeSearch}%,periodo_referencia.ilike.%${safeSearch}%`);
    if (startDate) query = query.gte('data_vencimento', startDate);
    if (endDate) query = query.lte('data_vencimento', endDate);

    query = query.order('data_vencimento', { ascending: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw new Error(`Erro ao buscar convênios: ${error.message}`);

    return {
        data: (data || []).map(dbToConvenio),
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
    };
}

export async function getConvenioById(id: string): Promise<Convenio | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('convenios').select('*').eq('id', id).single();
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Erro ao buscar convênio: ${error.message}`);
    }
    return data ? dbToConvenio(data) : null;
}

export async function createConvenio(
    convenio: Omit<Convenio, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
): Promise<Convenio> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('convenios')
        .insert({
            user_id: userId,
            empresa_cliente: convenio.empresaCliente,
            tipo_fechamento: convenio.tipoFechamento,
            periodo_referencia: convenio.periodoReferencia,
            data_fechamento: formatDateForDB(convenio.dataFechamento),
            valor_boleto: convenio.valorBoleto,
            banco: convenio.banco,
            data_vencimento: formatDateForDB(convenio.dataVencimento),
            data_pagamento: formatDateForDB(convenio.dataPagamento),
            status_pagamento: convenio.statusPagamento,
            nota_fiscal: convenio.notaFiscal,
            enviado_para: convenio.enviadoPara,
            observacoes: convenio.observacoes,
            anexos: convenio.anexos,
        })
        .select()
        .single();

    if (error) throw new Error(`Erro ao criar convênio: ${error.message}`);
    return dbToConvenio(data);
}

export async function updateConvenio(id: string, updates: Partial<Convenio>): Promise<Convenio> {
    const supabase = createClient();
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.empresaCliente !== undefined) updateData.empresa_cliente = updates.empresaCliente;
    if (updates.tipoFechamento !== undefined) updateData.tipo_fechamento = updates.tipoFechamento;
    if (updates.periodoReferencia !== undefined) updateData.periodo_referencia = updates.periodoReferencia;
    if (updates.dataFechamento !== undefined) updateData.data_fechamento = formatDateForDB(updates.dataFechamento);
    if (updates.valorBoleto !== undefined) updateData.valor_boleto = updates.valorBoleto;
    if (updates.banco !== undefined) updateData.banco = updates.banco;
    if (updates.dataVencimento !== undefined) updateData.data_vencimento = formatDateForDB(updates.dataVencimento);
    if (updates.dataPagamento !== undefined) updateData.data_pagamento = formatDateForDB(updates.dataPagamento);
    if (updates.statusPagamento !== undefined) updateData.status_pagamento = updates.statusPagamento;
    if (updates.notaFiscal !== undefined) updateData.nota_fiscal = updates.notaFiscal;
    if (updates.enviadoPara !== undefined) updateData.enviado_para = updates.enviadoPara;
    if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;
    if (updates.anexos !== undefined) updateData.anexos = updates.anexos;

    const { data, error } = await supabase.from('convenios').update(updateData).eq('id', id).select().single();
    if (error) throw new Error(`Erro ao atualizar convênio: ${error.message}`);
    return dbToConvenio(data);
}

export async function deleteConvenio(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('convenios').delete().eq('id', id);
    if (error) throw new Error(`Erro ao deletar convênio: ${error.message}`);
}
