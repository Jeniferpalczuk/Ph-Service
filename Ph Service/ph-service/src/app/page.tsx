'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import './dashboard.css';

// --- VISUAL COMPONENTS ---

const Filters = ({ month, year, setMonth, setYear }: any) => {
  const months = [
    { value: 'all', label: 'Todos os Meses' },
    { value: '0', label: 'Janeiro' }, { value: '1', label: 'Fevereiro' },
    { value: '2', label: 'Março' }, { value: '3', label: 'Abril' },
    { value: '4', label: 'Maio' }, { value: '5', label: 'Junho' },
    { value: '6', label: 'Julho' }, { value: '7', label: 'Agosto' },
    { value: '8', label: 'Setembro' }, { value: '9', label: 'Outubro' },
    { value: '10', label: 'Novembro' }, { value: '11', label: 'Dezembro' }
  ];

  // Gerar últimos 5 anos
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
      <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
        <label>Mês</label>
        <select value={month} onChange={e => setMonth(e.target.value)}>
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>
      <div className="form-group" style={{ marginBottom: 0, minWidth: '120px' }}>
        <label>Ano</label>
        <select value={year} onChange={e => setYear(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  );
};

const BarChart = ({ data }: { data: { label: string, value: number, color?: string }[] }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const height = 150;
  const barWidth = 40;
  const gap = 20;
  const width = Math.max(data.length * (barWidth + gap), 300); // Min width

  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <svg width={width} height={height + 30} style={{ minWidth: '100%' }}>
        {data.map((d, i) => {
          const barHeight = (d.value / maxValue) * height;
          const x = i * (barWidth + gap);
          const y = height - barHeight;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill={d.color || 'var(--primary-500)'} rx="4" />
              <text x={x + barWidth / 2} y={height + 20} textAnchor="middle" fontSize="12" fill="var(--text-secondary)">{d.label}</text>
              {d.value > 0 && (
                <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--text-primary)">
                  {d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value.toFixed(0)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const DonutChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = 0;
  const radius = 60;
  const cx = 80;
  const cy = 80;

  if (total === 0) return <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>Sem dados no período</div>;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        {data.map((d, i) => {
          const angle = (d.value / total) * 360;
          const x1 = cx + radius * Math.cos((Math.PI * currentAngle) / 180);
          const y1 = cy + radius * Math.sin((Math.PI * currentAngle) / 180);
          const x2 = cx + radius * Math.cos((Math.PI * (currentAngle + angle)) / 180);
          const y2 = cy + radius * Math.sin((Math.PI * (currentAngle + angle)) / 180);

          const largeArc = angle > 180 ? 1 : 0;
          const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

          currentAngle += angle;
          return <path key={i} d={path} fill={d.color} stroke="var(--surface)" strokeWidth="2" />;
        })}
        <circle cx={cx} cy={cy} r={radius * 0.6} fill="var(--surface)" />
      </svg>
      <div className="chart-legend">
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: 12, height: 12, background: d.color, borderRadius: '50%' }}></span>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{d.label}</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{((d.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- TABELA FINANCEIRA MARMITAS ---
const MarmitasRevenueTable = ({ marmitas, year }: { marmitas: any[], year: number }) => {
  const summary: Record<string, { P: number, M: number, G: number, PF: number }> = {};
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Inicializar
  meses.forEach((_, i) => {
    summary[i] = { P: 0, M: 0, G: 0, PF: 0 };
  });

  marmitas.forEach(m => {
    const d = new Date(m.dataEntrega);
    if (d.getFullYear() === year) {
      const monthIndex = d.getMonth();
      const tipo = m.tamanho.trim().toUpperCase();

      let mappedType = '';
      // Match mais robusto
      if (['P', 'PEQUENA'].some(v => v === tipo)) mappedType = 'P';
      else if (['M', 'MEDIA', 'MÉDIA'].some(v => v === tipo)) mappedType = 'M';
      else if (['G', 'GRANDE'].some(v => v === tipo)) mappedType = 'G';
      else if (['PF', 'PRATO FEITO', 'PRATOFEITO'].some(v => v === tipo)) mappedType = 'PF';

      if (mappedType && summary[monthIndex]) {
        summary[monthIndex][mappedType as keyof typeof summary[0]] += m.valorTotal;
      }
    }
  });

  return (
    <div className="table-wrapper">
      <div className="table-header-title">
        <h3>🍱 Valores de Entrada de Marmitas ({year})</h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="modern-table">
          <thead>
            <tr>
              <th>MÊS</th>
              <th className="text-center">MARMITA P</th>
              <th className="text-center">MARMITA M</th>
              <th className="text-center">MARMITA G</th>
              <th className="text-center">PRATO FEITO</th>
            </tr>
          </thead>
          <tbody>
            {meses.map((mes, index) => {
              const data = summary[index];
              return (
                <tr key={mes}>
                  <td>{mes}</td>
                  <td className="text-center" style={{ fontWeight: data.P > 0 ? 600 : 400, color: data.P > 0 ? '#1e40af' : 'var(--text-tertiary)' }}>
                    {data.P > 0 ? `R$ ${data.P.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className="text-center" style={{ fontWeight: data.M > 0 ? 600 : 400, color: data.M > 0 ? '#166534' : 'var(--text-tertiary)' }}>
                    {data.M > 0 ? `R$ ${data.M.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className="text-center" style={{ fontWeight: data.G > 0 ? 600 : 400, color: data.G > 0 ? '#6b21a8' : 'var(--text-tertiary)' }}>
                    {data.G > 0 ? `R$ ${data.G.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className="text-center" style={{ fontWeight: data.PF > 0 ? 600 : 400, color: data.PF > 0 ? '#b45309' : 'var(--text-tertiary)' }}>
                    {data.PF > 0 ? `R$ ${data.PF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- PAGE COMPONENT ---

export default function Dashboard() {
  const {
    fechamentosCaixa, saidas, marmitas, caixaEntries,
    convenios, boletos, vales, outrosServicos, folhaPagamento
  } = useApp();

  const [filterMonth, setFilterMonth] = useState(new Date().getMonth().toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // CALCULO DOS STATS COM FILTRO
  const filteredStats = useMemo(() => {
    const isMonthAll = filterMonth === 'all';
    const targetMonth = parseInt(filterMonth);

    // Helper de filtro
    const checkDate = (dateStr: string | Date | undefined) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (d.getFullYear() !== filterYear) return false;
      if (!isMonthAll && d.getMonth() !== targetMonth) return false;
      return true;
    };

    // 1. Receitas
    const entradasCaixaLegacy = caixaEntries
      .filter(e => e.tipo === 'entrada' && checkDate(e.data))
      .reduce((sum, e) => sum + e.valor, 0);

    const entradasFechamento = fechamentosCaixa
      .filter(f => checkDate(f.data))
      .reduce((sum, f) => {
        const total = (f.entradas.dinheiro || 0) + (f.entradas.pix || 0) +
          (f.entradas.credito || 0) + (f.entradas.debito || 0) + (f.entradas.alimentacao || 0);
        return sum + total;
      }, 0);

    const receitaMarmitasFilter = marmitas
      .filter(m => checkDate(m.dataEntrega) && (m.statusRecebimento === 'pago')) // Se pago ou dinheiro
      .reduce((sum, m) => sum + m.valorTotal, 0);
    // Obs: 'receitaMarmitasFilter' pode estar duplicado com Fechamento se o usuário lança nos dois.
    // O sistema original separava. Vou manter como "Total Recebido" a soma do Caixa.
    // Marmitas geralmente entra no Caixa Diário.

    const totalRecebido = entradasCaixaLegacy + entradasFechamento;

    // 2. Despesas
    const despesasModulo = saidas
      .filter(s => checkDate(s.data))
      .reduce((sum, s) => sum + s.valor, 0);

    const saidasCaixaLegacy = caixaEntries
      .filter(e => e.tipo === 'saida' && checkDate(e.data))
      .reduce((sum, e) => sum + e.valor, 0);

    const saidasFechamento = fechamentosCaixa
      .filter(f => checkDate(f.data))
      .reduce((sum, f) => sum + f.saidas, 0);

    const folhaFilter = folhaPagamento
      .filter(p => checkDate(p.dataPagamento))
      .reduce((sum, p) => sum + p.valor, 0);

    const totalDespesas = despesasModulo + saidasCaixaLegacy + saidasFechamento + folhaFilter;

    const saldoCaixa = totalRecebido - totalDespesas;

    // 3. A Receber (Pendentes - Considera data de VENCIMENTO/ENTREGA dentro do filtro?)
    // Ou mostra TUDO pendente irrelevante do filtro?
    // Geralmente "A Receber" é snapshot atual. Mas se filtrar Julho, quer ver o que tinha pra receber em Julho?
    // Vamos filtrar por vencimento dentro do período selecionado.
    const conveniosPendentes = convenios
      .filter(c => c.statusPagamento !== 'pago' && checkDate(c.dataVencimento))
      .reduce((sum, c) => sum + c.valorBoleto, 0);

    const boletosPendentes = boletos
      .filter(b => b.statusPagamento !== 'pago' && checkDate(b.dataVencimento))
      .reduce((sum, b) => sum + b.valor, 0);

    const totalAReceber = conveniosPendentes + boletosPendentes;

    // 4. Receita Marmitas (Métrica Específica)
    // Filtrar marmitas pela Data de Entrega no período
    const receitaMarmitasStats = marmitas
      .filter(m => checkDate(m.dataEntrega))
      .reduce((sum, m) => sum + m.valorTotal, 0);

    return { totalRecebido, totalDespesas, saldoCaixa, totalAReceber, receitaMarmitasStats };

  }, [fechamentosCaixa, saidas, marmitas, caixaEntries, convenios, boletos, folhaPagamento, filterMonth, filterYear]);

  // Gráficos (Filtrados)
  const getLastDaysData = () => {
    // Se filtro for "Todos", mostra meses. Se for "Mês", mostra dias.
    // Simplificação: Manter gráfico de 7 dias, mas "quais 7 dias"?
    // Se o usuário filtrou um mês passado, mostrar "Vendas do Mês (Dia a Dia)".

    const result = [];
    const isMonthAll = filterMonth === 'all';

    if (isMonthAll) {
      // Mostrar barras por MÊS no Ano
      for (let i = 0; i < 12; i++) {
        // Calcular total do mês i
        const totalMonth = fechamentosCaixa
          .filter(f => {
            const d = new Date(f.data);
            return d.getFullYear() === filterYear && d.getMonth() === i;
          })
          .reduce((sum, f) => sum + ((f.entradas.dinheiro || 0) + (f.entradas.pix || 0) + (f.entradas.credito || 0) + (f.entradas.debito || 0) + (f.entradas.alimentacao || 0)), 0);

        result.push({
          label: new Date(filterYear, i, 1).toLocaleDateString('pt-BR', { month: 'short' }),
          value: totalMonth,
          color: totalMonth > 5000 ? '#10b981' : '#3b82f6'
        });
      }
    } else {
      // Mostrar dias do mês selecionado
      const targetMonth = parseInt(filterMonth);
      const daysInMonth = new Date(filterYear, targetMonth + 1, 0).getDate();

      // Agrupar por dia
      const dailyData: Record<number, number> = {};
      fechamentosCaixa.forEach(f => {
        const d = new Date(f.data);
        if (d.getFullYear() === filterYear && d.getMonth() === targetMonth) {
          const day = d.getDate();
          const total = (f.entradas.dinheiro || 0) + (f.entradas.pix || 0) + (f.entradas.credito || 0) + (f.entradas.debito || 0) + (f.entradas.alimentacao || 0);
          dailyData[day] = (dailyData[day] || 0) + total;
        }
      });

      for (let d = 1; d <= daysInMonth; d++) {
        // Otimização: Mostrar apenas dias com venda ou todos? Tabela bar chart fica gigante com 30 barras.
        // Mostrar todomundo, BarChart tem scroll.
        result.push({
          label: `${d}`,
          value: dailyData[d] || 0,
          color: (dailyData[d] || 0) > 500 ? '#10b981' : '#3b82f6'
        });
      }
    }
    return result;
  };

  const getExpensesData = () => {
    const fornMap: Record<string, number> = {};
    const isMonthAll = filterMonth === 'all';
    const targetMonth = parseInt(filterMonth);

    saidas.forEach(s => {
      const d = new Date(s.data);
      if (d.getFullYear() !== filterYear) return;
      if (!isMonthAll && d.getMonth() !== targetMonth) return;

      const label = s.fornecedor ? s.fornecedor : (s.categoria || 'Outros');
      fornMap[label] = (fornMap[label] || 0) + s.valor;
    });

    const colors = ['#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];
    return Object.entries(fornMap).map(([label, value], i) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value,
      color: colors[i % colors.length]
    })).sort((a, b) => b.value - a.value).slice(0, 5);
  };

  return (
    <div className="dashboard-container" style={{ paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Visão Geral
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Resumo financeiro. Utilize os filtros para analisar períodos específicos.
          </p>
        </div>
        {/* FILTROS */}
        <Filters month={filterMonth} year={filterYear} setMonth={setFilterMonth} setYear={setFilterYear} />
      </div>

      {/* BIG NUMBERS CARDS */}
      <div className="grid-dashboard">
        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Receita Total</h3>
            <div className="value">R$ {filteredStats.totalRecebido.toFixed(2)}</div>
            <p className="subtitle">No período selecionado</p>
          </div>
        </div>

        <div className="stat-card expenses">
          <div className="stat-icon">📉</div>
          <div className="stat-content">
            <h3>Despesas</h3>
            <div className="value">R$ {filteredStats.totalDespesas.toFixed(2)}</div>
            <p className="subtitle">No período selecionado</p>
          </div>
        </div>

        <div className="stat-card balance">
          <div className="stat-icon">⚖️</div>
          <div className="stat-content">
            <h3>Saldo Líquido</h3>
            <div className="value" style={{ color: filteredStats.saldoCaixa >= 0 ? 'var(--success-600)' : 'var(--danger-600)' }}>
              R$ {filteredStats.saldoCaixa.toFixed(2)}
            </div>
            <p className="subtitle">Receitas - Despesas</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>🍱</div>
          <div className="stat-content">
            <h3>Marmitas</h3>
            <div className="value">R$ {filteredStats.receitaMarmitasStats.toFixed(2)}</div>
            <p className="subtitle">Faturamento no período</p>
          </div>
        </div>
      </div>

      {/* CHARTS SECTIONS */}
      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        {/* Vendas */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>📊 Evolução de Receita</h3>
          </div>
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
            <BarChart data={getLastDaysData()} />
          </div>
        </div>

        {/* Despesas */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>🍩 Despesas por Fornecedor</h3>
          </div>
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
            <DonutChart data={getExpensesData()} />
          </div>
        </div>
      </div>

      {/* TABELA MARMITAS - FIXA POR ANO (pois a tabela ja separa por mes) */}
      <div style={{ marginTop: '2rem' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontStyle: 'italic' }}>
          * A tabela abaixo exibe o resumo anual de marmitas para o ano selecionado ({filterYear}).
        </p>
        <MarmitasRevenueTable marmitas={marmitas} year={filterYear} />
      </div>

    </div>
  );
}
