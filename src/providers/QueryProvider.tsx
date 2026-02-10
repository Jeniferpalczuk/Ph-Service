'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';

/**
 * QueryProvider
 * 
 * Configura o React Query para toda a aplicação.
 * 
 * Decisões de Arquitetura:
 * - `staleTime: 1000 * 60 * 5` (5 minutos): Dados são considerados "frescos" por 5 minutos.
 *   Isso evita refetches desnecessários quando o usuário navega entre páginas.
 * - `retry: 1`: Se uma query falhar, tenta apenas 1 vez antes de mostrar erro.
 * - O QueryClient é criado dentro de useState para garantir uma única instância por cliente.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 1000 * 60 * 5, // 5 minutos
                        retry: 1,
                        refetchOnWindowFocus: false, // Desativa refetch ao focar na janela (pode ser ativado se necessário)
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
