import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Funcionario } from '@/types';
import { PaginatedResult } from '@/services/types';
import {
    getFuncionarios,
    getFuncionarioById,
    FuncionariosQueryParams,
} from '@/services/cadastros/funcionarios';
import {
    createFuncionarioAction,
    updateFuncionarioAction,
    deleteFuncionarioAction,
} from '@/app/actions/funcionarios';
import { CreateFuncionarioInput, UpdateFuncionarioInput } from '@/lib/validations/funcionarios';

/**
 * Hook: useFuncionarios
 * 
 * ATUALIZADO PARA FASE 3:
 * - Queries usam services (leitura)
 * - Mutations usam Server Actions (escrita segura)
 * - Não precisa mais de useAuth() para mutations!
 */

export const funcionariosKeys = {
    all: ['funcionarios'] as const,
    lists: () => [...funcionariosKeys.all, 'list'] as const,
    list: (params: FuncionariosQueryParams) => [...funcionariosKeys.lists(), params] as const,
    details: () => [...funcionariosKeys.all, 'detail'] as const,
    detail: (id: string) => [...funcionariosKeys.details(), id] as const,
};

export function useFuncionariosList(params: FuncionariosQueryParams = {}) {
    return useQuery<PaginatedResult<Funcionario>>({
        queryKey: funcionariosKeys.list(params),
        queryFn: () => getFuncionarios(params),
    });
}

export function useFuncionarioById(id: string | null) {
    return useQuery<Funcionario | null>({
        queryKey: funcionariosKeys.detail(id ?? ''),
        queryFn: () => (id ? getFuncionarioById(id) : Promise.resolve(null)),
        enabled: !!id,
    });
}

/**
 * Hook para criar funcionário
 * 
 * SEGURO: Usa Server Action (user_id do servidor)
 */
export function useCreateFuncionario() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateFuncionarioInput) => {
            const result = await createFuncionarioAction(input);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: funcionariosKeys.lists() });
        },
        onError: (error: Error) => {
            console.error('[useCreateFuncionario] Error:', error.message);
        },
    });
}

/**
 * Hook para atualizar funcionário
 */
export function useUpdateFuncionario() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: UpdateFuncionarioInput }) => {
            const result = await updateFuncionarioAction(id, updates);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        // OPTIMISTIC UPDATE:
        onMutate: async ({ id, updates }) => {
            // Cancela refetchs em andamento para não sobrescrever o otimismo
            await queryClient.cancelQueries({ queryKey: funcionariosKeys.lists() });

            // Snapshot do estado anterior
            const previousData = queryClient.getQueryData(funcionariosKeys.all);

            // Atualiza o cache de forma otimista (se tivermos a lista em cache)
            // Nota: Como a lista é paginada e complexa, invalidar é mais seguro,
            // mas aqui demonstramos o padrão para itens individuais.
            queryClient.setQueryData(funcionariosKeys.detail(id), (old: any) => ({
                ...old,
                ...updates,
            }));

            return { previousData };
        },
        onError: (err, variables, context) => {
            // Reverte se der erro
            if (context?.previousData) {
                queryClient.setQueryData(funcionariosKeys.all, context.previousData);
            }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: funcionariosKeys.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: funcionariosKeys.lists() });
        },
    });

}

/**
 * Hook para deletar funcionário
 */
export function useDeleteFuncionario() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteFuncionarioAction(id);
            if (!result.success) {
                throw new Error(result.error);
            }
            return id;
        },
        onSuccess: (id) => {
            queryClient.removeQueries({ queryKey: funcionariosKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: funcionariosKeys.lists() });
        },
    });
}
