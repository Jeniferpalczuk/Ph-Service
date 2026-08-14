import { createClient } from '@/lib/supabase/client';
import { Marmita, PaymentMethod, PaymentStatus } from '@/types';
import { PaginatedResult } from '../types';
import { sanitizeSearch } from '@/lib/security';

export interface MarmitasQueryParams {
    page?: number;
    pageSize?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
}

export function mapMarmitaRow(row: Record<string, unknown>): Marmita {
    return {
        id: row.id as string,
        cliente: row.cliente as string,
        tamanho: row.tamanho as string,
        quantidade: row.quantidade as number | undefined,
        valorUnitario: row.valor_unitario as number | undefined,
        valorTotal: Number(row.valor_total || 0),
        dataEntrega: new Date(`${row.data_entrega as string}T12:00:00`),
        formaPagamento: row.forma_pagamento as PaymentMethod,
        statusRecebimento: row.status_recebimento as PaymentStatus,
        dataPagamento: row.data_pagamento ? new Date(`${row.data_pagamento as string}T12:00:00`) : undefined,
        observacoes: row.observacoes as string | undefined,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
    };
}

export async function getMarmitas(params: MarmitasQueryParams = {}): Promise<PaginatedResult<Marmita>> {
    const supabase = createClient();
    const { page = 1, pageSize = 20, search, startDate, endDate } = params;

    let query = supabase
        .from('marmitas')
        .select('*', { count: 'exact' });

    const safeSearch = sanitizeSearch(search);
    if (safeSearch) {
        query = query.ilike('cliente', `%${safeSearch}%`);
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
