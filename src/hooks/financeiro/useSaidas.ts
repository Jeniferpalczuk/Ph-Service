import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Saida } from '@/types';
import { PaginatedResult } from '@/services/types';
import {
    getSaidas,
    getSaidaById,
    getSaidasTotal,
    SaidasQueryParams,
} from '@/services/financeiro/saidas';
import {
    createSaidaAction,
    updateSaidaAction,
    deleteSaidaAction,
} from '@/app/actions/financeiro';
import { CreateSaidaInput, UpdateSaidaInput } from '@/lib/validations/saidas';

/**
 * Hooks: Saidas
 * 
 * ATUALIZADO PARA FASE 4:
 * - Mutations usam Server Actions
 */

export const saidasKeys = {
    all: ['saidas'] as const,
    lists: () => [...saidasKeys.all, 'list'] as const,
    list: (params: SaidasQueryParams) => [...saidasKeys.lists(), params] as const,
    details: () => [...saidasKeys.all, 'detail'] as const,
    detail: (id: string) => [...saidasKeys.details(), id] as const,
    total: (startDate: string, endDate: string) => [...saidasKeys.all, 'total', startDate, endDate] as const,
};

export function useSaidasList(params: SaidasQueryParams = {}) {
    return useQuery<PaginatedResult<Saida>>({
        queryKey: saidasKeys.list(params),
        queryFn: () => getSaidas(params),
    });
}

export function useSaidaById(id: string | null) {
    return useQuery<Saida | null>({
        queryKey: saidasKeys.detail(id ?? ''),
        queryFn: () => (id ? getSaidaById(id) : Promise.resolve(null)),
        enabled: !!id,
    });
}

export function useSaidasTotal(startDate: string, endDate: string) {
    return useQuery({
        queryKey: saidasKeys.total(startDate, endDate),
        queryFn: () => getSaidasTotal(startDate, endDate),
        enabled: !!startDate && !!endDate,
    });
}

export function useCreateSaida() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateSaidaInput) => {
            const result = await createSaidaAction(input);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: saidasKeys.lists() });
            queryClient.invalidateQueries({ queryKey: saidasKeys.all });
        },
    });
}

export function useUpdateSaida() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: UpdateSaidaInput }) => {
            const result = await updateSaidaAction(id, updates);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: saidasKeys.lists() });
            queryClient.invalidateQueries({ queryKey: saidasKeys.detail(data.id) });
        },
    });
}

export function useDeleteSaida() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteSaidaAction(id);
            if (!result.success) throw new Error(result.error);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: saidasKeys.lists() });
            queryClient.invalidateQueries({ queryKey: saidasKeys.all });
        },
    });
}
