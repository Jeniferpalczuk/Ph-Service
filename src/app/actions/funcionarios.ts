'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createFuncionarioSchema, updateFuncionarioSchema, CreateFuncionarioInput, UpdateFuncionarioInput } from '@/lib/validations/funcionarios';
import { ActionResult, getAuthenticatedUser, formatDateForDB, validateId } from './shared';

/**
 * Server Actions - Funcionários
 * 
 * SEGURANÇA:
 * - user_id é obtido do servidor via session (não do cliente!)
 * - Validação Zod antes de qualquer operação no DB
 * - Erros são tratados e retornados de forma segura
 * 
 * PADRÃO DE RETORNO:
 * { success: true, data: T } | { success: false, error: string, errors?: ZodErrors }
 */

/**
 * Cria um novo funcionário
 * 
 * SEGURANÇA: user_id vem do servidor, não do cliente!
 */
export async function createFuncionarioAction(
    input: CreateFuncionarioInput
): Promise<ActionResult<{ id: string }>> {
    try {
        // 1. Autenticação
        const user = await getAuthenticatedUser();

        // 2. Validação
        const parsed = createFuncionarioSchema.safeParse(input);
        if (!parsed.success) {
            return {
                success: false,
                error: 'Dados inválidos',
                errors: parsed.error.format()
            };
        }

        // 3. Inserção no DB
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('funcionarios')
            .insert({
                user_id: user.id, // ✅ user_id do servidor!
                nome: parsed.data.nome,
                cargo: parsed.data.cargo,
                telefone: parsed.data.telefone,
                salario_base: parsed.data.salarioBase,
                data_admissao: formatDateForDB(parsed.data.dataAdmissao),
                data_demissao: formatDateForDB(parsed.data.dataDemissao),
                ativo: parsed.data.ativo ?? !parsed.data.dataDemissao,
            })
            .select('id')
            .single();

        if (error) {
            console.error('[createFuncionarioAction] DB Error:', error);
            return { success: false, error: 'Erro ao criar funcionário' };
        }

        // 4. Revalidar cache
        revalidatePath('/cadastros');

        return { success: true, data: { id: data.id } };

    } catch (err) {
        console.error('[createFuncionarioAction] Error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

/**
 * Atualiza um funcionário
 */
export async function updateFuncionarioAction(
    id: string,
    input: UpdateFuncionarioInput
): Promise<ActionResult<{ id: string }>> {
    try {
        // 1. Autenticação
        const user = await getAuthenticatedUser();

        // 2. Validação do ID
        const idError = validateId(id);
        if (idError) return idError;

        // 3. Validação dos dados
        const parsed = updateFuncionarioSchema.safeParse(input);
        if (!parsed.success) {
            return {
                success: false,
                error: 'Dados inválidos',
                errors: parsed.error.format()
            };
        }

        // 4. Construir objeto de update
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        };

        if (parsed.data.nome !== undefined) updateData.nome = parsed.data.nome;
        if (parsed.data.cargo !== undefined) updateData.cargo = parsed.data.cargo;
        if (parsed.data.telefone !== undefined) updateData.telefone = parsed.data.telefone;
        if (parsed.data.salarioBase !== undefined) updateData.salario_base = parsed.data.salarioBase;
        if (parsed.data.dataAdmissao !== undefined) updateData.data_admissao = formatDateForDB(parsed.data.dataAdmissao);
        if (parsed.data.dataDemissao !== undefined) {
            updateData.data_demissao = formatDateForDB(parsed.data.dataDemissao);
            updateData.ativo = !parsed.data.dataDemissao;
        }
        if (parsed.data.ativo !== undefined) updateData.ativo = parsed.data.ativo;

        // 5. Update no DB
        const supabase = await createClient();
        const { error } = await supabase
            .from('funcionarios')
            .update(updateData)
            .eq('id', id).eq('user_id', user.id);

        if (error) {
            console.error('[updateFuncionarioAction] DB Error:', error);
            return { success: false, error: 'Erro ao atualizar funcionário' };
        }

        // 6. Revalidar cache
        revalidatePath('/cadastros');

        return { success: true, data: { id } };

    } catch (err) {
        console.error('[updateFuncionarioAction] Error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

/**
 * Deleta um funcionário
 */
export async function deleteFuncionarioAction(
    id: string
): Promise<ActionResult<null>> {
    try {
        // 1. Autenticação
        const user = await getAuthenticatedUser();

        // 2. Validação do ID
        const idError = validateId(id);
        if (idError) return idError;

        // 3. Delete no DB
        const supabase = await createClient();
        const { error } = await supabase
            .from('funcionarios')
            .delete()
            .eq('id', id).eq('user_id', user.id);

        if (error) {
            console.error('[deleteFuncionarioAction] DB Error:', error);
            return { success: false, error: 'Erro ao deletar funcionário' };
        }

        // 4. Revalidar cache
        revalidatePath('/cadastros');

        return { success: true, data: null };

    } catch (err) {
        console.error('[deleteFuncionarioAction] Error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}
