import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { QueryClient } from '@tanstack/react-query';

function loadTs(path, modules) {
    const compiled = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const exports = {};
    runInNewContext(compiled, { exports, Date, Error, Intl, require(name) {
        assert.ok(Object.hasOwn(modules, name), `Unexpected dependency: ${name}`);
        return modules[name];
    } });
    return exports;
}

test('creating, renaming, deactivating and deleting a client refreshes the cached convenio selector immediately', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const key = ['dropdown', 'clientes'];
    let rows = [{ id: 'old', nome: 'Cliente antigo', ativo: true }];
    const options = { queryKey: key, staleTime: 30 * 60 * 1000, queryFn: async () => rows.filter(row => row.ativo).map(({ id, nome }) => ({ id, nome })) };
    const hooks = loadTs('../src/hooks/cadastros/useClientes.ts', {
        '@tanstack/react-query': { useQueryClient: () => client, useMutation: value => value },
        '@/services/cadastros/clientes': {},
        '@/app/actions/cadastros': {
            createClienteAction: async input => { rows.push({ id: 'new', ...input }); return { success: true, data: { id: 'new' } }; },
            updateClienteAction: async (id, updates) => { rows = rows.map(row => row.id === id ? { ...row, ...updates } : row); return { success: true, data: { id } }; },
            deleteClienteAction: async id => { rows = rows.filter(row => row.id !== id); return { success: true }; },
        },
        './useDropdown': { dropdownKeys: { clientes: key } },
    });
    try {
        assert.equal((await client.fetchQuery(options)).length, 1);
        const create = hooks.useCreateCliente();
        await create.onSuccess(await create.mutationFn({ nome: 'Novo cliente', ativo: true }));
        assert.deepEqual((await client.fetchQuery(options)).map(row => row.nome), ['Cliente antigo', 'Novo cliente']);
        const update = hooks.useUpdateCliente();
        await update.onSuccess(await update.mutationFn({ id: 'new', updates: { nome: 'Nome atualizado' } }));
        assert.equal((await client.fetchQuery(options))[1].nome, 'Nome atualizado');
        await update.onSuccess(await update.mutationFn({ id: 'new', updates: { ativo: false } }));
        assert.deepEqual((await client.fetchQuery(options)).map(row => row.nome), ['Cliente antigo']);
        const remove = hooks.useDeleteCliente();
        await remove.onSuccess(await remove.mutationFn('old'));
        assert.deepEqual(await client.fetchQuery(options), []);
    } finally { client.clear(); }
});

function employeeService(rows) {
    const client = { from() {
        let selected = [...rows];
        const query = {
            select() { return query; }, order() { return query; },
            eq(key, value) { selected = selected.filter(row => row[key] === value); return query; },
            is(key, value) { selected = selected.filter(row => row[key] == value); return query; },
            or(expression) {
                if (expression.includes('data_demissao.not.is.null')) selected = selected.filter(row => !row.ativo || row.data_demissao);
                else {
                    const search = expression.match(/%([^%]+)%/)[1];
                    selected = selected.filter(row => row.nome.includes(search) || row.cargo.includes(search));
                }
                return query;
            },
            range(from, to) { return Promise.resolve({ data: selected.slice(from, to + 1), count: selected.length, error: null }); },
        };
        return query;
    } };
    return loadTs('../src/services/cadastros/funcionarios.ts', {
        '@/lib/supabase/client': { createClient: () => client },
        '../types': { parseDBDate: value => value ? new Date(`${value}T12:00:00`) : undefined },
        '@/lib/security': { sanitizeSearch: value => value },
    });
}

test('employee status, role and search filters are applied before pagination', async () => {
    const service = employeeService([
        { id: '1', nome: 'Ana', cargo: 'Limpeza', ativo: true, data_demissao: null },
        { id: '2', nome: 'Bia', cargo: 'Limpeza', ativo: false, data_demissao: null },
        { id: '3', nome: 'Carla', cargo: 'Cozinha', ativo: true, data_demissao: null },
        { id: '4', nome: 'Dora', cargo: 'Limpeza', ativo: true, data_demissao: '2026-01-01' },
        { id: '5', nome: 'Elisa', cargo: 'Limpeza', ativo: true, data_demissao: null },
    ]);
    const result = await service.getFuncionarios({ situacao: 'ativos', cargo: 'Limpeza', page: 2, pageSize: 1 });
    assert.equal(result.count, 2);
    assert.equal(result.totalPages, 2);
    assert.equal(result.data[0].nome, 'Elisa');
    const archived = await service.getFuncionarios({ situacao: 'desligados', search: 'Limpeza' });
    assert.deepEqual(Array.from(archived.data, row => row.nome), ['Bia', 'Dora']);
});

test('employee counts and role options include records beyond the first database batch', async () => {
    const rows = Array.from({ length: 1002 }, (_, i) => ({ id: String(i), cargo: 'Atendente', ativo: true, data_demissao: null }));
    rows.push({ id: 'last', cargo: 'Limpeza', ativo: false, data_demissao: null });
    const result = await employeeService(rows).getFuncionariosOverview();
    assert.equal(result.total, 1003);
    assert.equal(result.ativos, 1002);
    assert.equal(result.desligados, 1);
    assert.deepEqual(Array.from(result.cargos), ['Atendente', 'Limpeza']);
});
