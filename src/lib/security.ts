/**
 * Utilitários de Segurança — PH Service
 * 
 * Centraliza sanitização, validação e helpers de segurança
 * usados em services e server actions.
 */

/**
 * Sanitiza uma string de busca para uso seguro em queries ilike do Supabase.
 * 
 * Remove caracteres especiais do PostgreSQL LIKE que poderiam ser usados
 * para manipular a query (% e _), e faz trim do input.
 * 
 * Exemplo:
 *   sanitizeSearch("João % DROP TABLE") → "João  DROP TABLE"
 *   sanitizeSearch("  test_user  ") → "test_user"
 *   sanitizeSearch(undefined) → ""
 */
export function sanitizeSearch(input: string | undefined | null): string {
    if (!input) return '';
    return input
        .trim()
        .replace(/%/g, '')   // Remove wildcard %
        .replace(/_/g, '')   // Remove single-char wildcard _
        .replace(/\\/g, ''); // Remove escape char \
}

/**
 * Valida e sanitiza um UUID.
 * Retorna null se o ID não for um UUID válido.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function sanitizeId(id: string | undefined | null): string | null {
    if (!id || typeof id !== 'string') return null;
    const trimmed = id.trim();
    return UUID_REGEX.test(trimmed) ? trimmed : null;
}

/**
 * Limita o valor máximo de pageSize para prevenir abuso.
 */
export function clampPageSize(pageSize: number | undefined, max: number = 100): number {
    const size = pageSize ?? 20;
    if (size < 1) return 1;
    if (size > max) return max;
    return size;
}
