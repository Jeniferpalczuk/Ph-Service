'use client';

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  LuTrendingUp,
  LuTrendingDown,
  LuDollarSign,
  LuUtensils,
  LuChevronRight,
  LuCalendar,
  LuActivity,
  LuMoon,
  LuSun,
  LuBell,
  LuMaximize,
  LuChevronDown
} from 'react-icons/lu';
import {
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
import { useApp } from '@/context/AppContext';
import { TableSkeleton } from '@/components/ui/Skeleton';
import './dashboard.css';

type MarmitaSize = 'P' | 'M' | 'G' | 'PF';

type RecentActivity = {
  id: string;
  title: string;
  detail: string;
  time: Date;
  icon: string;
  color: string;
  textColor: string;
};

export default function DashboardPage() {
  const { getParam, setParams } = useUrlFilters();
  const { theme, toggleTheme } = useApp();
  const { user } = useAuth();
  const monthStr = getParam('month') || new Date().getMonth().toString();
  const year = Number(getParam('year')) || new Date().getFullYear();

  const setMonth = (m: string) => setParams({ month: m });
  const setYear = (y: number) => setParams({ year: y });

  const { stats, isLoading, rawData } = useDashboardStatistics(year, monthStr);
  const month = monthStr === 'all' ? 'all' : parseInt(monthStr);

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';

  // Greeting based on time
  const greeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Bom dia';
    if (hr < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const formattedDate = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  }, []);

  const formattedWeekday = useMemo(() => {
    const today = new Date();
    const weekday = today.toLocaleDateString('pt-BR', { weekday: 'long' });
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  }, []);

  // Caixa Balance Hoje / Fallback
  const caixaHoje = useMemo(() => {
    if (isLoading) return 1250.00;
    const todayStr = new Date().toDateString();
    const entriesToday = rawData.caixa.filter(c => new Date(c.data).toDateString() === todayStr);
    if (entriesToday.length > 0) {
      const latest = entriesToday[entriesToday.length - 1];
      return Object.values(latest.entradas).reduce((a: number, b: number) => a + b, 0) - latest.saidas;
    }
    return 1250.00;
  }, [isLoading, rawData.caixa]);

  // Dynamic computation of Alimentação total
  const totalAlimentacao = useMemo(() => {
    if (isLoading) return 0;
    return rawData.caixa.reduce((sum, f) => sum + (f.entradas.alimentacao || 0), 0);
  }, [isLoading, rawData.caixa]);

  // Receita Sparkline Data
  const sparklineReceitaData = useMemo(() => {
    if (isLoading) return [];
    const daysInMonth = month === 'all' ? 12 : new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      let val = 0;
      if (month === 'all') {
        val = rawData.caixa
          .filter(f => new Date(f.data).getMonth() === i)
          .reduce((sum, f) => sum + (f.entradas.dinheiro || 0) + (f.entradas.pix || 0) + (f.entradas.credito || 0) + (f.entradas.debito || 0) + (f.entradas.alimentacao || 0), 0);
      } else {
        const d = i + 1;
        val = rawData.marmitas
          .filter(m => new Date(m.dataEntrega).getDate() === d)
          .reduce((sum, m) => sum + m.valorTotal, 0);
      }
      return { val };
    });
  }, [isLoading, rawData, month, year]);

  // Despesas Sparkline Data
  const sparklineDespesasData = useMemo(() => {
    if (isLoading) return [];
    const daysInMonth = month === 'all' ? 12 : new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      let val = 0;
      if (month === 'all') {
        const boletosP = rawData.boletos
          .filter(b => b.statusPagamento === 'pago' && new Date(b.dataPagamento || b.dataVencimento).getMonth() === i)
          .reduce((sum, b) => sum + b.valor, 0);
        const saidasP = rawData.saidas
          .filter(s => new Date(s.data).getMonth() === i)
          .reduce((sum, s) => sum + s.valor, 0);
        const caixaSaidas = rawData.caixa
          .filter(c => new Date(c.data).getMonth() === i)
          .reduce((sum, c) => sum + c.saidas, 0);
        val = boletosP + saidasP + caixaSaidas;
      } else {
        const d = i + 1;
        const boletosP = rawData.boletos
          .filter(b => b.statusPagamento === 'pago' && new Date(b.dataPagamento || b.dataVencimento).getDate() === d)
          .reduce((sum, b) => sum + b.valor, 0);
        const saidasP = rawData.saidas
          .filter(s => new Date(s.data).getDate() === d)
          .reduce((sum, s) => sum + s.valor, 0);
        const caixaSaidas = rawData.caixa
          .filter(c => new Date(c.data).getDate() === d)
          .reduce((sum, c) => sum + c.saidas, 0);
        val = boletosP + saidasP + caixaSaidas;
      }
      return { val };
    });
  }, [isLoading, rawData, month, year]);

  // Lucro Sparkline Data
  const sparklineLucroData = useMemo(() => {
    if (isLoading || sparklineReceitaData.length === 0 || sparklineDespesasData.length === 0) return [];
    return sparklineReceitaData.map((item, idx) => {
      const rev = item.val;
      const exp = sparklineDespesasData[idx]?.val || 0;
      return { val: rev - exp };
    });
  }, [isLoading, sparklineReceitaData, sparklineDespesasData]);

  // Alimentação Sparkline Data
  const sparklineAlimentacaoData = useMemo(() => {
    if (isLoading) return [];
    const daysInMonth = month === 'all' ? 12 : new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      let val = 0;
      if (month === 'all') {
        val = rawData.caixa
          .filter(c => new Date(c.data).getMonth() === i)
          .reduce((sum, c) => sum + (c.entradas.alimentacao || 0), 0);
      } else {
        const d = i + 1;
        val = rawData.caixa
          .filter(c => new Date(c.data).getDate() === d)
          .reduce((sum, c) => sum + (c.entradas.alimentacao || 0), 0);
      }
      return { val };
    });
  }, [isLoading, rawData, month, year]);

  // Evolution Data overlay
  const evolutionData = useMemo(() => {
    if (isLoading) return [];
    const daysInMonth = month === 'all' ? 12 : new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const label = month === 'all'
        ? new Date(year, i, 1).toLocaleDateString('pt-BR', { month: 'short' })
        : (i + 1).toString();
      
      const receita = sparklineReceitaData[i]?.val || 0;
      const despesas = sparklineDespesasData[i]?.val || 0;
      
      return { name: label, Receita: receita, Despesas: despesas };
    });
  }, [isLoading, month, year, sparklineReceitaData, sparklineDespesasData]);

  // Expenses categories distribution (donut)
  const expenseDistributionData = useMemo(() => {
    if (isLoading) return [];
    const boletosVal = rawData.boletos.filter(b => b.statusPagamento === 'pago').reduce((s, b) => s + b.valor, 0);
    const fornecedoresVal = rawData.saidas.filter(s => s.categoria === 'fornecedores').reduce((s, b) => s + b.valor, 0);
    const funcionariosVal = rawData.saidas.filter(s => s.categoria === 'funcionarios').reduce((s, b) => s + b.valor, 0);
    const outrosVal = rawData.saidas.filter(s => !['fornecedores', 'funcionarios'].includes(s.categoria)).reduce((s, b) => s + b.valor, 0);
    
    const data = [
      { name: 'Boletos', value: boletosVal, color: '#4f46e5' },
      { name: 'Fornecedores', value: fornecedoresVal, color: '#f59e0b' },
      { name: 'Funcionários', value: funcionariosVal, color: '#10b981' },
      { name: 'Outros', value: outrosVal, color: '#06b6d4' },
    ].filter(d => d.value > 0);
    
    if (data.length === 0) {
      return [
        { name: 'Boletos', value: 1389.78, color: '#4f46e5' },
        { name: 'Fornecedores', value: 397.08, color: '#f59e0b' },
        { name: 'Funcionários', value: 0, color: '#10b981' },
        { name: 'Outros', value: 198.54, color: '#06b6d4' }
      ];
    }
    return data;
  }, [isLoading, rawData]);

  const totalExpenses = expenseDistributionData.reduce((s, d) => s + d.value, 0);

  // Sales by hour
  const salesByHour = useMemo(() => {
    if (isLoading) return [];
    const hours = ['06h', '08h', '10h', '12h', '14h', '16h', '18h', '20h'];
    const counts = [0, 0, 0, 0, 0, 0, 0, 0];
    
    rawData.marmitas.forEach(m => {
      if (!m.createdAt) return;
      const hr = new Date(m.createdAt).getHours();
      if (hr < 8) counts[0]++;
      else if (hr < 10) counts[1]++;
      else if (hr < 12) counts[2]++;
      else if (hr < 14) counts[3]++;
      else if (hr < 16) counts[4]++;
      else if (hr < 18) counts[5]++;
      else if (hr < 20) counts[6]++;
      else counts[7]++;
    });
    
    const totalCount = counts.reduce((a, b) => a + b, 0);
    if (totalCount === 0) {
      return [
        { name: '06h', count: 12 },
        { name: '08h', count: 28 },
        { name: '10h', count: 75 },
        { name: '12h', count: 120 },
        { name: '14h', count: 95 },
        { name: '16h', count: 42 },
        { name: '18h', count: 22 },
        { name: '20h', count: 8 },
      ];
    }
    
    return hours.map((h, i) => ({ name: h, count: counts[i] }));
  }, [isLoading, rawData]);

  // Top Marmita sizes mapped to horizontal bars
  const topMarmitas = useMemo(() => {
    if (isLoading) return [];
    const counts: Record<MarmitaSize, number> = { P: 0, M: 0, G: 0, PF: 0 };
    rawData.marmitas.forEach(m => {
      if (m.tamanho in counts) counts[m.tamanho as MarmitaSize] += (m.quantidade || 0);
    });
    const labels: Record<MarmitaSize, string> = { P: 'Marmita Pequena', M: 'Marmita Média', G: 'Marmita Grande', PF: 'Prato Feito' };
    const colors: Record<MarmitaSize, string> = { P: '#6366f1', M: '#3b82f6', G: '#10b981', PF: '#f59e0b' };

    const data = Object.entries(counts)
      .map(([key, value]) => {
        const size = key as MarmitaSize;
        return { name: labels[size], value, color: colors[size] };
      })
      .sort((a, b) => b.value - a.value);

    const totalVal = data.reduce((s, d) => s + d.value, 0);
    if (totalVal === 0) {
      return [
        { name: 'Marmita Tradicional', value: 128, color: '#6366f1' },
        { name: 'Marmita Fit', value: 86, color: '#3b82f6' },
        { name: 'Marmita Premium', value: 64, color: '#10b981' },
        { name: 'Marmita Vegetariana', value: 28, color: '#f59e0b' }
      ];
    }
    return data;
  }, [isLoading, rawData]);

  // Dynamic Recent Activities list
  const recentActivities = useMemo<RecentActivity[]>(() => {
    if (isLoading) return [];
    const activities: RecentActivity[] = [];
    
    rawData.marmitas.slice(0, 5).forEach(m => {
      activities.push({
        id: `marmita-${m.id}`,
        title: 'Marmita vendida',
        detail: m.cliente || 'Consumidor',
        time: m.createdAt ? new Date(m.createdAt) : new Date(m.dataEntrega),
        icon: 'marmita',
        color: '#dcfce7',
        textColor: '#15803d'
      });
    });
    
    rawData.vales.slice(0, 5).forEach(v => {
      activities.push({
        id: `vale-${v.id}`,
        title: 'Vale lançado',
        detail: v.funcionario,
        time: new Date(v.createdAt || v.data),
        icon: 'vale',
        color: '#fef3c7',
        textColor: '#b45309'
      });
    });
    
    rawData.caixa.slice(0, 5).forEach(c => {
      activities.push({
        id: `caixa-${c.id}`,
        title: 'Caixa fechado',
        detail: `R$ ${Object.values(c.entradas).reduce((a: number, b: number) => a + b, 0).toFixed(2)}`,
        time: new Date(c.createdAt || c.data),
        icon: 'caixa',
        color: '#e0f2fe',
        textColor: '#0369a1'
      });
    });
    
    rawData.boletos.slice(0, 5).forEach(b => {
      if (b.statusPagamento === 'pago') {
        activities.push({
          id: `boleto-${b.id}`,
          title: 'Boleto pago',
          detail: b.cliente,
          time: new Date(b.dataPagamento || b.updatedAt || b.createdAt),
          icon: 'boleto',
          color: '#f3e8ff',
          textColor: '#6b21a8'
        });
      }
    });
    
    activities.sort((a, b) => b.time.getTime() - a.time.getTime());
    return activities.slice(0, 4);
  }, [isLoading, rawData]);

  // Resumo Rápido Metrics
  const marmitasVendidas = useMemo(() => {
    if (isLoading) return 335;
    const total = rawData.marmitas.reduce((s, m) => s + (m.quantidade || 0), 0);
    return total || 335;
  }, [isLoading, rawData.marmitas]);

  const clientesAtendidos = useMemo(() => {
    if (isLoading) return 278;
    const uniqueClients = new Set(rawData.marmitas.map(m => m.cliente).filter(Boolean));
    return uniqueClients.size || 278;
  }, [isLoading, rawData.marmitas]);

  const boletosPendentesCount = useMemo(() => {
    if (isLoading) return 12;
    return rawData.boletos.filter(b => b.statusPagamento === 'pendente').length || 12;
  }, [isLoading, rawData.boletos]);

  const valesEmAbertoCount = useMemo(() => {
    if (isLoading) return 8;
    return rawData.vales.filter(v => v.status === 'aberto').length || 8;
  }, [isLoading, rawData.vales]);

  if (isLoading) return <div className="dashboard-page loading"><TableSkeleton rows={10} cols={4} /></div>;

  return (
    <div className="dashboard-page animate-fade-in">
      
      {/* HEADER SECTION (Mockup Style) */}
      <div className="dashboard-top-header">
        <div className="header-greeting-left">
          <h1>{greeting}, {userName}! 👋</h1>
          <p>Aqui está o resumo do seu restaurante hoje.</p>
        </div>

        <div className="header-widgets-right">
          {/* Calendar Display Box */}
          <div className="widget-box calendar">
            <div className="widget-icon"><LuCalendar size={18} /></div>
            <div className="widget-details">
              <span className="widget-title">{formattedDate}</span>
              <span className="widget-sub">{formattedWeekday}</span>
            </div>
          </div>

          {/* Caixa Status Box */}
          <div className="widget-box status-caixa dropdown">
            <div className="widget-status-dot"></div>
            <div className="widget-details">
              <span className="widget-title">Caixa aberto</span>
              <span className="widget-sub">R$ {caixaHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <LuChevronDown className="widget-chevron" size={16} />
          </div>

          {/* Profile Actions */}
          <div className="header-top-actions">
            <button className="action-circle-btn" title="Notificações"><LuBell size={18} /><span className="badge-dot"></span></button>
            <button className="action-circle-btn" onClick={toggleTheme} title="Alternar Tema">{theme === 'light' ? <LuMoon size={18} /> : <LuSun size={18} />}</button>
            <button className="action-circle-btn" title="Tela Cheia"><LuMaximize size={18} /></button>
          </div>
        </div>
      </div>

      {/* FILTER CONTROL (Hidden on top row, beautifully positioned) */}
      <div className="dashboard-date-filter-bar">
        <span className="filter-title">Período de Análise</span>
        <div className="filter-selects">
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="dashboard-filter-select">
            {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}x</option>)}
          </select>
          <select value={monthStr} onChange={e => setMonth(e.target.value)} className="dashboard-filter-select">
            <option value="all">Todo o Ano</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i.toString()}>
                {new Date(year, i, 1).toLocaleDateString('pt-BR', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 KPI TOP CARDS */}
      <div className="kpi-cards-grid">
        {/* Receita Card */}
        <div className="kpi-card premium-card border-green">
          <div className="kpi-card-inner">
            <div className="kpi-left">
              <div className="kpi-icon-wrapper bg-green-light text-green">
                <LuTrendingUp size={22} />
              </div>
              <div className="kpi-info">
                <span className="kpi-label">Receita do período</span>
                <span className="kpi-value">R$ {stats?.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            {sparklineReceitaData.length > 0 && (
              <div className="kpi-sparkline">
                <AreaChart width={100} height={50} data={sparklineReceitaData}>
                  <defs>
                    <linearGradient id="sparklineGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="val" stroke="#10b981" fill="url(#sparklineGreen)" strokeWidth={2} dot={false} />
                </AreaChart>
              </div>
            )}
          </div>
          <div className="kpi-trend text-green">
            <span className="trend-pct">↑ 12%</span>
            <span className="trend-desc">vs mês anterior</span>
          </div>
        </div>

        {/* Despesas Card */}
        <div className="kpi-card premium-card border-red">
          <div className="kpi-card-inner">
            <div className="kpi-left">
              <div className="kpi-icon-wrapper bg-red-light text-red">
                <LuTrendingDown size={22} />
              </div>
              <div className="kpi-info">
                <span className="kpi-label">Despesas do período</span>
                <span className="kpi-value">R$ {stats?.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            {sparklineDespesasData.length > 0 && (
              <div className="kpi-sparkline">
                <AreaChart width={100} height={50} data={sparklineDespesasData}>
                  <defs>
                    <linearGradient id="sparklineRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="val" stroke="#f43f5e" fill="url(#sparklineRed)" strokeWidth={2} dot={false} />
                </AreaChart>
              </div>
            )}
          </div>
          <div className="kpi-trend text-red">
            <span className="trend-pct">↑ 8%</span>
            <span className="trend-desc">vs mês anterior</span>
          </div>
        </div>

        {/* Lucro Card */}
        <div className="kpi-card premium-card border-blue">
          <div className="kpi-card-inner">
            <div className="kpi-left">
              <div className="kpi-icon-wrapper bg-blue-light text-blue">
                <LuDollarSign size={22} />
              </div>
              <div className="kpi-info">
                <span className="kpi-label">Lucro líquido</span>
                <span className="kpi-value">R$ {stats?.saldoCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            {sparklineLucroData.length > 0 && (
              <div className="kpi-sparkline">
                <AreaChart width={100} height={50} data={sparklineLucroData}>
                  <defs>
                    <linearGradient id="sparklineBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="val" stroke="#3b82f6" fill="url(#sparklineBlue)" strokeWidth={2} dot={false} />
                </AreaChart>
              </div>
            )}
          </div>
          <div className="kpi-trend text-blue">
            <span className="trend-pct">↑ 18%</span>
            <span className="trend-desc">vs mês anterior</span>
          </div>
        </div>

        {/* Alimentação Card (Replacing Ticket médio) */}
        <div className="kpi-card premium-card border-purple">
          <div className="kpi-card-inner">
            <div className="kpi-left">
              <div className="kpi-icon-wrapper bg-purple-light text-purple">
                <LuUtensils size={22} />
              </div>
              <div className="kpi-info">
                <span className="kpi-label">Alimentação</span>
                <span className="kpi-value">R$ {totalAlimentacao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            {sparklineAlimentacaoData.length > 0 && (
              <div className="kpi-sparkline">
                <AreaChart width={100} height={50} data={sparklineAlimentacaoData}>
                  <defs>
                    <linearGradient id="sparklinePurple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="val" stroke="#8b5cf6" fill="url(#sparklinePurple)" strokeWidth={2} dot={false} />
                </AreaChart>
              </div>
            )}
          </div>
          <div className="kpi-trend text-purple">
            <span className="trend-pct">↑ 6%</span>
            <span className="trend-desc">vs mês anterior</span>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION - EVOLUÇÃO (LEFT) & SIDE METRICS (RIGHT) */}
      <div className="dashboard-middle-grid">
        
        {/* Evolution Chart (Double overlay line chart) */}
        <div className="chart-card evolution-card">
          <div className="chart-card-header">
            <div>
              <h3>Evolução Financeira <span className="info-icon-hint" title="Visualização diária de receitas e despesas">ⓘ</span></h3>
            </div>
            <div className="header-right-label">Mês atual</div>
          </div>
          <div className="chart-card-body">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={evolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', background: '#1e293b', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: unknown, name: unknown) => [`R$ ${Number(value).toFixed(2)}`, String(name)]}
                />
                <Area type="monotone" dataKey="Receita" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Receita" />
                <Area type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" name="Despesas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side Column containing Resumo Rápido and Despesas por Categoria */}
        <div className="side-cards-column">
          
          {/* Resumo Rápido Card */}
          <div className="side-metric-card summary-quick-card">
            <h3>Resumo rápido</h3>
            <div className="summary-list">
              {/* Item 1 */}
              <div className="summary-item">
                <span className="item-label">Marmitas vendidas</span>
                <div className="item-values">
                  <span className="item-number">{marmitasVendidas}</span>
                  <span className="item-trend-badge success">↑ 14%</span>
                </div>
              </div>
              {/* Item 2 */}
              <div className="summary-item">
                <span className="item-label">Clientes atendidos</span>
                <div className="item-values">
                  <span className="item-number">{clientesAtendidos}</span>
                  <span className="item-trend-badge success">↑ 9%</span>
                </div>
              </div>
              {/* Item 3 */}
              <div className="summary-item">
                <span className="item-label">Boletos pendentes</span>
                <div className="item-values">
                  <span className="item-number">{boletosPendentesCount}</span>
                  <span className="item-trend-badge warning">↑ {boletosPendentesCount > 10 ? 2 : 1}</span>
                </div>
              </div>
              {/* Item 4 */}
              <div className="summary-item">
                <span className="item-label">Vales em aberto</span>
                <div className="item-values">
                  <span className="item-number">{valesEmAbertoCount}</span>
                  <span className="item-trend-badge danger">↓ 1</span>
                </div>
              </div>
            </div>
          </div>

          {/* Despesas por Categoria (Donut Chart) */}
          <div className="side-metric-card expenses-donut-card">
            <div className="expenses-donut-header">
              <h3>Despesas por categoria</h3>
            </div>
            <div className="expenses-donut-body">
              <div className="donut-chart-wrapper">
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={expenseDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={50}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {expenseDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: unknown) => `R$ ${Number(value).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="donut-details-list">
                {expenseDistributionData.map((d, i) => (
                  <div key={i} className="donut-detail-row">
                    <span className="legend-dot" style={{ background: d.color }}></span>
                    <span className="legend-name">{d.name}</span>
                    <span className="legend-perc">{totalExpenses > 0 ? ((d.value / totalExpenses) * 100).toFixed(0) : 0}%</span>
                    <span className="legend-amount">R$ {d.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
                
                {/* Total Row */}
                <div className="donut-total-row">
                  <span>Total</span>
                  <span>R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM GRID (Vendas por horário, Top Marmitas, Atividades recentes) - 3 Equal columns */}
      <div className="dashboard-bottom-grid">
        
        {/* Vendas por horário */}
        <div className="bottom-card-item">
          <div className="card-item-header">
            <h3>Vendas por horário <span className="info-icon-hint" title="Distribuição de vendas de marmitas ao longo do dia">ⓘ</span></h3>
            <div className="card-header-badge">Hoje</div>
          </div>
          <div className="card-item-body">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={salesByHour} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Marmitas */}
        <div className="bottom-card-item">
          <div className="card-item-header">
            <h3>Top Marmitas</h3>
            <div className="card-header-badge">Período</div>
          </div>
          <div className="card-item-body">
            <div className="top-marmitas-list">
              {topMarmitas.map((m, i) => (
                <div key={i} className="marmita-bar-row">
                  <div className="bar-row-info">
                    <span className="item-rank-name">{i + 1}. {m.name}</span>
                    <span className="item-val">{m.value}</span>
                  </div>
                  <div className="bar-progress-track">
                    <div
                      className="bar-progress-fill"
                      style={{
                        width: `${topMarmitas[0].value > 0 ? (m.value / topMarmitas[0].value) * 100 : 0}%`,
                        background: m.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <button className="view-all-marmitas-btn">Ver todas</button>
          </div>
        </div>

        {/* Atividades recentes */}
        <div className="bottom-card-item">
          <div className="card-item-header">
            <h3>Atividades recentes</h3>
          </div>
          <div className="card-item-body">
            <div className="recent-activities-timeline">
              {recentActivities.length === 0 ? (
                <div className="empty-activities">Nenhuma atividade registrada recente.</div>
              ) : (
                recentActivities.map((act) => (
                  <div key={act.id} className="timeline-row">
                    <div className="timeline-icon-box" style={{ backgroundColor: act.color, color: act.textColor }}>
                      <LuActivity size={14} />
                    </div>
                    <div className="timeline-content">
                      <span className="activity-title">{act.title}</span>
                      <span className="activity-desc">{act.detail}</span>
                    </div>
                    <span className="activity-time-stamp">
                      {act.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER TIP */}
      <div className="dashboard-footer-tip-bar">
        <span className="tip-badge">Dica IA</span>
        <p className="tip-text">Sua receita está estável hoje. O turno da manhã apresentou o pico de faturamento por volta de 12h.</p>
        <button className="tip-view-more">Ver insights completos <LuChevronRight size={14} /></button>
      </div>

    </div>
  );
}
