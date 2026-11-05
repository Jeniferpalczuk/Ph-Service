import { useMarmitasList } from './useMarmitas';
import { useBoletosList } from './useBoletos';
import { useSaidasList } from './useSaidas';
import { useConveniosList } from './useConvenios';
import { useCaixaList } from './useCaixa';
import { useValesList } from '../rh/useVales';
import { useFolhaPagamentoList } from '../rh/useFolhaPagamento';

export function useDashboardStatistics(year: number, month: string | 'all') {
    const monthIndex = month === 'all' ? null : Number(month);
    const startDate = monthIndex === null ? `${year}-01-01` : `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const endDate = monthIndex === null ? `${year}-12-31`
        : `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(new Date(year, monthIndex + 1, 0).getDate()).padStart(2, '0')}`;
    const queryParams = { startDate, endDate, pageSize: 2000 };

    const marmitas = useMarmitasList(queryParams);
    const saidas = useSaidasList(queryParams);
    const boletos = useBoletosList(queryParams);
    const convenios = useConveniosList(queryParams);
    const caixa = useCaixaList(queryParams);
    const vales = useValesList(queryParams);
    const folha = useFolhaPagamentoList(queryParams);
    const queries = [marmitas, saidas, boletos, convenios, caixa, vales, folha];

    return {
        isLoading: queries.some((query) => query.isLoading),
        isError: queries.some((query) => query.isError),
        hasPartialData: queries.some((query) => query.data && query.data.count > query.data.data.length),
        retry: () => Promise.all(queries.filter((query) => query.isError).map((query) => query.refetch())),
        rawData: {
            marmitas: marmitas.data?.data || [],
            saidas: saidas.data?.data || [],
            boletos: boletos.data?.data || [],
            convenios: convenios.data?.data || [],
            caixa: caixa.data?.data || [],
            vales: vales.data?.data || [],
            folha: folha.data?.data || [],
        },
    };
}
