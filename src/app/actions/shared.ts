

import { createClient } from '@/lib/supabase/server';
import { sanitizeId } from '@/lib/security';
import { z } from 'zod';

/**
 * Utilitários compartilhados entre Server Actions.
 * 
 * Centraliza: ActionResult, getAuthenticatedUser, formatDateForDB
 * que antes estavam duplicados em 6+ arquivos de actions.
 */

/**
 * Tipo padrão de retorno de Server Actions.
 */
export type ActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string; errors?: z.ZodFormattedError<unknown> };

/**
 * Obtém o usuário autenticado do servidor.
 * Lança erro se não autenticado (tratado pelo catch da action).
 */
export async function getAuthenticatedUser() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error('Não autorizado');
    }

    return user;
}

/**
 * Formata uma data para o formato esperado pelo Supabase (YYYY-MM-DD).
 */
export function formatDateForDB(date: Date | undefined | null): string | null {
    if (!date) return null;
    return date instanceof Date ? date.toISOString().split('T')[0] : date;
}

/**
 * Valida e sanitiza um ID de string (deve ser UUID válido).
 * Retorna erro ActionResult se inválido.
 */
export function validateId(id: unknown): ActionResult<never> | null {
    if (!id || typeof id !== 'string') {
        return { success: false, error: 'ID inválido' };
    }
    const safeId = sanitizeId(id);
    if (!safeId) {
        return { success: false, error: 'ID inválido: formato UUID esperado' };
    }
    return null; // ID é válido
}
