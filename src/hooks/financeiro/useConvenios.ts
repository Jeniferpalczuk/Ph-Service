import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Convenio } from '@/types';
import { PaginatedResult } from '@/services/types';
import {
    getConvenios,
    getConvenioById,
    ConveniosQueryParams,
} from '@/services/financeiro/convenios';
import {
    createConvenioAction,
    updateConvenioAction,
    deleteConvenioAction,
} from '@/app/actions/financeiro';
import { CreateConvenioInput, UpdateConvenioInput } from '@/lib/validations/convenios';

export const conveniosKeys = {
    all: ['convenios'] as const,
    lists: () => [...conveniosKeys.all, 'list'] as const,
    list: (params: ConveniosQueryParams) => [...conveniosKeys.lists(), params] as const,
    details: () => [...conveniosKeys.all, 'detail'] as const,
    detail: (id: string) => [...conveniosKeys.details(), id] as const,
};

export function useConveniosList(params: ConveniosQueryParams = {}) {
    return useQuery<PaginatedResult<Convenio>>({
        queryKey: conveniosKeys.list(params),
        queryFn: () => getConvenios(params),
    });
}

export function useConvenioById(id: string | null) {
    return useQuery<Convenio | null>({
        queryKey: conveniosKeys.detail(id ?? ''),
        queryFn: () => (id ? getConvenioById(id) : Promise.resolve(null)),
        enabled: !!id,
    });
}

export function useCreateConvenio() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateConvenioInput) => {
            const result = await createConvenioAction(input);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: conveniosKeys.lists() });
        },
    });
}

export function useUpdateConvenio() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: UpdateConvenioInput }) => {
            const result = await updateConvenioAction(id, updates);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(conveniosKeys.detail(data.id), data);
            queryClient.invalidateQueries({ queryKey: conveniosKeys.lists() });
        },
    });
}

export function useDeleteConvenio() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteConvenioAction(id);
            if (!result.success) throw new Error(result.error);
            return id;
        },
        onSuccess: (id) => {
            queryClient.removeQueries({ queryKey: conveniosKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: conveniosKeys.lists() });
        },
    });
}
