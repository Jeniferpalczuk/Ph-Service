'use client';

import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useDashboardStatistics } from '@/hooks/financeiro/useDashboard';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { buildDashboard } from '@/lib/dashboard';
import {
  LuArrowDownLeft, LuArrowUpRight, LuBarcode, LuCalculator, LuCalendarDays,
  LuChartColumnIncreasing, LuChevronRight, LuHandshake, LuPlus, LuReceiptText,
  LuRefreshCw, LuTriangleAlert, LuUtensilsCrossed, LuWallet,
} from 'react-icons/lu';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import './dashboard.css';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const shortCurrency = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export default function DashboardPage() {
  const { getParam, setParams } = useUrlFilters();
  const { theme } = useApp();
  const today = new Date();
  const yearParam = Number(getParam('year'));
  const year = Number.isInteger(yearParam) && yearParam >= 2000 && yearParam <= 2100
    ? yearParam : today.getFullYear();
  const monthParam = getParam('month');
  const parsedMonth = monthParam === null ? today.getMonth() : Number(monthParam);
  const month = monthParam === 'all' ? 'all'
    : Number.isInteger(parsedMonth) && parsedMonth >= 0 && parsedMonth <= 11 ? parsedMonth : today.getMonth();
  const { rawData, isLoading, isError, hasPartialData, retry } = useDashboardStatistics(year, String(month));
  const dashboard = buildDashboard(rawData, year, month);
  const years = Array.from(new Set([year, ...Array.from({ length: Math.max(3, today.getFullYear() - 2023) }, (_, i) => today.getFullYear() - i)]))
    .sort((a, b) => b - a);
  const hasChartData = dashboard.chart.some((point) => point.receitas !== 0 || point.despesas !== 0);
  const dark = theme === 'dark';
  const revenueColor = dark ? '#2dd4bf' : '#4f35cc';
  const expenseColor = dark ? '#bb86fc' : '#ef4444';

  const recentActivity = (
    <section className="dashboard-panel dashboard-recent" aria-labelledby="recent-title">
      <div className="dashboard-panel-heading">
        <div><h2 id="recent-title">Últimos lançamentos</h2><p>Registros do período selecionado</p></div>
      </div>
      {dashboard.activities.length ? (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead>
            <tbody>{dashboard.activities.map((item) => (
              <tr key={item.id}>
                <td>{new Date(item.date).toLocaleDateString('pt-BR')}</td>
                <td>{item.description}</td>
                <td><span className="dashboard-category">{item.category}</span></td>
                <td className={item.value < 0 ? 'dashboard-amount-negative' : 'dashboard-amount-positive'}>
                  {item.value < 0 ? '− ' : ''}{currency.format(Math.abs(item.value))}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <p className="dashboard-empty">Nenhum lançamento encontrado neste período.</p>}
    </section>
  );

  const quickActions = (
    <section className="dashboard-panel dashboard-actions" aria-labelledby="actions-title">
      <div className="dashboard-panel-heading"><div><h2 id="actions-title">Ações rápidas</h2><p>Acesse os módulos do dia a dia</p></div></div>
      <div className="dashboard-actions-grid">
        <Link href="/caixa"><LuCalculator aria-hidden="true" /><span>Caixa</span></Link>
        <Link href="/boletos"><LuBarcode aria-hidden="true" /><span>Boletos</span></Link>
        <Link href="/marmitas"><LuUtensilsCrossed aria-hidden="true" /><span>Marmitas</span></Link>
        <Link href="/saidas"><LuPlus aria-hidden="true" /><span>Saídas</span></Link>
      </div>
    </section>
  );

  const operationalSummary = (
    <section className="dashboard-panel dashboard-operational" aria-labelledby="operational-title">
      <div className="dashboard-panel-heading"><div><h2 id="operational-title">Resumo operacional</h2><p>Movimento do período selecionado</p></div></div>
      <div className="dashboard-operational-grid">
        <div><LuUtensilsCrossed aria-hidden="true" /><span>Marmitas vendidas</span><strong>{dashboard.marmitasVendidas}</strong></div>
        <div><LuBarcode aria-hidden="true" /><span>Boletos em aberto</span><strong>{dashboard.boletosPendentes}</strong></div>
        <div><LuHandshake aria-hidden="true" /><span>Convênios em aberto</span><strong>{dashboard.conveniosPendentes}</strong></div>
      </div>
    </section>
  );

  const todayCash = (
    <section className="dashboard-panel dashboard-today" aria-labelledby="today-title">
      <div className="dashboard-today-icon"><LuCalculator aria-hidden="true" /></div>
      <div className="dashboard-today-copy">
        <h2 id="today-title">Caixa de hoje</h2>
        {!dashboard.todayIncluded ? <p>O período selecionado não inclui hoje.</p>
          : dashboard.todayCount ? <p>{plural(dashboard.todayCount, 'fechamento registrado', 'fechamentos registrados')}</p>
            : <p>Nenhum fechamento registrado hoje.</p>}
        {dashboard.todayCount > 0 && <strong>{currency.format(dashboard.caixaHoje)}</strong>}
      </div>
      <Link href="/caixa" className="dashboard-outline-link">Abrir caixa <LuChevronRight aria-hidden="true" /></Link>
    </section>
  );

  return (
    <div className="dashboard-page">
      <header className="dashboard-heading">
        <div><h1>Visão geral</h1><p>Acompanhe as finanças e a operação do seu restaurante.</p></div>
        <div className="dashboard-period" aria-label="Filtrar período">
          <LuCalendarDays aria-hidden="true" />
          <label className="dashboard-sr-only" htmlFor="dashboard-month">Mês</label>
          <select id="dashboard-month" value={String(month)} onChange={(event) => setParams({ month: event.target.value })}>
            <option value="all">Todo o ano</option>
            {Array.from({ length: 12 }, (_, index) => (
              <option value={String(index)} key={index}>
                {new Date(year, index, 1).toLocaleDateString('pt-BR', { month: 'long' })}
              </option>
            ))}
          </select>
          <label className="dashboard-sr-only" htmlFor="dashboard-year">Ano</label>
          <select id="dashboard-year" value={year} onChange={(event) => setParams({ year: event.target.value })}>
            {years.map((option) => <option value={option} key={option}>{option}</option>)}
          </select>
        </div>
      </header>

      {isLoading ? (
        <div className="dashboard-message" role="status"><span className="dashboard-loading-dot" />Carregando os dados do painel...</div>
      ) : isError ? (
        <div className="dashboard-message dashboard-error" role="alert">
          <LuTriangleAlert aria-hidden="true" />
          <div><strong>Não foi possível carregar o painel.</strong><p>Verifique a conexão e tente novamente.</p></div>
          <button type="button" onClick={() => void retry()}><LuRefreshCw aria-hidden="true" /> Tentar novamente</button>
        </div>
      ) : (
        <>
          {hasPartialData && <div className="dashboard-notice" role="status"><LuTriangleAlert aria-hidden="true" /> Alguns registros excedem o limite de carregamento. Os totais podem estar incompletos.</div>}
          <section className="dashboard-metrics" aria-label="Resumo financeiro">
            <div className="dashboard-metric revenue"><span className="dashboard-metric-icon"><LuChartColumnIncreasing aria-hidden="true" /></span><div><span>Faturamento</span><strong>{currency.format(dashboard.faturamento)}</strong></div></div>
            <div className="dashboard-metric expenses"><span className="dashboard-metric-icon"><LuReceiptText aria-hidden="true" /></span><div><span>Despesas</span><strong>{currency.format(dashboard.despesas)}</strong></div></div>
            <div className="dashboard-metric balance"><span className="dashboard-metric-icon"><LuChartColumnIncreasing aria-hidden="true" /></span><div><span>Saldo</span><strong>{currency.format(dashboard.saldo)}</strong></div></div>
            <div className="dashboard-metric receivable"><span className="dashboard-metric-icon"><LuWallet aria-hidden="true" /></span><div><span>A receber</span><strong>{currency.format(dashboard.aReceber)}</strong><small>Convênios pendentes ou vencidos</small></div></div>
          </section>

          <div className="dashboard-main-grid">
            <section className="dashboard-panel dashboard-chart-panel" aria-labelledby="chart-title">
              <div className="dashboard-panel-heading dashboard-chart-heading">
                <div><h2 id="chart-title">Evolução financeira</h2><p>Receitas e despesas do período</p></div>
                <div className="dashboard-legend"><span><i className="legend-revenue" />Receitas</span><span><i className="legend-expense" />Despesas</span></div>
              </div>
              {hasChartData ? (
                <div className="dashboard-chart" role="img" aria-label="Gráfico de receitas e despesas no período selecionado">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboard.chart} margin={{ top: 10, right: 12, left: 2, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dashboard-revenue-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={revenueColor} stopOpacity={0.2} /><stop offset="100%" stopColor={revenueColor} stopOpacity={0.015} /></linearGradient>
                        <linearGradient id="dashboard-expense-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={expenseColor} stopOpacity={0.15} /><stop offset="100%" stopColor={expenseColor} stopOpacity={0.01} /></linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke={dark ? '#2a3043' : '#e8eaf2'} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: dark ? '#aeb5c8' : '#687286', fontSize: 11 }} minTickGap={24} />
                      <YAxis axisLine={false} tickLine={false} width={64} tick={{ fill: dark ? '#aeb5c8' : '#687286', fontSize: 11 }} tickFormatter={(value) => `R$ ${shortCurrency.format(value)}`} />
                      <Tooltip formatter={(value) => currency.format(Number(value) || 0)} contentStyle={{ borderRadius: 10, border: `1px solid ${dark ? '#34394d' : '#e2e6ef'}`, background: dark ? '#1b2030' : '#fff', color: dark ? '#fff' : '#172033' }} />
                      <Area type="monotone" dataKey="receitas" name="Receitas" stroke={revenueColor} strokeWidth={2.5} fill="url(#dashboard-revenue-fill)" isAnimationActive={false} />
                      <Area type="monotone" dataKey="despesas" name="Despesas" stroke={expenseColor} strokeWidth={2.5} fill="url(#dashboard-expense-fill)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="dashboard-chart-empty">Não há movimentações para exibir neste período.</div>}
              <p className="dashboard-chart-note">Boletos e convênios são agrupados pelo vencimento.</p>
            </section>

            <section className="dashboard-panel dashboard-pending" aria-labelledby="pending-title">
              <div className="dashboard-panel-heading"><div><h2 id="pending-title">Pendências</h2><p>Acompanhe o que precisa de atenção</p></div></div>
              <div className="dashboard-pending-list">
                <Link href="/boletos" className="dashboard-pending-row"><span className="dashboard-pending-icon"><LuBarcode aria-hidden="true" /></span><span><strong>Boletos</strong><small>{plural(dashboard.boletosPendentes, 'boleto em aberto', 'boletos em aberto')}</small></span><LuChevronRight aria-hidden="true" /></Link>
                <Link href="/convenios" className="dashboard-pending-row"><span className="dashboard-pending-icon"><LuHandshake aria-hidden="true" /></span><span><strong>Convênios</strong><small>{plural(dashboard.conveniosPendentes, 'convênio em aberto', 'convênios em aberto')}</small></span><LuChevronRight aria-hidden="true" /></Link>
                <Link href="/marmitas" className="dashboard-pending-row"><span className="dashboard-pending-icon"><LuUtensilsCrossed aria-hidden="true" /></span><span><strong>Marmitas</strong><small>{plural(dashboard.marmitasPendentes, 'recebimento pendente', 'recebimentos pendentes')}</small></span><LuChevronRight aria-hidden="true" /></Link>
              </div>
            </section>
          </div>

          <div className="dashboard-lower-grid">
            {dark ? <>{operationalSummary}{todayCash}{recentActivity}{quickActions}</> : <>{recentActivity}{quickActions}{operationalSummary}{todayCash}</>}
          </div>
          <p className="dashboard-data-note"><LuArrowUpRight aria-hidden="true" /> Entradas do caixa e convênios pagos <span>·</span> <LuArrowDownLeft aria-hidden="true" /> Saídas, boletos pagos, vales e folha</p>
        </>
      )}
    </div>
  );
}
