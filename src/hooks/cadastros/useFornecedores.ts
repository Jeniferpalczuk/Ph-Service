import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Fornecedor } from '@/types';
import { PaginatedResult } from '@/services/types';
import {
    getFornecedores,
    getFornecedorById,
    FornecedoresQueryParams,
} from '@/services/cadastros/fornecedores';
import {
    createFornecedorAction,
    updateFornecedorAction,
    deleteFornecedorAction,
} from '@/app/actions/cadastros';
import { CreateFornecedorInput, UpdateFornecedorInput } from '@/lib/validations/fornecedores';

export const fornecedoresKeys = {
    all: ['fornecedores'] as const,
    lists: () => [...fornecedoresKeys.all, 'list'] as const,
    list: (params: FornecedoresQueryParams) => [...fornecedoresKeys.lists(), params] as const,
    details: () => [...fornecedoresKeys.all, 'detail'] as const,
    detail: (id: string) => [...fornecedoresKeys.details(), id] as const,
};

export function useFornecedoresList(params: FornecedoresQueryParams = {}) {
    return useQuery<PaginatedResult<Fornecedor>>({
        queryKey: fornecedoresKeys.list(params),
        queryFn: () => getFornecedores(params),
    });
}

export function useFornecedorById(id: string | null) {
    return useQuery<Fornecedor | null>({
        queryKey: fornecedoresKeys.detail(id ?? ''),
        queryFn: () => (id ? getFornecedorById(id) : Promise.resolve(null)),
        enabled: !!id,
    });
}

export function useCreateFornecedor() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateFornecedorInput) => {
            const result = await createFornecedorAction(input);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: fornecedoresKeys.lists() });
        },
    });
}

export function useUpdateFornecedor() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: UpdateFornecedorInput }) => {
            const result = await updateFornecedorAction(id, updates);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: fornecedoresKeys.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: fornecedoresKeys.lists() });
        },
    });
}

export function useDeleteFornecedor() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteFornecedorAction(id);
            if (!result.success) throw new Error(result.error);
            return id;
        },
        onSuccess: (id) => {
            queryClient.removeQueries({ queryKey: fornecedoresKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: fornecedoresKeys.lists() });
        },
    });
}
