import { createClient } from '@/lib/supabase/client';
import { FechamentoCaixa } from '@/types';
import { PaginatedResult } from '../types';
import { sanitizeSearch } from '@/lib/security';

export interface CaixaQueryParams {
    page?: number;
    pageSize?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    turno?: 'manha' | 'tarde';
}

/**
 * Converte linha do banco para o tipo FechamentoCaixa
 */
export function mapCaixaRow(row: any): FechamentoCaixa {
    return {
        id: row.id,
        data: new Date(row.data),
        funcionario: row.funcionario,
        turno: row.turno,
        entradas: {
            dinheiro: row.entrada_dinheiro || 0,
            pix: row.entrada_pix || 0,
            credito: row.entrada_credito || 0,
            debito: row.entrada_debito || 0,
            alimentacao: row.entrada_alimentacao || 0,
        },
        saidas: row.saidas || 0,
        observacoes: row.observacoes,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

/**
 * Busca lista paginada de fechamentos de caixa
 */
export async function getFechamentosCaixa(params: CaixaQueryParams = {}): Promise<PaginatedResult<FechamentoCaixa>> {
    const supabase = createClient();
    const { page = 1, pageSize = 20, search, startDate, endDate, turno } = params;

    let query = supabase
        .from('fechamentos_caixa')
        .select('*', { count: 'exact' });

    const safeSearch = sanitizeSearch(search);
    if (safeSearch) {
        query = query.ilike('funcionario', `%${safeSearch}%`);
    }

    if (startDate) {
        query = query.gte('data', startDate);
    }

    if (endDate) {
        query = query.lte('data', endDate);
    }

    if (turno && turno !== 'all' as any) {
        query = query.eq('turno', turno);
    }

    const { data, count, error } = await query
        .order('data', { ascending: false })
        .order('turno', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw error;

    return {
        data: (data || []).map(mapCaixaRow),
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
    };
}

/**
 * Busca resumo financeiro do período
 */
export async function getCaixaSummary(startDate: string, endDate: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('fechamentos_caixa')
        .select('entrada_dinheiro, entrada_pix, entrada_credito, entrada_debito, entrada_alimentacao, saidas')
        .gte('data', startDate)
        .lte('data', endDate);

    if (error) throw error;

    const summary = (data || []).reduce((acc: any, row: any) => {
        acc.entradas += (row.entrada_dinheiro || 0) + (row.entrada_pix || 0) +
            (row.entrada_credito || 0) + (row.entrada_debito || 0) +
            (row.entrada_alimentacao || 0);
        acc.saidas += (row.saidas || 0);
        return acc;
    }, { entradas: 0, saidas: 0 });

    return summary;
}

/**
 * Busca por ID
 */
export async function getFechamentoById(id: string): Promise<FechamentoCaixa | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('fechamentos_caixa')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return mapCaixaRow(data);
}
