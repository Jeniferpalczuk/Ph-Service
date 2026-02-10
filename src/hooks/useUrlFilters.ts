import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

/**
 * useUrlFilters - Hook para sincronizar filtros com a URL
 */
export function useUrlFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const getParam = useCallback((name: string) => {
        return searchParams.get(name);
    }, [searchParams]);

    const setParam = useCallback((name: string, value: string | number) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(name, String(value));
        } else {
            params.delete(name);
        }
        router.push(`${pathname}?${params.toString()}`);
    }, [router, pathname, searchParams]);

    const setParams = useCallback((newParams: Record<string, string | number | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(newParams).forEach(([name, value]) => {
            if (value !== undefined && value !== '') {
                params.set(name, String(value));
            } else {
                params.delete(name);
            }
        });
        router.push(`${pathname}?${params.toString()}`);
    }, [router, pathname, searchParams]);

    return {
        getParam,
        setParam,
        setParams,
        searchParams
    };
}
