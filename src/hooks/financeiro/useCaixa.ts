import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FechamentoCaixa } from '@/types';
import { PaginatedResult } from '@/services/types';
import {
    getFechamentosCaixa,
    getFechamentoById,
    getCaixaSummary,
    CaixaQueryParams,
} from '@/services/financeiro/caixa';
import {
    createCaixaAction,
    deleteCaixaAction,
} from '@/app/actions/financeiro';
import { CreateCaixaInput } from '@/lib/validations/caixa';

export const caixaKeys = {
    all: ['caixa'] as const,
    lists: () => [...caixaKeys.all, 'list'] as const,
    list: (params: CaixaQueryParams) => [...caixaKeys.lists(), params] as const,
    details: () => [...caixaKeys.all, 'detail'] as const,
    detail: (id: string) => [...caixaKeys.details(), id] as const,
    summary: (startDate: string, endDate: string) => [...caixaKeys.all, 'summary', startDate, endDate] as const,
};

export function useCaixaList(params: CaixaQueryParams = {}) {
    return useQuery<PaginatedResult<FechamentoCaixa>>({
        queryKey: caixaKeys.list(params),
        queryFn: () => getFechamentosCaixa(params),
    });
}

export function useCaixaById(id: string | null) {
    return useQuery<FechamentoCaixa | null>({
        queryKey: caixaKeys.detail(id ?? ''),
        queryFn: () => (id ? getFechamentoById(id) : Promise.resolve(null)),
        enabled: !!id,
    });
}

export function useCaixaSummary(startDate: string, endDate: string) {
    return useQuery({
        queryKey: caixaKeys.summary(startDate, endDate),
        queryFn: () => getCaixaSummary(startDate, endDate),
        enabled: !!startDate && !!endDate,
    });
}

export function useCreateCaixa() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateCaixaInput) => {
            const result = await createCaixaAction(input);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: caixaKeys.lists() });
            queryClient.invalidateQueries({ queryKey: caixaKeys.all });
        },
    });
}

export function useDeleteCaixa() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteCaixaAction(id);
            if (!result.success) throw new Error(result.error);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: caixaKeys.lists() });
            queryClient.invalidateQueries({ queryKey: caixaKeys.all });
        },
    });
}
