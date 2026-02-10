import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Boleto } from '@/types';
import { PaginatedResult } from '@/services/types';
import {
    getBoletos,
    getBoletoById,
    getBoletosStats,
    BoletosQueryParams,
} from '@/services/financeiro/boletos';
import {
    createBoletoAction,
    updateBoletoAction,
    deleteBoletoAction,
    marcarBoletoPagoAction,
} from '@/app/actions/boletos';
import { CreateBoletoInput, UpdateBoletoInput } from '@/lib/validations/boletos';

/**
 * Hooks: Boletos
 * 
 * ATUALIZADO PARA FASE 3:
 * - Mutations usam Server Actions
 */

export const boletosKeys = {
    all: ['boletos'] as const,
    lists: () => [...boletosKeys.all, 'list'] as const,
    list: (params: BoletosQueryParams) => [...boletosKeys.lists(), params] as const,
    details: () => [...boletosKeys.all, 'detail'] as const,
    detail: (id: string) => [...boletosKeys.details(), id] as const,
    stats: () => [...boletosKeys.all, 'stats'] as const,
};

export function useBoletosList(params: BoletosQueryParams = {}) {
    return useQuery<PaginatedResult<Boleto>>({
        queryKey: boletosKeys.list(params),
        queryFn: () => getBoletos(params),
    });
}

export function useBoletoById(id: string | null) {
    return useQuery<Boleto | null>({
        queryKey: boletosKeys.detail(id ?? ''),
        queryFn: () => (id ? getBoletoById(id) : Promise.resolve(null)),
        enabled: !!id,
    });
}

export function useBoletosStats() {
    return useQuery({
        queryKey: boletosKeys.stats(),
        queryFn: getBoletosStats,
    });
}

export function useCreateBoleto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateBoletoInput) => {
            const result = await createBoletoAction(input);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: boletosKeys.lists() });
            queryClient.invalidateQueries({ queryKey: boletosKeys.stats() });
        },
    });
}

export function useUpdateBoleto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: UpdateBoletoInput }) => {
            const result = await updateBoletoAction(id, updates);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(boletosKeys.detail(data.id), data);
            queryClient.invalidateQueries({ queryKey: boletosKeys.lists() });
            queryClient.invalidateQueries({ queryKey: boletosKeys.stats() });
        },
    });
}

export function useDeleteBoleto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteBoletoAction(id);
            if (!result.success) {
                throw new Error(result.error);
            }
            return id;
        },
        onSuccess: (id) => {
            queryClient.removeQueries({ queryKey: boletosKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: boletosKeys.lists() });
            queryClient.invalidateQueries({ queryKey: boletosKeys.stats() });
        },
    });
}

/**
 * Hook para marcar boleto como pago
 */
export function useMarcarBoletoPago() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, dataPagamento }: { id: string; dataPagamento?: Date }) => {
            const result = await marcarBoletoPagoAction(id, dataPagamento);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: boletosKeys.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: boletosKeys.lists() });
            queryClient.invalidateQueries({ queryKey: boletosKeys.stats() });
        },
    });
}
