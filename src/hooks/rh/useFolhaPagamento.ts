import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PagamentoFuncionario } from '@/types';
import { PaginatedResult } from '@/services/types';
import {
    getFolhaPagamento,
    getPagamentoById,
    getFolhaStats,
    calcularValorLiquido,
    FolhaPagamentoQueryParams,
} from '@/services/rh/folha-pagamento';
import {
    createFolhaPagamentoAction,
    updateFolhaPagamentoAction,
    deleteFolhaPagamentoAction,
} from '@/app/actions/rh';
import { CreateFolhaPagamentoInput, UpdateFolhaPagamentoInput } from '@/lib/validations/folha-pagamento';

export const folhaKeys = {
    all: ['folhaPagamento'] as const,
    lists: () => [...folhaKeys.all, 'list'] as const,
    list: (params: FolhaPagamentoQueryParams) => [...folhaKeys.lists(), params] as const,
    details: () => [...folhaKeys.all, 'detail'] as const,
    detail: (id: string) => [...folhaKeys.details(), id] as const,
    stats: (startDate: string, endDate: string) => [...folhaKeys.all, 'stats', startDate, endDate] as const,
};

export function useFolhaPagamentoList(params: FolhaPagamentoQueryParams = {}) {
    return useQuery<PaginatedResult<PagamentoFuncionario>>({
        queryKey: folhaKeys.list(params),
        queryFn: () => getFolhaPagamento(params),
    });
}

export function usePagamentoById(id: string | null) {
    return useQuery<PagamentoFuncionario | null>({
        queryKey: folhaKeys.detail(id ?? ''),
        queryFn: () => (id ? getPagamentoById(id) : Promise.resolve(null)),
        enabled: !!id,
    });
}

export function useFolhaStats(startDate: string, endDate: string) {
    return useQuery({
        queryKey: folhaKeys.stats(startDate, endDate),
        queryFn: () => getFolhaStats(startDate, endDate),
        enabled: !!startDate && !!endDate,
    });
}

export function useCreatePagamento() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateFolhaPagamentoInput) => {
            const result = await createFolhaPagamentoAction(input);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: folhaKeys.lists() });
        },
    });
}

export function useUpdatePagamento() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: UpdateFolhaPagamentoInput }) => {
            const result = await updateFolhaPagamentoAction(id, updates);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: folhaKeys.lists() });
            queryClient.invalidateQueries({ queryKey: folhaKeys.detail(data.id) });
        },
    });
}

export function useDeletePagamento() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteFolhaPagamentoAction(id);
            if (!result.success) throw new Error(result.error);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: folhaKeys.lists() });
            queryClient.invalidateQueries({ queryKey: folhaKeys.all });
        },
    });
}

// Re-export utility function
export { calcularValorLiquido };
