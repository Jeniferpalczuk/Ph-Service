import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMarmitasList } from './useMarmitas';
import { useBoletosList } from './useBoletos';
import { useSaidasList } from './useSaidas';
import { useConveniosList } from './useConvenios';
import { useCaixaList } from './useCaixa';
import { useValesList } from '../rh/useVales';
import { useFolhaPagamentoList } from '../rh/useFolhaPagamento';

export function useDashboardStatistics(year: number, month: string | 'all') {
    const isMonthAll = month === 'all';

    let startDate: string;
    let endDate: string;

    if (isMonthAll) {
        startDate = `${year}-01-01`;
        endDate = `${year}-12-31`;
    } else {
        const monthInt = parseInt(month); // month is 0-indexed string from page.tsx (new Date().getMonth())
        const dbMonth = (monthInt + 1).toString().padStart(2, '0');
        const lastDay = new Date(year, monthInt + 1, 0).getDate();
        const dbLastDay = lastDay.toString().padStart(2, '0');

        startDate = `${year}-${dbMonth}-01`;
        endDate = `${year}-${dbMonth}-${dbLastDay}`;
    }

    // Fetch all collections in parallel
    // We fetch a large enough pageSize for stats calculation, or we could implement a summary action.
    // For now, let's fetch enough to cover the dashboard needs.
    const queryParams = { startDate, endDate, pageSize: 2000 };

    const { data: marmitas, isLoading: loadingMarmitas } = useMarmitasList(queryParams);
    const { data: saidas, isLoading: loadingSaidas } = useSaidasList(queryParams);
    const { data: boletos, isLoading: loadingBoletos } = useBoletosList(queryParams);
    const { data: convenios, isLoading: loadingConvenios } = useConveniosList({ ...queryParams, pageSize: 1000 });
    const { data: caixa, isLoading: loadingCaixa } = useCaixaList(queryParams);
    const { data: vales, isLoading: loadingVales } = useValesList(queryParams);
    const { data: folha, isLoading: loadingFolha } = useFolhaPagamentoList(queryParams);

    const isLoading = loadingMarmitas || loadingSaidas || loadingBoletos || loadingConvenios || loadingCaixa || loadingVales || loadingFolha;

    const stats = useMemo(() => {
        if (isLoading) return null;

        const mData = marmitas?.data || [];
        const sData = saidas?.data || [];
        const bData = boletos?.data || [];
        const convData = convenios?.data || [];
        const cData = caixa?.data || [];
        const vData = vales?.data || [];
        const fData = folha?.data || [];

        // 1. Faturamento
        const faturamentoCaixa = cData.reduce((sum, f) => {
            return sum + (f.entradas.dinheiro || 0) + (f.entradas.pix || 0) +
                (f.entradas.credito || 0) + (f.entradas.debito || 0) + (f.entradas.alimentacao || 0);
        }, 0);

        const conveniosPagos = convData
            .filter(c => c.statusPagamento === 'pago')
            .reduce((sum, c) => sum + c.valorBoleto, 0);

        const faturamentoTotal = faturamentoCaixa + conveniosPagos;

        // 2. Despesas
        const despesasModulo = sData.reduce((sum, s) => sum + s.valor, 0);
        const saidasFechamento = cData.reduce((sum, f) => sum + f.saidas, 0);
        const folhaFilter = fData.reduce((sum, p) => sum + p.valor, 0);
        const boletosPagos = bData.filter(b => b.statusPagamento === 'pago').reduce((sum, b) => sum + b.valor, 0);

        const totalDespesas = despesasModulo + saidasFechamento + folhaFilter + boletosPagos;

        // 3. Saldo
        const saldoCaixa = faturamentoTotal - totalDespesas;

        // 4. Marmitas
        const receitaMarmitas = mData.reduce((sum, m) => sum + m.valorTotal, 0);

        // 5. Convênios
        const conveniosTotal = convData.reduce((sum, c) => sum + c.valorBoleto, 0);
        const conveniosCount = convData.length;
        const conveniosTicketMedio = conveniosCount > 0 ? conveniosTotal / conveniosCount : 0;

        // 6. A Receber
        const boletosPendentes = bData.filter(b => b.statusPagamento !== 'pago').reduce((sum, b) => sum + b.valor, 0);
        const conveniosPendentes = convData.filter(c => c.statusPagamento !== 'pago').reduce((sum, c) => sum + c.valorBoleto, 0);
        const totalAReceber = boletosPendentes + conveniosPendentes;

        // 7. Vales Abertos
        const valesAbertos = vData.filter(v => v.status !== 'quitado').reduce((sum, v) => sum + (v.valor - (v.valorPago || 0)), 0);

        return {
            faturamentoTotal,
            totalDespesas,
            saldoCaixa,
            receitaMarmitas,
            conveniosTotal,
            conveniosCount,
            conveniosTicketMedio,
            totalAReceber,
            valesAbertos,
            folhaFilter
        };
    }, [isLoading, marmitas, saidas, boletos, convenios, caixa, vales, folha]);

    return {
        stats,
        isLoading,
        rawData: {
            marmitas: marmitas?.data || [],
            saidas: saidas?.data || [],
            boletos: boletos?.data || [],
            convenios: convenios?.data || [],
            caixa: caixa?.data || [],
            vales: vales?.data || [],
            folha: folha?.data || []
        }
    };
}
