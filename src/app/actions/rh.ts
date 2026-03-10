'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
    createFolhaPagamentoSchema, CreateFolhaPagamentoInput,
    updateFolhaPagamentoSchema, UpdateFolhaPagamentoInput
} from '@/lib/validations/folha-pagamento';
import { ActionResult, getAuthenticatedUser, formatDateForDB, validateId } from './shared';

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
        const idError = validateId(id);
        if (idError) return idError;
        const parsed = updateFolhaPagamentoSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Dados inválidos', errors: parsed.error.format() };

        const supabase = await createClient();

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        };
        if (parsed.data.funcionario !== undefined) updateData.funcionario = parsed.data.funcionario;
        if (parsed.data.cargo !== undefined) updateData.cargo = parsed.data.cargo;
        if (parsed.data.salarioBase !== undefined) updateData.salario_base = parsed.data.salarioBase;
        if (parsed.data.dataPagamento !== undefined) updateData.data_pagamento = formatDateForDB(parsed.data.dataPagamento);
        if (parsed.data.periodoReferencia !== undefined) updateData.periodo_referencia = parsed.data.periodoReferencia;
        if (parsed.data.horasExtras !== undefined) updateData.horas_extras = parsed.data.horasExtras;
        if (parsed.data.valorHorasExtras !== undefined) updateData.valor_horas_extras = parsed.data.valorHorasExtras;
        if (parsed.data.adicionalNoturno !== undefined) updateData.adicional_noturno = parsed.data.adicionalNoturno;
        if (parsed.data.outrosProventos !== undefined) updateData.outros_proventos = parsed.data.outrosProventos;
        if (parsed.data.faltas !== undefined) updateData.faltas = parsed.data.faltas;
        if (parsed.data.valorFaltas !== undefined) updateData.valor_faltas = parsed.data.valorFaltas;
        if (parsed.data.vales !== undefined) updateData.vales = parsed.data.vales;
        if (parsed.data.marmitas !== undefined) updateData.marmitas = parsed.data.marmitas;
        if (parsed.data.outrosDescontos !== undefined) updateData.outros_descontos = parsed.data.outrosDescontos;
        if (parsed.data.valorLiquido !== undefined) updateData.valor_liquido = parsed.data.valorLiquido;
        if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
        if (parsed.data.observacoes !== undefined) updateData.observacoes = parsed.data.observacoes;

        const { data, error } = await supabase.from('folha_pagamento')
            .update(updateData)
            .eq('id', id).eq('user_id', user.id).select('id').single();

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
        const idError = validateId(id);
        if (idError) return idError;
        const supabase = await createClient();
        const { error } = await supabase.from('folha_pagamento').delete().eq('id', id).eq('user_id', user.id);
        if (error) return { success: false, error: 'Erro ao excluir folha' };
        revalidatePath('/folha-pagamento');
        return { success: true, data: undefined };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}
