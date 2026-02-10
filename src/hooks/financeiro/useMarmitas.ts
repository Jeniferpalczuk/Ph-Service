import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Marmita } from '@/types';
import { PaginatedResult } from '@/services/types';
import {
    getMarmitas,
    MarmitasQueryParams,
} from '@/services/financeiro/marmitas';
import {
    createMarmitaAction,
    createMarmitasLoteAction,
    updateMarmitaAction,
    deleteMarmitaAction,
} from '@/app/actions/marmitas';
import { CreateMarmitaInput, UpdateMarmitaInput, CreateMarmitasLoteInput } from '@/lib/validations/marmitas';

export const marmitasKeys = {
    all: ['marmitas'] as const,
    lists: () => [...marmitasKeys.all, 'list'] as const,
    list: (params: MarmitasQueryParams) => [...marmitasKeys.lists(), params] as const,
};

export function useMarmitasList(params: MarmitasQueryParams = {}) {
    return useQuery<PaginatedResult<Marmita>>({
        queryKey: marmitasKeys.list(params),
        queryFn: () => getMarmitas(params),
    });
}

export function useCreateMarmita() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateMarmitaInput) => {
            const result = await createMarmitaAction(input);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: marmitasKeys.lists() });
        },
    });
}

export function useCreateMarmitasLote() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateMarmitasLoteInput) => {
            const result = await createMarmitasLoteAction(input);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: marmitasKeys.lists() });
        },
    });
}

export function useUpdateMarmita() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: UpdateMarmitaInput }) => {
            const result = await updateMarmitaAction(id, updates);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: marmitasKeys.all });
        },
    });
}

export function useDeleteMarmita() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteMarmitaAction(id);
            if (!result.success) throw new Error(result.error);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: marmitasKeys.lists() });
        },
    });
}
