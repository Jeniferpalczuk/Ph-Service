'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
    createConvenioSchema, updateConvenioSchema, CreateConvenioInput, UpdateConvenioInput
} from '@/lib/validations/convenios';
import {
    createSaidaSchema, updateSaidaSchema, CreateSaidaInput, UpdateSaidaInput
} from '@/lib/validations/saidas';
import {
    createCaixaSchema, updateCaixaSchema, CreateCaixaInput, UpdateCaixaInput
} from '@/lib/validations/caixa';
import { ActionResult, getAuthenticatedUser, formatDateForDB, validateId } from './shared';

// ===========================================
// CONVÊNIOS
// ===========================================

export async function createConvenioAction(input: CreateConvenioInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();
        const parsed = createConvenioSchema.safeParse(input);
        if (!parsed.success) {
            const errorMessages = parsed.error.issues.map(e => e.message).join(', ');
            return { success: false, error: errorMessages || 'Dados inválidos', errors: parsed.error.format() };
        }

        const supabase = await createClient();
        const { data, error } = await supabase.from('convenios').insert({
            user_id: user.id,
            empresa: parsed.data.empresa,
            valor: parsed.data.valor,
            periodo_referencia: parsed.data.periodoReferencia,
            data_fechamento: formatDateForDB(parsed.data.dataFechamento),
            data_vencimento: formatDateForDB(parsed.data.dataVencimento),
            data_pagamento: formatDateForDB(parsed.data.dataPagamento),
            status_pagamento: parsed.data.statusPagamento,
            observacoes: parsed.data.observacoes,
        }).select('id').single();

        if (error) return { success: false, error: 'Erro ao criar convênio' };
        revalidatePath('/convenios');
        return { success: true, data: { id: data.id } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function updateConvenioAction(id: string, input: UpdateConvenioInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();
        const idError = validateId(id);
        if (idError) return idError;
        const parsed = updateConvenioSchema.safeParse(input);
        if (!parsed.success) {
            const errorMessages = parsed.error.issues.map(e => e.message).join(', ');
            return { success: false, error: errorMessages || 'Dados inválidos', errors: parsed.error.format() };
        }

        const supabase = await createClient();
        const { data, error } = await supabase.from('convenios').update({
            empresa: parsed.data.empresa,
            valor: parsed.data.valor,
            periodo_referencia: parsed.data.periodoReferencia,
            data_fechamento: formatDateForDB(parsed.data.dataFechamento),
            data_vencimento: formatDateForDB(parsed.data.dataVencimento),
            data_pagamento: formatDateForDB(parsed.data.dataPagamento),
            status_pagamento: parsed.data.statusPagamento,
            observacoes: parsed.data.observacoes,
        }).eq('id', id).eq('user_id', user.id).select('id').single();

        if (error) return { success: false, error: 'Erro ao atualizar convênio' };
        revalidatePath('/convenios');
        return { success: true, data: { id: data.id } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function deleteConvenioAction(id: string): Promise<ActionResult<void>> {
    try {
        const user = await getAuthenticatedUser();
        const idError = validateId(id);
        if (idError) return idError;
        const supabase = await createClient();
        const { error } = await supabase.from('convenios').delete().eq('id', id).eq('user_id', user.id);
        if (error) return { success: false, error: 'Erro ao excluir convênio' };
        revalidatePath('/convenios');
        return { success: true, data: undefined };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

// ===========================================
// SAÍDAS
// ===========================================

export async function createSaidaAction(input: CreateSaidaInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();
        const parsed = createSaidaSchema.safeParse(input);
        if (!parsed.success) {
            const errorMessages = parsed.error.issues.map(e => e.message).join(', ');
            return { success: false, error: errorMessages || 'Dados inválidos', errors: parsed.error.format() };
        }

        const supabase = await createClient();
        const { data, error } = await supabase.from('saidas').insert({
            user_id: user.id,
            descricao: parsed.data.descricao,
            valor: parsed.data.valor,
            data: formatDateForDB(parsed.data.data),
            categoria: parsed.data.categoria,
            metodo_pagamento: parsed.data.metodoPagamento,
            observacoes: parsed.data.observacoes,
        }).select('id').single();

        if (error) return { success: false, error: 'Erro ao criar saída' };
        revalidatePath('/saidas');
        revalidatePath('/dashboard');
        return { success: true, data: { id: data.id } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function updateSaidaAction(id: string, input: UpdateSaidaInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();
        const idError = validateId(id);
        if (idError) return idError;
        const parsed = updateSaidaSchema.safeParse(input);
        if (!parsed.success) {
            const errorMessages = parsed.error.issues.map(e => e.message).join(', ');
            return { success: false, error: errorMessages || 'Dados inválidos', errors: parsed.error.format() };
        }

        const supabase = await createClient();
        const { data, error } = await supabase.from('saidas').update({
            descricao: parsed.data.descricao,
            valor: parsed.data.valor,
            data: formatDateForDB(parsed.data.data),
            categoria: parsed.data.categoria,
            metodo_pagamento: parsed.data.metodoPagamento,
            observacoes: parsed.data.observacoes,
        }).eq('id', id).eq('user_id', user.id).select('id').single();

        if (error) return { success: false, error: 'Erro ao atualizar saída' };
        revalidatePath('/saidas');
        revalidatePath('/dashboard');
        return { success: true, data: { id: data.id } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

export async function deleteSaidaAction(id: string): Promise<ActionResult<void>> {
    try {
        const user = await getAuthenticatedUser();
        const idError = validateId(id);
        if (idError) return idError;
        const supabase = await createClient();
        const { error } = await supabase.from('saidas').delete().eq('id', id).eq('user_id', user.id);
        if (error) return { success: false, error: 'Erro ao excluir saída' };
        revalidatePath('/saidas');
        revalidatePath('/dashboard');
        return { success: true, data: undefined };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

// ===========================================
// CAIXA
// ===========================================

export async function createCaixaAction(
    input: CreateCaixaInput
): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser();

        const parsed = createCaixaSchema.safeParse(input);
        if (!parsed.success) {
            const errorMessages = parsed.error.issues.map(e => e.message).join(', ');
            return {
                success: false,
                error: errorMessages || 'Dados inválidos',
                errors: parsed.error.format()
            };
        }

        const supabase = await createClient();
        const dataFormatada = formatDateForDB(parsed.data.data);

        // Valores originais digitados
        let creditoFinal = parsed.data.entradas.credito;
        let debitoFinal = parsed.data.entradas.debito;

        // 🔵 SE FOR TURNO DA TARDE → BUSCAR MANHÃ
        if (parsed.data.turno === 'tarde') {

            const { data: turnoManha, error: erroBusca } = await supabase
                .from('fechamentos_caixa')
                .select('*')
                .eq('data', dataFormatada)
                .eq('turno', 'manha')
                .eq('user_id', user.id)
                .single();

            if (erroBusca || !turnoManha) {
                return {
                    success: false,
                    error: 'Cadastre primeiro o turno da manhã'
                };
            }

            // 🔥 SUBTRAÇÃO
            creditoFinal = creditoFinal - (turnoManha.entrada_credito || 0);
            debitoFinal = debitoFinal - (turnoManha.entrada_debito || 0);

            // ⚠️ VALIDAÇÃO DE NEGATIVO
            if (creditoFinal < 0 || debitoFinal < 0) {
                return {
                    success: false,
                    error: 'Valor informado menor que o turno da manhã'
                };
            }
        }

        // 🔥 AGORA INSERE COM VALORES AJUSTADOS
        const { data, error } = await supabase
            .from('fechamentos_caixa')
            .insert({
                user_id: user.id,
                data: dataFormatada,
                funcionario: parsed.data.funcionario,
                turno: parsed.data.turno,
                entrada_dinheiro: parsed.data.entradas.dinheiro,
                entrada_pix: parsed.data.entradas.pix,
                entrada_credito: creditoFinal,
                entrada_debito: debitoFinal,
                saidas: parsed.data.saidas,
                observacoes: parsed.data.observacoes,
            })
            .select('id')
            .single();

        if (error) {
            return {
                success: false,
                error: `Erro ao criar fechamento: ${error.message}`
            };
        }

        revalidatePath('/caixa');
        revalidatePath('/dashboard');

        return { success: true, data: { id: data.id } };

    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Erro desconhecido'
        };
    }
}


export async function deleteCaixaAction(id: string): Promise<ActionResult<void>> {
    try {
        const user = await getAuthenticatedUser();
        const idError = validateId(id);
        if (idError) return idError;
        const supabase = await createClient();
        const { error } = await supabase.from('fechamentos_caixa').delete().eq('id', id).eq('user_id', user.id);
        if (error) return { success: false, error: 'Erro ao excluir fechamento' };
        revalidatePath('/caixa');
        revalidatePath('/dashboard');
        return { success: true, data: undefined };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}
