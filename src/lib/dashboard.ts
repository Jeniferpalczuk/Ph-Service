import type { Boleto, Convenio, FechamentoCaixa, Marmita, PagamentoFuncionario, Saida, Vale } from '@/types';

export type DashboardRecords = {
    boletos: Boleto[];
    convenios: Convenio[];
    caixa: FechamentoCaixa[];
    saidas: Saida[];
    vales: Vale[];
    marmitas: Marmita[];
    folha: PagamentoFuncionario[];
};

type Activity = {
    id: string;
    date: Date;
    description: string;
    category: string;
    value: number;
};

const amount = (value: unknown) => {
    const result = Number(value);
    return Number.isFinite(result) ? result : 0;
};

const caixaEntradas = (caixa: FechamentoCaixa) =>
    Object.values(caixa.entradas).reduce((total, value) => total + amount(value), 0);

/** Build the dashboard solely from records returned for the selected period. */
export function buildDashboard(records: DashboardRecords, year: number, month: number | 'all', today = new Date()) {
    const length = month === 'all' ? 12 : new Date(year, month + 1, 0).getDate();
    const chart = Array.from({ length }, (_, index) => ({
        label: month === 'all'
            ? new Date(year, index, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
            : String(index + 1).padStart(2, '0'),
        receitas: 0,
        despesas: 0,
    }));

    const add = (date: Date | undefined, kind: 'receitas' | 'despesas', value: number) => {
        if (!date) return;
        const actual = new Date(date);
        if (Number.isNaN(actual.getTime()) || actual.getFullYear() !== year) return;
        if (month !== 'all' && actual.getMonth() !== month) return;
        const index = month === 'all' ? actual.getMonth() : actual.getDate() - 1;
        if (chart[index]) chart[index][kind] += amount(value);
    };

    // Cash and payroll can also create a linked Saída. Count that expense once.
    const linkedCaixas = new Set<string>();
    const linkedFolhas = new Set<string>();
    records.saidas.forEach((saida) => {
        const notes = saida.observacoes || '';
        const caixaId = notes.match(/^Lancada automaticamente pelo fechamento de caixa\s+([\da-f-]+)/i)?.[1];
        const folhaId = notes.match(/\[FOLHA_PAGAMENTO:([^\]]+)\]/i)?.[1];
        if (caixaId) linkedCaixas.add(caixaId.toLowerCase());
        if (folhaId) linkedFolhas.add(folhaId.toLowerCase());
    });

    records.caixa.forEach((item) => {
        add(item.data, 'receitas', caixaEntradas(item));
        if (!linkedCaixas.has(item.id.toLowerCase())) add(item.data, 'despesas', item.saidas);
    });
    records.convenios.forEach((item) => {
        if (item.statusPagamento === 'pago') add(item.dataVencimento, 'receitas', item.valorBoleto);
    });
    records.saidas.forEach((item) => add(item.data, 'despesas', item.valor));
    records.vales.forEach((item) => add(item.data, 'despesas', item.valor));
    records.boletos.forEach((item) => {
        if (item.statusPagamento === 'pago') add(item.dataVencimento, 'despesas', item.valor);
    });
    records.folha.forEach((item) => {
        if (item.statusPagamento === 'pago' && !linkedFolhas.has(item.id.toLowerCase())) {
            add(item.dataPagamento, 'despesas', item.valor);
        }
    });

    const faturamento = chart.reduce((total, point) => total + point.receitas, 0);
    const despesas = chart.reduce((total, point) => total + point.despesas, 0);
    const conveniosPendentes = records.convenios.filter((item) => item.statusPagamento !== 'pago');
    const boletosPendentes = records.boletos.filter((item) => item.statusPagamento !== 'pago');
    const marmitasPendentes = records.marmitas.filter((item) =>
        ['pendente', 'vencido', 'parcial'].includes(item.statusRecebimento)
    );
    // Partially paid agreements have no outstanding amount in the current schema.
    const aReceber = conveniosPendentes
        .filter((item) => item.statusPagamento === 'pendente' || item.statusPagamento === 'vencido')
        .reduce((total, item) => total + amount(item.valorBoleto), 0);

    const activities: Activity[] = [
        ...records.caixa.map((item) => ({
            id: `caixa-${item.id}`, date: item.data, description: `Fechamento de caixa — ${item.funcionario}`,
            category: 'Caixa', value: caixaEntradas(item) - amount(item.saidas),
        })),
        ...records.saidas.map((item) => ({
            id: `saida-${item.id}`, date: item.data, description: item.descricao,
            category: 'Saída', value: -amount(item.valor),
        })),
        ...records.vales.map((item) => ({
            id: `vale-${item.id}`, date: item.data, description: `Vale — ${item.funcionario}`,
            category: 'Vale', value: -amount(item.valor),
        })),
        ...records.boletos.filter((item) => item.statusPagamento === 'pago').map((item) => ({
            id: `boleto-${item.id}`, date: item.dataPagamento || item.dataVencimento,
            description: item.cliente, category: 'Boleto pago', value: -amount(item.valor),
        })),
        ...records.convenios.filter((item) => item.statusPagamento === 'pago').map((item) => ({
            id: `convenio-${item.id}`, date: item.dataPagamento || item.dataVencimento,
            description: item.empresaCliente, category: 'Convênio', value: amount(item.valorBoleto),
        })),
    ].filter((item) => item.date && !Number.isNaN(new Date(item.date).getTime()))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    const todayIncluded = today.getFullYear() === year && (month === 'all' || today.getMonth() === month);
    const todayCaixas = todayIncluded ? records.caixa.filter((item) => {
        const date = new Date(item.data);
        return date.getFullYear() === today.getFullYear()
            && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
    }) : [];

    return {
        chart, faturamento, despesas, saldo: faturamento - despesas, aReceber,
        boletosPendentes: boletosPendentes.length,
        conveniosPendentes: conveniosPendentes.length,
        marmitasPendentes: marmitasPendentes.length,
        marmitasVendidas: records.marmitas.reduce((total, item) => total + amount(item.quantidade ?? 1), 0),
        activities, todayIncluded, todayCount: todayCaixas.length,
        caixaHoje: todayCaixas.reduce((total, item) => total + caixaEntradas(item) - amount(item.saidas), 0),
    };
}
