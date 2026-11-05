import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDashboard } from '../src/lib/dashboard.ts';

const date = (day, month = 10) => new Date(2026, month, day, 12);
const empty = () => ({ caixa: [], convenios: [], boletos: [], saidas: [], vales: [], marmitas: [], folha: [] });

test('an empty period has no fabricated values, activity or cash closing', () => {
    const result = buildDashboard(empty(), 2026, 10, date(5));
    assert.equal(result.faturamento, 0);
    assert.equal(result.despesas, 0);
    assert.equal(result.saldo, 0);
    assert.equal(result.aReceber, 0);
    assert.equal(result.marmitasVendidas, 0);
    assert.equal(result.todayCount, 0);
    assert.deepEqual(result.activities, []);
    assert.ok(result.chart.every((point) => point.receitas === 0 && point.despesas === 0));
});

test('uses real records and counts linked cash and payroll expenses only once', () => {
    const records = empty();
    const caixaId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const folhaId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    records.caixa.push({ id: caixaId, data: date(5), funcionario: 'Ana', entradas: { dinheiro: 100, pix: 0, credito: 0, debito: 0, alimentacao: 0 }, saidas: 20 });
    records.saidas.push(
        { id: 's1', data: date(5), descricao: 'Caixa', valor: 20, observacoes: `Lancada automaticamente pelo fechamento de caixa ${caixaId}` },
        { id: 's2', data: date(5), descricao: 'Folha', valor: 30, observacoes: `[FOLHA_PAGAMENTO:${folhaId}]` },
        { id: 's3', data: date(5), descricao: 'Compra', valor: 10 },
    );
    records.folha.push({ id: folhaId, dataPagamento: date(5), statusPagamento: 'pago', valor: 30 });
    records.boletos.push(
        { id: 'b1', cliente: 'Fornecedor', dataVencimento: date(5), statusPagamento: 'pago', valor: 40 },
        { id: 'b2', cliente: 'Outro fornecedor', dataVencimento: date(6), statusPagamento: 'pendente', valor: 500 },
    );
    records.vales.push({ id: 'v1', funcionario: 'Ana', data: date(5), valor: 5, status: 'aberto' });
    records.convenios.push(
        { id: 'c1', empresaCliente: 'Cliente A', dataVencimento: date(5), statusPagamento: 'pago', valorBoleto: 70 },
        { id: 'c2', empresaCliente: 'Cliente B', dataVencimento: date(6), statusPagamento: 'pendente', valorBoleto: 50 },
        { id: 'c3', empresaCliente: 'Cliente C', dataVencimento: date(6), statusPagamento: 'parcial', valorBoleto: 10 },
    );
    records.marmitas.push({ id: 'm1', quantidade: 3, statusRecebimento: 'pendente' });

    const result = buildDashboard(records, 2026, 10, date(5));
    assert.equal(result.faturamento, 170);
    assert.equal(result.despesas, 105);
    assert.equal(result.saldo, 65);
    assert.equal(result.aReceber, 50); // unpaid customer agreements, not supplier bills or unknown partial balances
    assert.equal(result.boletosPendentes, 1);
    assert.equal(result.conveniosPendentes, 2);
    assert.equal(result.marmitasPendentes, 1);
    assert.equal(result.marmitasVendidas, 3);
    assert.equal(result.chart[4].receitas, 170);
    assert.equal(result.chart[4].despesas, 105);
    assert.equal(result.caixaHoje, 80);
    assert.equal(result.todayCount, 1);
});

test('groups the annual chart by month and excludes today outside the selected period', () => {
    const records = empty();
    records.caixa.push({ id: 'caixa', data: date(2, 1), funcionario: 'Ana', entradas: { pix: 25 }, saidas: 4 });
    const annual = buildDashboard(records, 2026, 'all', date(5));
    assert.equal(annual.chart.length, 12);
    assert.equal(annual.chart[1].receitas, 25);
    assert.equal(annual.chart[1].despesas, 4);
    assert.equal(annual.todayCount, 0);
    assert.equal(buildDashboard(records, 2026, 1, date(5)).todayIncluded, false);
});
