import assert from 'node:assert/strict';
import test from 'node:test';
import { createConvenioSchema, updateConvenioSchema } from '../src/lib/validations/convenios.ts';
import { updateValeSchema } from '../src/lib/validations/vales.ts';
import { updateMarmitaSchema } from '../src/lib/validations/marmitas.ts';
import { updateClienteSchema } from '../src/lib/validations/clientes.ts';
import { updateFornecedorSchema } from '../src/lib/validations/fornecedores.ts';
import { updateFuncionarioSchema } from '../src/lib/validations/funcionarios.ts';
import { updateFolhaPagamentoSchema } from '../src/lib/validations/folha-pagamento.ts';

const convenio = {
    empresa: 'Empresa de teste', tipoFechamento: 'mensal', periodoReferencia: 'SET/26',
    banco: 'BB', valor: 1239, dataFechamento: new Date('2026-10-01T12:00:00Z'),
    dataVencimento: new Date('2026-09-17T12:00:00Z'),
    dataPagamento: null, statusPagamento: 'pendente', observacoes: null,
};

test('accepts a September closing entered in October and preserves the amount', () => {
    const data = createConvenioSchema.parse(convenio);
    assert.equal(data.valor, 1239);
    assert.equal(data.periodoReferencia, 'SET/26');
    assert.equal(data.dataVencimento.toISOString().slice(0, 10), '2026-09-17');
});

test('rejects blank names, missing dates and invalid monetary values', () => {
    for (const patch of [
        { empresa: '  ' }, { banco: '  ' }, { periodoReferencia: ' ' },
        { dataFechamento: null }, { dataVencimento: undefined },
        { dataVencimento: new Date('invalid') },
        { valor: 0 }, { valor: -1 }, { valor: Infinity }, { valor: 1000001 },
    ]) assert.equal(createConvenioSchema.safeParse({ ...convenio, ...patch }).success, false);
});

test('partial updates do not insert defaults or overwrite unrelated fields', () => {
    assert.deepEqual(updateConvenioSchema.parse({ valor: 50 }), { valor: 50 });
    assert.deepEqual(updateConvenioSchema.parse({ statusPagamento: 'pago' }), { statusPagamento: 'pago' });
});

for (const [name, schema, patch] of [
    ['vales', updateValeSchema, { valor: 50 }],
    ['marmitas', updateMarmitaSchema, { valorTotal: 50 }],
    ['clientes', updateClienteSchema, { nome: 'Novo nome' }],
    ['fornecedores', updateFornecedorSchema, { nome: 'Novo nome' }],
    ['funcionarios', updateFuncionarioSchema, { nome: 'Novo nome' }],
    ['folha', updateFolhaPagamentoSchema, { valor: 50 }],
]) {
    test(`${name}: editing one field preserves omitted status, payment and active fields`, () => {
        assert.deepEqual(schema.parse(patch), patch);
        assert.deepEqual(schema.parse({}), {});
    });
}
