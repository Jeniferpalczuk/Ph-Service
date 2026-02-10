import { createClient } from '@/lib/supabase/client';
import { Funcionario } from '@/types';
import { PaginatedResult, BaseQueryParams, formatDateForDB, parseDBDate } from '../types';

/**
 * Service Layer - Funcionários
 * 
 * Esta camada abstrai toda a comunicação com o Supabase.
 * Nenhum componente ou hook deve acessar o Supabase diretamente.
 * 
 * Benefícios:
 * - Testabilidade: Fácil de mockar para testes unitários.
 * - Manutenção: Mudanças na API do Supabase ficam isoladas aqui.
 * - Tipagem forte: Conversão de snake_case para camelCase centralizada.
 */

// ===========================================
// HELPER: Conversão DB -> TypeScript
// ===========================================
function dbToFuncionario(row: Record<string, unknown>): Funcionario {
    return {
        id: row.id as string,
        nome: row.nome as string,
        cargo: row.cargo as string,
        telefone: row.telefone as string | undefined,
        dataAdmissao: parseDBDate(row.data_admissao as string),
        salarioBase: row.salario_base ? parseFloat(row.salario_base as string) : undefined,
        ativo: row.ativo as boolean,
        dataDemissao: parseDBDate(row.data_demissao as string),
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
    };
}

// ===========================================
// QUERY TYPES
// ===========================================
export interface FuncionariosQueryParams extends BaseQueryParams {
    ativo?: boolean | 'all';
}

// ===========================================
// SERVICE FUNCTIONS
// ===========================================

/**
 * Busca funcionários com paginação server-side.
 * 
 * @param params - Parâmetros de consulta
 * @returns Resultado paginado com dados e metadados
 * 
 * Implementação:
 * - Usa `.range()` do Supabase para paginação real no DB.
 * - Filtra por `ativo` e `search` no lado do servidor.
 * - Ordena ativos primeiro, depois por nome.
 */
export async function getFuncionarios(
    params: FuncionariosQueryParams = {}
): Promise<PaginatedResult<Funcionario>> {
    const supabase = createClient();
    const {
        page = 1,
        pageSize = 20,
        search = '',
        ativo = 'all',
    } = params;

    // Base query
    let query = supabase
        .from('funcionarios')
        .select('*', { count: 'exact' }); // count: 'exact' retorna o total de registros

    // Filtros
    if (ativo !== 'all') {
        query = query.eq('ativo', ativo);
    }

    if (search) {
        query = query.or(`nome.ilike.%${search}%,cargo.ilike.%${search}%`);
    }

    // Ordenação: Ativos primeiro, depois por nome
    query = query
        .order('ativo', { ascending: false })
        .order('nome', { ascending: true });

    // Paginação Server-Side
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
        console.error('[funcionarios.service] Error fetching:', error);
        throw new Error(`Erro ao buscar funcionários: ${error.message}`);
    }

    const totalCount = count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
        data: (data || []).map(dbToFuncionario),
        count: totalCount,
        page,
        pageSize,
        totalPages,
    };
}

/**
 * Busca um funcionário pelo ID.
 */
export async function getFuncionarioById(id: string): Promise<Funcionario | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new Error(`Erro ao buscar funcionário: ${error.message}`);
    }

    return data ? dbToFuncionario(data) : null;
}

/**
 * Cria um novo funcionário.
 * 
 * @param funcionario - Dados do funcionário (sem id, createdAt, updatedAt)
 * @param userId - ID do usuário autenticado (para RLS)
 */
export async function createFuncionario(
    funcionario: Omit<Funcionario, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
): Promise<Funcionario> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('funcionarios')
        .insert({
            user_id: userId,
            nome: funcionario.nome,
            cargo: funcionario.cargo,
            telefone: funcionario.telefone,
            data_admissao: formatDateForDB(funcionario.dataAdmissao),
            salario_base: funcionario.salarioBase,
            ativo: funcionario.ativo ?? true,
            data_demissao: formatDateForDB(funcionario.dataDemissao),
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Erro ao criar funcionário: ${error.message}`);
    }

    return dbToFuncionario(data);
}

/**
 * Atualiza um funcionário existente.
 */
export async function updateFuncionario(
    id: string,
    updates: Partial<Funcionario>
): Promise<Funcionario> {
    const supabase = createClient();

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.nome !== undefined) updateData.nome = updates.nome;
    if (updates.cargo !== undefined) updateData.cargo = updates.cargo;
    if (updates.telefone !== undefined) updateData.telefone = updates.telefone;
    if (updates.dataAdmissao !== undefined) updateData.data_admissao = formatDateForDB(updates.dataAdmissao);
    if (updates.salarioBase !== undefined) updateData.salario_base = updates.salarioBase;
    if (updates.ativo !== undefined) updateData.ativo = updates.ativo;
    if (updates.dataDemissao !== undefined) updateData.data_demissao = formatDateForDB(updates.dataDemissao);

    const { data, error } = await supabase
        .from('funcionarios')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new Error(`Erro ao atualizar funcionário: ${error.message}`);
    }

    return dbToFuncionario(data);
}

/**
 * Deleta um funcionário.
 */
export async function deleteFuncionario(id: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .from('funcionarios')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(`Erro ao deletar funcionário: ${error.message}`);
    }
}
