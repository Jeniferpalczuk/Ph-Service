'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
    createBoletoSchema,
    updateBoletoSchema,
    importBoletosSchema,
    CreateBoletoInput,
    UpdateBoletoInput,
    ImportBoletoInput
} from '@/lib/validations/boletos';
import { ActionResult, getAuthenticatedUser, formatDateForDB, validateId } from './shared';
import type { BoletoPdfPreview } from '@/lib/boletos/pdf-import';

/**
 * Server Actions - Boletos
 */

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

export async function analisarBoletoPdfAction(
    formData: FormData
): Promise<ActionResult<{ fileName: string; boletos: BoletoPdfPreview[] }>> {
    try {
        await getAuthenticatedUser();

        const file = formData.get('file');
        if (!(file instanceof File)) {
            return { success: false, error: 'Selecione um arquivo PDF' };
        }

        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (!isPdf) {
            return { success: false, error: 'O arquivo precisa ser um PDF' };
        }

        const maxFileSize = 10 * 1024 * 1024;
        if (file.size > maxFileSize) {
            return { success: false, error: 'O PDF deve ter no máximo 10 MB' };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const { parseBoletosPdf } = await import('@/lib/boletos/pdf-import');
        const boletos = await parseBoletosPdf(buffer);

        if (boletos.length === 0) {
            return {
                success: false,
                error: 'Não encontrei dados de boleto no PDF. Verifique se o arquivo tem texto selecionável.'
            };
        }

        return {
            success: true,
            data: {
                fileName: file.name,
                boletos,
            }
        };
    } catch (err) {
        console.error('[analisarBoletoPdfAction] Error:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Erro ao analisar PDF'
        };
    }
}

function dateFromISODate(value: string | null | undefined) {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
}

export async function importarBoletosPdfAction(
    input: ImportBoletoInput[]
): Promise<ActionResult<{ created: number; ids: string[] }>> {
    try {
        const user = await getAuthenticatedUser();

        const parsed = importBoletosSchema.safeParse(input);
        if (!parsed.success) {
            const errorMessages = parsed.error.issues.map(e => e.message).join(', ');
            return {
                success: false,
                error: errorMessages || 'Dados inválidos',
                errors: parsed.error.format()
            };
        }

        const rows = parsed.data.map((boleto) => ({
            user_id: user.id,
            cliente: boleto.cliente,
            valor: boleto.valor,
            banco: boleto.banco,
            data_vencimento: formatDateForDB(dateFromISODate(boleto.dataVencimento)),
            data_pagamento: formatDateForDB(dateFromISODate(boleto.dataPagamento)),
            status_pagamento: boleto.statusPagamento,
            observacoes: boleto.observacoes,
        }));

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('boletos')
            .insert(rows)
            .select('id');

        if (error) {
            console.error('[importarBoletosPdfAction] DB Error:', error);
            return { success: false, error: 'Erro ao importar boletos' };
        }

        revalidatePath('/boletos');
        revalidatePath('/dashboard');
        return {
            success: true,
            data: {
                created: data?.length ?? rows.length,
                ids: (data ?? []).map((row) => row.id as string),
            }
        };

    } catch (err) {
        console.error('[importarBoletosPdfAction] Error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function updateBoletoAction(
    id: string,
    input: UpdateBoletoInput
): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();

        const idError = validateId(id);
        if (idError) return idError;

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

        const idError = validateId(id);
        if (idError) return idError;

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

        const idError = validateId(id);
        if (idError) return idError;

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('boletos')
            .update({
                status_pagamento: 'pago',
                data_pagamento: formatDateForDB(dataPagamento || new Date()),
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', user.id)
            .select('id')
            .single();

        if (error) {
            console.error('[marcarBoletoPagoAction] DB Error:', error);
            if (error.code === 'PGRST116') {
                return { success: false, error: 'Boleto não encontrado para este usuário' };
            }
            return { success: false, error: `Erro ao marcar boleto como pago: ${error.message}` };
        }

        revalidatePath('/boletos');
        revalidatePath('/dashboard');
        return { success: true, data: { id: data.id } };

    } catch (err) {
        console.error('[marcarBoletoPagoAction] Error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}
