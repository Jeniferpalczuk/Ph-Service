'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createValeSchema, updateValeSchema, CreateValeInput, UpdateValeInput } from '@/lib/validations/vales';
import { z } from 'zod';

/**
 * Server Actions - Vales
 */

type ActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string; errors?: z.ZodFormattedError<unknown> };

function formatDateForDB(date: Date | undefined | null): string | null {
    if (!date) return null;
    return date instanceof Date ? date.toISOString().split('T')[0] : date;
}

async function getAuthenticatedUser() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error('Não autorizado');
    }

    return user;
}

export async function createValeAction(
    input: CreateValeInput
): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();

        const parsed = createValeSchema.safeParse(input);
        if (!parsed.success) {
            return {
                success: false,
                error: 'Dados inválidos',
                errors: parsed.error.format()
            };
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('vales')
            .insert({
                user_id: user.id,
                funcionario: parsed.data.funcionario,
                valor: parsed.data.valor,
                data: formatDateForDB(parsed.data.data),
                motivo: parsed.data.motivo,
                status: parsed.data.status || 'aberto',
                valor_pago: parsed.data.valorPago,
                data_pagamento: formatDateForDB(parsed.data.dataPagamento),
                observacoes: parsed.data.observacoes,
            })
            .select('id')
            .single();

        if (error) {
            console.error('[createValeAction] DB Error:', error);
            return { success: false, error: 'Erro ao criar vale' };
        }

        revalidatePath('/vales');
        return { success: true, data: { id: data.id } };

    } catch (err) {
        console.error('[createValeAction] Error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function updateValeAction(
    id: string,
    input: UpdateValeInput
): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();

        if (!id || typeof id !== 'string') {
            return { success: false, error: 'ID inválido' };
        }

        const parsed = updateValeSchema.safeParse(input);
        if (!parsed.success) {
            return {
                success: false,
                error: 'Dados inválidos',
                errors: parsed.error.format()
            };
        }

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        };

        if (parsed.data.funcionario !== undefined) updateData.funcionario = parsed.data.funcionario;
        if (parsed.data.valor !== undefined) updateData.valor = parsed.data.valor;
        if (parsed.data.data !== undefined) updateData.data = formatDateForDB(parsed.data.data);
        if (parsed.data.motivo !== undefined) updateData.motivo = parsed.data.motivo;
        if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
        if (parsed.data.valorPago !== undefined) updateData.valor_pago = parsed.data.valorPago;
        if (parsed.data.dataPagamento !== undefined) updateData.data_pagamento = formatDateForDB(parsed.data.dataPagamento);
        if (parsed.data.observacoes !== undefined) updateData.observacoes = parsed.data.observacoes;

        const supabase = await createClient();
        const { error } = await supabase
            .from('vales')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('[updateValeAction] DB Error:', error);
            return { success: false, error: 'Erro ao atualizar vale' };
        }

        revalidatePath('/vales');
        return { success: true, data: { id } };

    } catch (err) {
        console.error('[updateValeAction] Error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function deleteValeAction(
    id: string
): Promise<ActionResult<null>> {
    try {
        const user = await getAuthenticatedUser();

        if (!id || typeof id !== 'string') {
            return { success: false, error: 'ID inválido' };
        }

        const supabase = await createClient();
        const { error } = await supabase
            .from('vales')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('[deleteValeAction] DB Error:', error);
            return { success: false, error: 'Erro ao deletar vale' };
        }

        revalidatePath('/vales');
        return { success: true, data: null };

    } catch (err) {
        console.error('[deleteValeAction] Error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

/**
 * Quita um vale específico
 */
export async function quitarValeAction(
    id: string,
    observacao?: string
): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();

        if (!id || typeof id !== 'string') {
            return { success: false, error: 'ID inválido' };
        }

        const supabase = await createClient();

        // Buscar vale atual
        const { data: vale } = await supabase
            .from('vales')
            .select('valor, observacoes')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (!vale) {
            return { success: false, error: 'Vale não encontrado' };
        }

        const { error } = await supabase
            .from('vales')
            .update({
                status: 'quitado',
                valor_pago: vale.valor,
                data_pagamento: new Date().toISOString().split('T')[0],
                observacoes: observacao
                    ? `${vale.observacoes || ''} [Quitado] ${observacao}`.trim()
                    : vale.observacoes,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('[quitarValeAction] DB Error:', error);
            return { success: false, error: 'Erro ao quitar vale' };
        }

        revalidatePath('/vales');
        revalidatePath('/folha-pagamento');
        return { success: true, data: { id } };

    } catch (err) {
        console.error('[quitarValeAction] Error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

/**
 * Quita todos os vales pendentes de um funcionário
 */
export async function quitarValesFuncionarioAction(
    funcionarioNome: string,
    observacao?: string
): Promise<ActionResult<{ count: number }>> {
    try {
        const user = await getAuthenticatedUser();

        if (!funcionarioNome || typeof funcionarioNome !== 'string') {
            return { success: false, error: 'Nome do funcionário inválido' };
        }

        const supabase = await createClient();

        // Buscar vales pendentes
        const { data: valesPendentes, error: fetchError } = await supabase
            .from('vales')
            .select('id, valor')
            .eq('funcionario', funcionarioNome)
            .eq('status', 'aberto')
            .eq('user_id', user.id);

        if (fetchError) {
            console.error('[quitarValesFuncionarioAction] Fetch Error:', fetchError);
            return { success: false, error: 'Erro ao buscar vales' };
        }

        if (!valesPendentes || valesPendentes.length === 0) {
            return { success: true, data: { count: 0 } };
        }

        // Quitar todos
        const ids = valesPendentes.map(v => v.id);
        const { error: updateError } = await supabase
            .from('vales')
            .update({
                status: 'quitado',
                data_pagamento: new Date().toISOString().split('T')[0],
                observacoes: observacao ? `[Quitado em lote] ${observacao}` : '[Quitado em lote - Folha]',
                updated_at: new Date().toISOString(),
            })
            .in('id', ids)
            .eq('user_id', user.id);

        if (updateError) {
            console.error('[quitarValesFuncionarioAction] Update Error:', updateError);
            return { success: false, error: 'Erro ao quitar vales' };
        }

        revalidatePath('/vales');
        revalidatePath('/folha-pagamento');
        return { success: true, data: { count: valesPendentes.length } };

    } catch (err) {
        console.error('[quitarValesFuncionarioAction] Error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}
