'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createBoletoSchema, updateBoletoSchema, CreateBoletoInput, UpdateBoletoInput } from '@/lib/validations/boletos';
import { z } from 'zod';

/**
 * Server Actions - Boletos
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

export async function createBoletoAction(
    input: CreateBoletoInput
): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();

        const parsed = createBoletoSchema.safeParse(input);
        if (!parsed.success) {
            const errorMessages = parsed.error.issues.map(e => e.message).join(', ');
            return {
                success: false,
                error: errorMessages || 'Dados inválidos',
                errors: parsed.error.format()
            };
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('boletos')
            .insert({
                user_id: user.id,
                cliente: parsed.data.cliente,
                valor: parsed.data.valor,
                banco: parsed.data.banco,
                data_vencimento: formatDateForDB(parsed.data.dataVencimento),
                data_pagamento: formatDateForDB(parsed.data.dataPagamento),
                status_pagamento: parsed.data.statusPagamento,
                observacoes: parsed.data.observacoes,
                convenio_id: parsed.data.convenioId,
            })
            .select('id')
            .single();

        if (error) {
            console.error('[createBoletoAction] DB Error:', error);
            return { success: false, error: 'Erro ao criar boleto' };
        }

        revalidatePath('/boletos');
        return { success: true, data: { id: data.id } };

    } catch (err) {
        console.error('[createBoletoAction] Error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function updateBoletoAction(
    id: string,
    input: UpdateBoletoInput
): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();

        if (!id || typeof id !== 'string') {
            return { success: false, error: 'ID inválido' };
        }

        const parsed = updateBoletoSchema.safeParse(input);
        if (!parsed.success) {
            const errorMessages = parsed.error.issues.map(e => e.message).join(', ');
            return {
                success: false,
                error: errorMessages || 'Dados inválidos',
                errors: parsed.error.format()
            };
        }

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        };

        if (parsed.data.cliente !== undefined) updateData.cliente = parsed.data.cliente;
        if (parsed.data.valor !== undefined) updateData.valor = parsed.data.valor;
        if (parsed.data.banco !== undefined) updateData.banco = parsed.data.banco;
        if (parsed.data.dataVencimento !== undefined) updateData.data_vencimento = formatDateForDB(parsed.data.dataVencimento);
        if (parsed.data.dataPagamento !== undefined) updateData.data_pagamento = formatDateForDB(parsed.data.dataPagamento);
        if (parsed.data.statusPagamento !== undefined) updateData.status_pagamento = parsed.data.statusPagamento;
        if (parsed.data.observacoes !== undefined) updateData.observacoes = parsed.data.observacoes;

        const supabase = await createClient();
        const { error } = await supabase
            .from('boletos')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('[updateBoletoAction] DB Error:', error);
            return { success: false, error: 'Erro ao atualizar boleto' };
        }

        revalidatePath('/boletos');
        return { success: true, data: { id } };

    } catch (err) {
        console.error('[updateBoletoAction] Error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function deleteBoletoAction(
    id: string
): Promise<ActionResult<null>> {
    try {
        const user = await getAuthenticatedUser();

        if (!id || typeof id !== 'string') {
            return { success: false, error: 'ID inválido' };
        }

        const supabase = await createClient();
        const { error } = await supabase
            .from('boletos')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('[deleteBoletoAction] DB Error:', error);
            return { success: false, error: 'Erro ao deletar boleto' };
        }

        revalidatePath('/boletos');
        return { success: true, data: null };

    } catch (err) {
        console.error('[deleteBoletoAction] Error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

/**
 * Marca boleto como pago
 */
export async function marcarBoletoPagoAction(
    id: string,
    dataPagamento?: Date
): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();

        if (!id || typeof id !== 'string') {
            return { success: false, error: 'ID inválido' };
        }

        const supabase = await createClient();
        const { error } = await supabase
            .from('boletos')
            .update({
                status_pagamento: 'pago',
                data_pagamento: formatDateForDB(dataPagamento || new Date()),
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('[marcarBoletoPagoAction] DB Error:', error);
            return { success: false, error: 'Erro ao marcar boleto como pago' };
        }

        revalidatePath('/boletos');
        return { success: true, data: { id } };

    } catch (err) {
        console.error('[marcarBoletoPagoAction] Error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}
