import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Cliente } from '@/types';
import { PaginatedResult } from '@/services/types';
import {
    getClientes,
    getClienteById,
    ClientesQueryParams,
} from '@/services/cadastros/clientes';
import {
    createClienteAction,
    updateClienteAction,
    deleteClienteAction,
} from '@/app/actions/cadastros';
import { CreateClienteInput, UpdateClienteInput } from '@/lib/validations/clientes';



export const clientesKeys = {
    all: ['clientes'] as const,
    lists: () => [...clientesKeys.all, 'list'] as const,
    list: (params: ClientesQueryParams) => [...clientesKeys.lists(), params] as const,
    details: () => [...clientesKeys.all, 'detail'] as const,
    detail: (id: string) => [...clientesKeys.details(), id] as const,
};

export function useClientesList(params: ClientesQueryParams = {}) {
    return useQuery<PaginatedResult<Cliente>>({
        queryKey: clientesKeys.list(params),
        queryFn: () => getClientes(params),
    });
}

export function useClienteById(id: string | null) {
    return useQuery<Cliente | null>({
        queryKey: clientesKeys.detail(id ?? ''),
        queryFn: () => (id ? getClienteById(id) : Promise.resolve(null)),
        enabled: !!id,
    });
}

export function useCreateCliente() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateClienteInput) => {
            const result = await createClienteAction(input);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientesKeys.lists() });
        },
    });
}

export function useUpdateCliente() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: UpdateClienteInput }) => {
            const result = await updateClienteAction(id, updates);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: clientesKeys.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: clientesKeys.lists() });
        },
    });
}

export function useDeleteCliente() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteClienteAction(id);
            if (!result.success) throw new Error(result.error);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientesKeys.lists() });
        },
    });
}
