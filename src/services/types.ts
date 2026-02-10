/**
 * Tipos base para paginação e queries reutilizáveis em todos os services.
 */

export interface PaginatedResult<T> {
    data: T[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface BaseQueryParams {
    page?: number;
    pageSize?: number;
    search?: string;
}

export interface DateRangeParams {
    startDate?: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD
}

/**
 * Helper para formatar datas para o Supabase (YYYY-MM-DD)
 */
export function formatDateForDB(date: Date | undefined): string | null {
    if (!date) return null;
    return date instanceof Date ? date.toISOString().split('T')[0] : date;
}

/**
 * Helper para converter string de data do DB para Date com timezone ajustado
 */
export function parseDBDate(dateStr: string | null | undefined): Date | undefined {
    if (!dateStr) return undefined;
    return new Date(dateStr + 'T12:00:00');
}
