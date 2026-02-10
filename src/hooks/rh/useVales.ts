import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Vale } from '@/types';
import { PaginatedResult } from '@/services/types';
import {
    getVales,
    getValeById,
    getValesPendentesByFuncionario,
    getTotalValesPendentes,
    ValesQueryParams,
} from '@/services/rh/vales';
import {
    createValeAction,
    updateValeAction,
    deleteValeAction,
    quitarValeAction,
    quitarValesFuncionarioAction,
} from '@/app/actions/vales';
import { CreateValeInput, UpdateValeInput } from '@/lib/validations/vales';

/**
 * Hooks: Vales
 * 
 * ATUALIZADO PARA FASE 3:
 * - Mutations usam Server Actions
 */

export const valesKeys = {
    all: ['vales'] as const,
    lists: () => [...valesKeys.all, 'list'] as const,
    list: (params: ValesQueryParams) => [...valesKeys.lists(), params] as const,
    details: () => [...valesKeys.all, 'detail'] as const,
    detail: (id: string) => [...valesKeys.details(), id] as const,
    pendentes: (funcionario: string) => [...valesKeys.all, 'pendentes', funcionario] as const,
    totalPendentes: (funcionario: string) => [...valesKeys.all, 'totalPendentes', funcionario] as const,
};

export function useValesList(params: ValesQueryParams = {}) {
    return useQuery<PaginatedResult<Vale>>({
        queryKey: valesKeys.list(params),
        queryFn: () => getVales(params),
    });
}

export function useValeById(id: string | null) {
    return useQuery<Vale | null>({
        queryKey: valesKeys.detail(id ?? ''),
        queryFn: () => (id ? getValeById(id) : Promise.resolve(null)),
        enabled: !!id,
    });
}

export function useValesPendentes(funcionarioNome: string | null) {
    return useQuery<Vale[]>({
        queryKey: valesKeys.pendentes(funcionarioNome ?? ''),
        queryFn: () => funcionarioNome ? getValesPendentesByFuncionario(funcionarioNome) : Promise.resolve([]),
        enabled: !!funcionarioNome,
    });
}

export function useTotalValesPendentes(funcionarioNome: string | null) {
    return useQuery<number>({
        queryKey: valesKeys.totalPendentes(funcionarioNome ?? ''),
        queryFn: () => funcionarioNome ? getTotalValesPendentes(funcionarioNome) : Promise.resolve(0),
        enabled: !!funcionarioNome,
    });
}

export function useCreateVale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateValeInput) => {
            const result = await createValeAction(input);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: valesKeys.lists() });
        },
    });
}

export function useUpdateVale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: UpdateValeInput }) => {
            const result = await updateValeAction(id, updates);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(valesKeys.detail(data.id), data);
            queryClient.invalidateQueries({ queryKey: valesKeys.lists() });
        },
    });
}

export function useDeleteVale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteValeAction(id);
            if (!result.success) {
                throw new Error(result.error);
            }
            return id;
        },
        onSuccess: (id) => {
            queryClient.removeQueries({ queryKey: valesKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: valesKeys.lists() });
        },
    });
}

/**
 * Hook para quitar um vale específico
 */
export function useQuitarVale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, observacao }: { id: string; observacao?: string }) => {
            const result = await quitarValeAction(id, observacao);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: valesKeys.lists() });
        },
    });
}

/**
 * Hook para quitar todos os vales pendentes de um funcionário
 */
export function useQuitarValesFuncionario() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ funcionarioNome, observacao }: { funcionarioNome: string; observacao?: string }) => {
            const result = await quitarValesFuncionarioAction(funcionarioNome, observacao);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: valesKeys.lists() });
        },
    });
}
