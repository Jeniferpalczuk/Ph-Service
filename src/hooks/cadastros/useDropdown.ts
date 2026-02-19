import { useQuery } from '@tanstack/react-query';
import {
    getFuncionariosDropdown,
    getFornecedoresDropdown,
    getClientesDropdown,
    getFuncionariosFolhaDropdown,
    DropdownOption,
    FuncionarioFolhaOption,
} from '@/services/cadastros/dropdown';

/**
 * Hooks leves para dropdowns.
 * 
 * staleTime alto (30min) pois nomes de funcionários/fornecedores/clientes
 * raramente mudam durante uma sessão. Isso evita re-fetches desnecessários
 * quando o usuário navega entre páginas que usam os mesmos selects.
 */

const DROPDOWN_STALE_TIME = 30 * 60 * 1000; // 30 minutos

// Query Keys
export const dropdownKeys = {
    funcionarios: ['dropdown', 'funcionarios'] as const,
    funcionariosFolha: ['dropdown', 'funcionarios-folha'] as const,
    fornecedores: ['dropdown', 'fornecedores'] as const,
    clientes: ['dropdown', 'clientes'] as const,
};

/**
 * Funcionários ativos para <select>
 */
export function useFuncionariosDropdown() {
    return useQuery<DropdownOption[]>({
        queryKey: dropdownKeys.funcionarios,
        queryFn: getFuncionariosDropdown,
        staleTime: DROPDOWN_STALE_TIME,
    });
}

/**
 * Funcionários ativos com cargo e salário para folha de pagamento
 */
export function useFuncionariosFolhaDropdown() {
    return useQuery<FuncionarioFolhaOption[]>({
        queryKey: dropdownKeys.funcionariosFolha,
        queryFn: getFuncionariosFolhaDropdown,
        staleTime: DROPDOWN_STALE_TIME,
    });
}

/**
 * Fornecedores ativos para <select>
 */
export function useFornecedoresDropdown() {
    return useQuery<DropdownOption[]>({
        queryKey: dropdownKeys.fornecedores,
        queryFn: getFornecedoresDropdown,
        staleTime: DROPDOWN_STALE_TIME,
    });
}

/**
 * Clientes ativos para <select>
 */
export function useClientesDropdown() {
    return useQuery<DropdownOption[]>({
        queryKey: dropdownKeys.clientes,
        queryFn: getClientesDropdown,
        staleTime: DROPDOWN_STALE_TIME,
    });
}
