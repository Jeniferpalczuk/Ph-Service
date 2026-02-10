import { createClient } from '@/lib/supabase/client';
import { Marmita } from '@/types';
import { PaginatedResult } from '../types';

export interface MarmitasQueryParams {
    page?: number;
    pageSize?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
}

export function mapMarmitaRow(row: any): Marmita {
    return {
        id: row.id,
        cliente: row.cliente,
        tamanho: row.tamanho,
        quantidade: row.quantidade,
        valorUnitario: row.valor_unitario,
        valorTotal: row.valor_total,
        dataEntrega: new Date(row.data_entrega + 'T12:00:00'),
        formaPagamento: row.forma_pagamento,
        statusRecebimento: row.status_recebimento,
        dataPagamento: row.data_pagamento ? new Date(row.data_pagamento + 'T12:00:00') : undefined,
        observacoes: row.observacoes,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

export async function getMarmitas(params: MarmitasQueryParams = {}): Promise<PaginatedResult<Marmita>> {
    const supabase = createClient();
    const { page = 1, pageSize = 20, search, startDate, endDate } = params;

    let query = supabase
        .from('marmitas')
        .select('*', { count: 'exact' });

    if (search) {
        query = query.ilike('cliente', `%${search}%`);
    }

    if (startDate) {
        query = query.gte('data_entrega', startDate);
    }

    if (endDate) {
        query = query.lte('data_entrega', endDate);
    }

    const { data, count, error } = await query
        .order('data_entrega', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw error;

    return {
        data: (data || []).map(mapMarmitaRow),
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
    };
}
