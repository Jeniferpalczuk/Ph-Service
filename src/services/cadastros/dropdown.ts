import { createClient } from '@/lib/supabase/client';

/**
 * Queries leves para dropdowns e selects.
 * Retornam apenas id e nome, sem paginação pesada.
 * Cache via React Query garante que não há requests duplicados.
 */

export interface DropdownOption {
    id: string;
    nome: string;
}

type DropdownRow = {
    id: string;
    nome: string;
};

type FuncionarioFolhaRow = DropdownRow & {
    cargo?: string | null;
    salario_base?: number | string | null;
    ativo?: boolean | null;
};

/**
 * Busca todos os funcionários ATIVOS para selects.
 * Retorna apenas id + nome (query leve).
 */
export async function getFuncionariosDropdown(): Promise<DropdownOption[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('funcionarios')
        .select('id, nome')
        .eq('ativo', true)
        .is('data_demissao', null)
        .order('nome', { ascending: true });

    if (error) throw new Error(`Erro ao buscar funcionários: ${error.message}`);
    return ((data || []) as DropdownRow[]).map((row) => ({ id: row.id, nome: row.nome }));
}

/**
 * Busca funcionários ATIVOS com cargo e salário para folha de pagamento.
 */
export interface FuncionarioFolhaOption {
    id: string;
    nome: string;
    cargo: string;
    salarioBase: number;
    ativo: boolean;
}

export async function getFuncionariosFolhaDropdown(): Promise<FuncionarioFolhaOption[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('funcionarios')
        .select('id, nome, cargo, salario_base, ativo')
        .eq('ativo', true)
        .is('data_demissao', null)
        .order('nome', { ascending: true });

    if (error) throw new Error(`Erro ao buscar funcionários: ${error.message}`);
    return ((data || []) as FuncionarioFolhaRow[]).map((row) => ({
        id: row.id,
        nome: row.nome,
        cargo: row.cargo || '',
        salarioBase: Number(row.salario_base || 0),
        ativo: row.ativo ?? true,
    }));
}

/**
 * Busca todos os fornecedores ATIVOS para selects.
 * Retorna apenas id + nome (query leve).
 */
export async function getFornecedoresDropdown(): Promise<DropdownOption[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('fornecedores')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome', { ascending: true });

    if (error) throw new Error(`Erro ao buscar fornecedores: ${error.message}`);
    return ((data || []) as DropdownRow[]).map((row) => ({ id: row.id, nome: row.nome }));
}

/**
 * Busca todos os clientes ATIVOS para selects.
 * Retorna apenas id + nome (query leve).
 */
export async function getClientesDropdown(): Promise<DropdownOption[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome', { ascending: true });

    if (error) throw new Error(`Erro ao buscar clientes: ${error.message}`);
    return ((data || []) as DropdownRow[]).map((row) => ({ id: row.id, nome: row.nome }));
}
