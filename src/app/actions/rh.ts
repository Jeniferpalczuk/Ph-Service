'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
    createFolhaPagamentoSchema, CreateFolhaPagamentoInput,
    updateFolhaPagamentoSchema, UpdateFolhaPagamentoInput
} from '@/lib/validations/folha-pagamento';
import { z } from 'zod';

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
    if (error || !user) throw new Error('Não autorizado');
    return user;
}

// ===========================================
// FOLHA DE PAGAMENTO
// ===========================================

export async function createFolhaPagamentoAction(input: CreateFolhaPagamentoInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();
        const parsed = createFolhaPagamentoSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Dados inválidos', errors: parsed.error.format() };

        const supabase = await createClient();
        const { data, error } = await supabase.from('folha_pagamento').insert({
            user_id: user.id,
            funcionario: parsed.data.funcionario,
            cargo: parsed.data.cargo,
            salario_base: parsed.data.salarioBase,
            data_pagamento: formatDateForDB(parsed.data.dataPagamento),
            periodo_referencia: parsed.data.periodoReferencia,
            horas_extras: parsed.data.horasExtras,
            valor_horas_extras: parsed.data.valorHorasExtras,
            adicional_noturno: parsed.data.adicionalNoturno,
            outros_proventos: parsed.data.outrosProventos,
            faltas: parsed.data.faltas,
            valor_faltas: parsed.data.valorFaltas,
            vales: parsed.data.vales,
            marmitas: parsed.data.marmitas,
            outros_descontos: parsed.data.outrosDescontos,
            valor_liquido: parsed.data.valorLiquido,
            status: parsed.data.status,
            observacoes: parsed.data.observacoes,
        }).select('id').single();

        if (error) return { success: false, error: 'Erro ao criar folha de pagamento' };
        revalidatePath('/folha-pagamento');
        return { success: true, data: { id: data.id } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function updateFolhaPagamentoAction(id: string, input: UpdateFolhaPagamentoInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();
        const parsed = updateFolhaPagamentoSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Dados inválidos', errors: parsed.error.format() };

        const supabase = await createClient();
        const { data, error } = await supabase.from('folha_pagamento').update({
            funcionario: parsed.data.funcionario,
            cargo: parsed.data.cargo,
            salario_base: parsed.data.salarioBase,
            data_pagamento: formatDateForDB(parsed.data.dataPagamento),
            periodo_referencia: parsed.data.periodoReferencia,
            horas_extras: parsed.data.horasExtras,
            valor_horas_extras: parsed.data.valorHorasExtras,
            adicional_noturno: parsed.data.adicionalNoturno,
            outros_proventos: parsed.data.outrosProventos,
            faltas: parsed.data.faltas,
            valor_faltas: parsed.data.valorFaltas,
            vales: parsed.data.vales,
            marmitas: parsed.data.marmitas,
            outros_descontos: parsed.data.outrosDescontos,
            valor_liquido: parsed.data.valorLiquido,
            status: parsed.data.status,
            observacoes: parsed.data.observacoes,
        }).eq('id', id).eq('user_id', user.id).select('id').single();

        if (error) return { success: false, error: 'Erro ao atualizar folha' };
        revalidatePath('/folha-pagamento');
        return { success: true, data: { id: data.id } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function deleteFolhaPagamentoAction(id: string): Promise<ActionResult<void>> {
    try {
        const user = await getAuthenticatedUser();
        const supabase = await createClient();
        const { error } = await supabase.from('folha_pagamento').delete().eq('id', id).eq('user_id', user.id);
        if (error) return { success: false, error: 'Erro ao excluir folha' };
        revalidatePath('/folha-pagamento');
        return { success: true, data: undefined };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}
