'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  LuTrendingUp,
  LuTrendingDown,
  LuDollarSign,
  LuUtensils,
  LuChevronRight,
  LuArrowUpRight,
  LuTriangleAlert,
  LuCalendar
} from 'react-icons/lu';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { useDashboardStatistics } from '@/hooks/financeiro/useDashboard';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { TableSkeleton } from '@/components/ui/Skeleton';
import './dashboard.css';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function DashboardPage() {
  const { getParam, setParams } = useUrlFilters();
  const monthStr = getParam('month') || new Date().getMonth().toString();
  const year = Number(getParam('year')) || new Date().getFullYear();

  const setMonth = (m: string) => setParams({ month: m });
  const setYear = (y: number) => setParams({ year: y });

  const { stats, isLoading, rawData } = useDashboardStatistics(year, monthStr);

  const month = monthStr === 'all' ? 'all' : parseInt(monthStr);

  // Data Transformation for charts
  const revenueEvolutionData = useMemo(() => {
    if (isLoading) return [];
    if (month === 'all') {
      return Array.from({ length: 12 }, (_, i) => {
        const label = new Date(year, i, 1).toLocaleDateString('pt-BR', { month: 'short' });
        const value = rawData.caixa
          .filter(f => new Date(f.data).getMonth() === i)
          .reduce((sum, f) => sum + (f.entradas.dinheiro || 0) + (f.entradas.pix || 0) + (f.entradas.credito || 0) + (f.entradas.debito || 0) + (f.entradas.alimentacao || 0), 0);
        return { name: label, value };
      });
    } else {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => {
        const d = i + 1;
        const value = rawData.marmitas
          .filter(m => new Date(m.dataEntrega).getDate() === d)
          .reduce((sum, m) => sum + m.valorTotal, 0);
        return { name: d.toString(), value };
      });
    }
  }, [isLoading, rawData, month, year]);

  const expenseDistributionData = useMemo(() => {
    if (isLoading) return [];
    const data = [
      { name: 'Boletos', value: rawData.boletos.filter(b => b.statusPagamento === 'pago').reduce((s, b) => s + b.valor, 0), color: '#8b5cf6' },
      { name: 'Fornecedores', value: rawData.saidas.filter(s => s.categoria === 'fornecedores').reduce((s, b) => s + b.valor, 0), color: '#10b981' },
      { name: 'Folha', value: rawData.folha.reduce((s, b) => s + b.valor, 0), color: '#06b6d4' },
      { name: 'Outros', value: rawData.saidas.filter(s => s.categoria !== 'fornecedores').reduce((s, b) => s + b.valor, 0), color: '#f59e0b' },
    ].filter(d => d.value > 0);
    return data;
  }, [isLoading, rawData]);

  const marmitasSalesData = useMemo(() => {
    if (isLoading || month === 'all') return [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const count = rawData.marmitas
        .filter(m => new Date(m.dataEntrega).getDate() === d)
        .reduce((sum, m) => sum + (m.quantidade || 0), 0);
      return { name: d.toString(), count };
    });
  }, [isLoading, rawData, month, year]);

  const topMarmitas = useMemo(() => {
    if (isLoading) return [];
    const counts: any = { P: 0, M: 0, G: 0, PF: 0 };
    rawData.marmitas.forEach(m => {
      if (counts[m.tamanho] !== undefined) counts[m.tamanho] += (m.quantidade || 0);
    });
    const labels: any = { P: 'Pequena', M: 'Média', G: 'Grande', PF: 'Prato Feito' };
    const colors: any = { P: '#10b981', M: '#3b82f6', G: '#f59e0b', PF: '#ef4444' };

    return Object.entries(counts)
      .map(([key, value]: any) => ({ name: labels[key], value, color: colors[key] }))
      .sort((a, b) => b.value - a.value);
  }, [isLoading, rawData]);

  if (isLoading) return <div className="dashboard-page loading"><TableSkeleton rows={10} cols={4} /></div>;

  const totalExpenses = expenseDistributionData.reduce((s, d) => s + d.value, 0);

  // Cálculos reais para marmitas (sem dados hardcoded)
  const hoje = new Date();
  const vendidasHoje = rawData.marmitas
    .filter(m => new Date(m.dataEntrega).toDateString() === hoje.toDateString())
    .reduce((sum, m) => sum + (m.quantidade || 0), 0);

  const faturamentoHoje = rawData.marmitas
    .filter(m => new Date(m.dataEntrega).toDateString() === hoje.toDateString())
    .reduce((sum, m) => sum + m.valorTotal, 0);

  const diasUnicos = rawData.marmitas.length > 0
    ? new Set(rawData.marmitas.map(m => new Date(m.dataEntrega).toDateString())).size
    : 1;
  const mediaDiaria = Math.round(rawData.marmitas.reduce((s, m) => s + (m.quantidade || 0), 0) / diasUnicos);

  return (
    <div className="dashboard-page">
      {/* TOP METRICS */}
      <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon">
            <LuUtensils />
          </div>
          <div className="metric-content">
            <span className="metric-label">Receita do Período:</span>
            <span className="highlight">R$ {stats?.faturamentoTotal.toLocaleString('pt-BR')}</span>
          </div>
        </div>

        <div className="metric-card expenses">
          <div className="metric-icon">
            <LuTrendingDown />
          </div>
          <div className="metric-content">
            <span className="metric-label">Despesas do Período:</span>
            <span className="highlight">R$ {stats?.totalDespesas.toLocaleString('pt-BR')}</span>
          </div>
          <LuChevronRight className="metric-chevron" />
        </div>

        <div className="filter-card">
          <div className="filter-group-inline">
            <LuCalendar className="filter-icon" />
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="dashboard-select">
              {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="filter-group-inline">
            <select value={monthStr} onChange={e => setMonth(e.target.value)} className="dashboard-select">
              <option value="all">Todo o Ano</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i.toString()}>
                  {new Date(year, i, 1).toLocaleDateString('pt-BR', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* MAIN CHARTS */}
      <div className="main-charts-grid">
        <div className="chart-card line-chart-container">
          <div className="chart-header">
            <div className="chart-title-group">
              <div className="title-icon"><LuTrendingUp /></div>
              <h3>Evolução de Receita</h3>
            </div>
            <select className="period-select" disabled title="Controlado pelos filtros acima">
              <option>{month === 'all' ? 'Ano completo' : 'Mês atual'}</option>
            </select>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueEvolutionData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`R$ ${value?.toLocaleString('pt-BR')}`, 'Receita']}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card pie-chart-container">
          <div className="chart-header">
            <div className="chart-title-group">
              <div className="title-icon warning"><LuTrendingDown /></div>
              <h3>Despesas</h3>
            </div>
            <span className="total-amount">R$ {totalExpenses.toLocaleString('pt-BR')}</span>
          </div>
          <div className="chart-body pie-body">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={expenseDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {expenseDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {expenseDistributionData.map((d, i) => (
                <div key={i} className="legend-item">
                  <span className="dot" style={{ background: d.color }}></span>
                  <span className="name">{d.name}</span>
                  <span className="val">{d.value.toLocaleString('pt-BR')}</span>
                  <span className="perc">{totalExpenses > 0 ? ((d.value / totalExpenses) * 100).toFixed(0) : 0}%</span>
                </div>
              ))}
            </div>
            {totalExpenses > (stats?.faturamentoTotal || 1) * 0.7 && (
              <div className="alert-box">
                <LuTriangleAlert />
                <span>Despesas acima de 70% da receita</span>
                <small>Atenção ao equilíbrio financeiro</small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM CHARTS */}
      <div className="bottom-charts-grid">
        <div className="chart-card bar-chart-container">
          <div className="chart-header">
            <h3>Vendas de Marmitas</h3>
            <div className="marmitas-stats">
              <div className="m-stat"><span className="badge">Vendidas hoje</span> <LuTrendingUp color="#10b981" /> {vendidasHoje}</div>
              <div className="m-stat"><span className="badge orange">Faturamento</span> R$ {faturamentoHoje.toLocaleString('pt-BR')} </div>
              <div className="m-stat"><span className="badge teal">Média diária</span> {mediaDiaria}</div>
            </div>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={marmitasSalesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card top-list-container">
          <h3>Top Marmitas</h3>
          <div className="top-list">
            {topMarmitas.map((m, i) => (
              <div key={i} className="top-item">
                <div className="item-info">
                  <span>{m.name}</span>
                  <span>{m.value}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(m.value / (topMarmitas[0].value || 1)) * 100}%`,
                      background: m.color
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
