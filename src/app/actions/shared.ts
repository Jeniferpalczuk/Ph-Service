

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

type DatabaseError = {
    code?: string;
    message?: string;
    details?: string | null;
    hint?: string | null;
};

/**
 * Converte erros do PostgREST em mensagens úteis para quem está usando o
 * sistema. O código continua registrando o erro completo no servidor, mas o
 * usuário recebe uma orientação objetiva quando o bloqueio é causado pelo
 * RLS ou por um registro inexistente.
 */
export function formatDatabaseError(error: DatabaseError | null | undefined, fallback: string) {
    if (!error) return fallback;

    if (
        error.code === '42501' ||
        /row-level security|permission denied|not authorized/i.test(error.message ?? '')
    ) {
        return 'Permissão negada pelo banco. Verifique as políticas RLS do Supabase para esta tabela.';
    }

    if (error.code === 'PGRST116') {
        return 'Registro não encontrado ou não pertence ao usuário atual.';
    }

    if (error.code === '23505') {
        return 'Já existe um registro com esses dados.';
    }

    if (error.code === '23503') {
        return 'Não é possível concluir porque este registro possui dados relacionados.';
    }

    if (error.code === '23502') {
        return 'Faltam dados obrigatórios para concluir a operação.';
    }

    return error.message ? `${fallback}: ${error.message}` : fallback;
}

/**
 * Obtém o usuário autenticado do servidor.
 * Lança erro se não autenticado (tratado pelo catch da action).
 */
export async function getAuthenticatedUser() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        console.error('[getAuthenticatedUser] Falha ao validar a sessão:', error.message, error.status);
        if (error.status === 401 || (error.status ?? 0) >= 500) {
            throw new Error('Não foi possível validar sua sessão agora. Atualize a página e tente novamente.');
        }
        throw new Error('Não autorizado');
    }

    if (!user) {
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
