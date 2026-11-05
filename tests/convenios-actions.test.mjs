import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as convenios from '../src/lib/validations/convenios.ts';
import * as saidas from '../src/lib/validations/saidas.ts';
import * as caixa from '../src/lib/validations/caixa.ts';
import * as security from '../src/lib/security.ts';

// Execute the real actions and shared helpers, replacing only Next's request
// context and the database transport. No production credentials or rows are used.
function loadTs(path, modules) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const exports = {};
    runInNewContext(compiled, {
        exports, Date, Error, crypto, console: { error() {} },
        require(name) {
            assert.ok(Object.hasOwn(modules, name), `Unexpected dependency: ${name}`);
            return modules[name];
        },
    });
    return exports;
}

function harness({ authenticated = true, error = null, count = 1 } = {}) {
    const writes = [];
    const filters = [];
    const client = {
        auth: { getUser: async () => ({ data: { user: authenticated ? { id: 'test-owner' } : null }, error: null }) },
        from(table) {
            const query = {
                insert(data) { writes.push({ table, data }); return query; },
                update(data) { writes.push({ table, data }); return query; },
                delete() { writes.push({ table, deleted: true }); return query; },
                eq(field, value) { filters.push([field, value]); return query; },
                then(resolve) { return Promise.resolve({ error, count }).then(resolve); },
            };
            return query;
        },
    };
    const modules = {
        '@/lib/supabase/server': { createClient: async () => client },
        '@/lib/security': security,
        'next/cache': { revalidatePath() {} },
        '@/lib/validations/convenios': convenios,
        '@/lib/validations/saidas': saidas,
        '@/lib/validations/caixa': caixa,
    };
    modules['./shared'] = loadTs('../src/app/actions/shared.ts', modules);
    return { actions: loadTs('../src/app/actions/financeiro.ts', modules), writes, filters };
}

const input = {
    empresa: 'Empresa de teste', tipoFechamento: 'mensal', periodoReferencia: 'SET/26',
    banco: 'BB', valor: 1239, dataFechamento: new Date('2026-10-01T12:00:00Z'),
    dataVencimento: new Date('2026-09-17T12:00:00Z'), statusPagamento: 'pendente', dataPagamento: null,
};
const id = '12345678-1234-1234-1234-123456789012';

test('saves a convenio with the correct amount, owner, reference and dates', async () => {
    const { actions, writes } = harness();
    const result = await actions.createConvenioAction(input);
    assert.equal(result.success, true);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].table, 'convenios');
    const row = writes[0].data;
    assert.equal(row.valor_boleto, 1239);
    assert.equal(row.user_id, 'test-owner');
    assert.equal(row.data_fechamento, '2026-10-01');
    assert.equal(row.data_vencimento, '2026-09-17');
    assert.equal(row.periodo_referencia, 'SET/26');
    assert.equal(row.status_pagamento, 'pendente');
    assert.equal(row.data_pagamento, null);
});

test('editing an amount does not reset closing type, payment status or payment date', async () => {
    const { actions, writes, filters } = harness();
    assert.equal((await actions.updateConvenioAction(id, { valor: 200 })).success, true);
    assert.deepEqual(Object.keys(writes[0].data).sort(), ['updated_at', 'valor_boleto']);
    assert.deepEqual(filters, [['id', id], ['user_id', 'test-owner']]);
});

test('rejects invalid data and unauthenticated saves before writing', async () => {
    const invalid = harness();
    assert.equal((await invalid.actions.createConvenioAction({ ...input, valor: 0 })).success, false);
    assert.equal(invalid.writes.length, 0);
    const anonymous = harness({ authenticated: false });
    const result = await anonymous.actions.createConvenioAction(input);
    assert.equal(result.success, false);
    assert.match(result.error, /Não autorizado/);
    assert.equal(anonymous.writes.length, 0);
});

test('database rejection and missing records never report a successful save', async () => {
    const rejected = harness({ error: { code: '42501', message: 'permission denied' } });
    const result = await rejected.actions.createConvenioAction(input);
    assert.equal(result.success, false);
    assert.match(result.error, /Permissão negada/);
    const missing = harness({ count: 0 });
    assert.equal((await missing.actions.updateConvenioAction(id, { valor: 200 })).success, false);
});
