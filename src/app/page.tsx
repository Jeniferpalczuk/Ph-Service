'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="filters-container">
      <div className="filter-group">
        <label>📅 Mês</label>
        <select value={month} onChange={e => setMonth(e.target.value)}>
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>
      <div className="filter-group">
        <label>📆 Ano</label>
        <select value={year} onChange={e => setYear(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  );
};

// Modern Bar Chart with teal gradient bars and tooltip
const BarChart = ({ data, title }: { data: { label: string, value: number, color?: string }[], title?: string }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const height = 250;
  const barWidth = 38;
  const gap = 16;
  const width = Math.max(data.length * (barWidth + gap) + 60, 600);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Y-axis steps
  const ySteps = [0, 0.5, 1, 1.5, 2].map(k => Math.round(maxValue * k / 2));

  return (
    <div className="chart-container">
      {title && <div className="chart-title"><span style={{ color: '#0d9488', background: '#ccfbf1', padding: '8px', borderRadius: '10px' }}>📊</span> {title}</div>}
      <div className="chart-scroll" style={{ position: 'relative' }}>
        <svg width={width} height={height + 50} className="bar-chart-svg">
          <defs>
            <linearGradient id="barGradientTeal" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5eead4" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
            <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0d9488" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Y-axis labels and grid lines */}
          {ySteps.map((val, i) => {
            const y = height - (val / maxValue) * height + 10;
            return (
              <g key={i}>
                <line x1="45" y1={y} x2={width - 10} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                <text x="35" y={y + 4} textAnchor="end" style={{ fill: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>
                  {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                </text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const barHeight = Math.max((d.value / maxValue) * height, 6);
            const x = i * (barWidth + gap) + 55;
            const y = height - barHeight + 10;
            const isHovered = hoveredBar === i;
            return (
              <g
                key={i}
                className="bar-group"
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="url(#barGradientTeal)"
                  rx="6"
                  className="bar"
                  style={{
                    filter: isHovered ? 'url(#barShadow)' : 'none',
                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'all 0.2s ease'
                  }}
                />
                <text x={x + barWidth / 2} y={height + 35} textAnchor="middle" style={{ fill: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>
                  {d.label}
                </text>
                {d.value > 0 && (
                  <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" style={{ fill: '#1e293b', fontSize: '11px', fontWeight: 700 }}>
                    {d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value.toFixed(0)}
                  </text>
                )}

                {/* Tooltip */}
                {isHovered && (
                  <g>
                    <rect
                      x={x - 35}
                      y={y - 70}
                      width={110}
                      height={55}
                      rx="8"
                      fill="white"
                      stroke="#e2e8f0"
                      strokeWidth="1"
                      style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
                    />
                    <text x={x + barWidth / 2} y={y - 50} textAnchor="middle" style={{ fill: '#64748b', fontSize: '10px', fontWeight: 500 }}>
                      {data.length <= 12 ? `${d.label} ${new Date().getFullYear()}` : `Dia ${d.label}`}
                    </text>
                    <text x={x + barWidth / 2} y={y - 32} textAnchor="middle" style={{ fill: '#0f172a', fontSize: '13px', fontWeight: 800 }}>
                      R$ {d.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// Modern Donut Chart with side legend
const DonutChart = ({ data, title }: { data: { label: string, value: number, color: string }[], title?: string }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="chart-container">
        {title && <div className="chart-title">{title}</div>}
        <div className="empty-chart">
          <span className="empty-icon">📭</span>
          <p>Sem dados no período</p>
        </div>
      </div>
    );
  }

  let currentAngle = -90;
  const radius = 75;
  const cx = 90;
  const cy = 90;
  const strokeWidth = 22;

  return (
    <div className="chart-container donut-container">
      {title && <div className="chart-title"><span style={{ color: '#f59e0b', background: '#fffbeb', padding: '8px', borderRadius: '10px' }}>🍩</span> {title}</div>}
      <div className="donut-wrapper">
        <div className="donut-svg-container" style={{ position: 'relative', width: '180px', height: '180px' }}>
          <svg width="180" height="180" viewBox="0 0 180 180" className="donut-svg">
            {data.map((d, i) => {
              const angle = (d.value / total) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              currentAngle = endAngle;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;

              const x1 = cx + (radius) * Math.cos(startRad);
              const y1 = cy + (radius) * Math.sin(startRad);
              const x2 = cx + (radius) * Math.cos(endRad);
              const y2 = cy + (radius) * Math.sin(endRad);

              const largeArc = angle > 180 ? 1 : 0;

              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="butt"
                  className="donut-segment"
                />
              );
            })}
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total 100%</div>
          </div>
        </div>
        <div className="chart-legend" style={{ marginLeft: '1.5rem' }}>
          {data.map((d, i) => (
            <div key={i} className="legend-item" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="legend-dot" style={{ background: d.color, width: '10px', height: '10px' }}></span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>{d.label}</span>
              </div>
              <div style={{ paddingLeft: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{((d.value / total) * 100).toFixed(0)}%</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>R$ {d.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Area/Line Chart for trends
const TrendChart = ({ data }: { data: { label: string, value: number }[] }) => {
  const maxValue = Math.max(...data.map(d => d.value), 10);
  const roundedMax = Math.ceil(maxValue / 50) * 50 || 100;
  const width = 800;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1 || 1)) * (width - paddingX * 2);
    const y = height - paddingY - (d.value / roundedMax) * (height - paddingY * 2);
    return { x, y, ...d };
  });

  const pathD = points.length > 0 ? points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + (p.x - prev.x) / 3;
    const cpx2 = prev.x + (p.x - prev.x) * 2 / 3;
    return `${acc} C ${cpx1} ${prev.y}, ${cpx2} ${p.y}, ${p.x} ${p.y}`;
  }, '') : '';

  const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${paddingX} ${height - paddingY} Z` : '';

  // Grid lines (every 50 units)
  const gridLines = [];
  for (let val = 0; val <= roundedMax; val += 50) {
    gridLines.push(val);
  }

  return (
    <div className="trend-chart-wrapper" style={{ width: '100%', height: '100%' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="trend-svg">
        <defs>
          <linearGradient id="areaGradientBlue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGradientBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.2" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Y-Axis Grid Lines & Labels */}
        {gridLines.map(val => {
          const y = height - paddingY - (val / roundedMax) * (height - paddingY * 2);
          return (
            <g key={val}>
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray={val === 0 ? "0" : "5 5"} />
              <text x={paddingX - 10} y={y + 5} textAnchor="end" style={{ fill: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>{val}</text>
            </g>
          );
        })}

        {/* X-Axis Labels (Day numbers) */}
        {data.map((d, i) => {
          if (data.length > 15 && i % 2 !== 0 && i !== data.length - 1) return null;
          const x = paddingX + (i / (data.length - 1 || 1)) * (width - paddingX * 2);
          return (
            <text key={i} x={x} y={height - 5} textAnchor="middle" style={{ fill: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>
              {d.label}
            </text>
          );
        })}

        <path d={areaD} fill="url(#areaGradientBlue)" />
        <path d={pathD} fill="none" stroke="url(#lineGradientBlue)" strokeWidth="4" strokeLinecap="round" style={{ filter: 'url(#shadow)' }} />

        {/* Today/Max highlight line (matching image 12th day style) */}
        {points.length > 11 && (
          <g>
            <line x1={points[11].x} y1={paddingY} x2={points[11].x} y2={height - paddingY} stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
            <circle cx={points[11].x} cy={points[11].y} r="6" fill="#3b82f6" stroke="white" strokeWidth="2" />
          </g>
        )}

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="white"
            stroke="#3b82f6"
            strokeWidth="2"
            className="trend-dot"
            style={{ transition: 'all 0.3s ease' }}
          />
        ))}
      </svg>
    </div>
  );
};

// Multi-Line Chart for daily sales by type
const MultiLineChart = ({ dataByType, hoveredDay, setHoveredDay }: {
  dataByType: Record<string, { label: string, value: number }[]>,
  hoveredDay: number | null,
  setHoveredDay: (day: number | null) => void
}) => {
  const colors: Record<string, string> = {
    P: '#3b82f6',
    M: '#f59e0b',
    G: '#10b981',
    PF: '#ec4899'
  };

  const allValues = Object.values(dataByType).flat().map(d => d.value);
  const maxValue = Math.max(...allValues, 10);
  const roundedMax = Math.ceil(maxValue / 20) * 20 || 100;
  const width = 600;
  const height = 180;
  const paddingX = 30;
  const paddingY = 20;

  const getPoints = (data: { label: string, value: number }[]) => {
    if (!data || data.length === 0) return [];
    return data.map((d, i) => {
      const x = paddingX + (i / (data.length - 1 || 1)) * (width - paddingX * 2);
      const y = height - paddingY - (d.value / roundedMax) * (height - paddingY * 2);
      return { x, y, ...d };
    });
  };

  const createPath = (points: { x: number, y: number }[]) => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cpx1 = prev.x + (p.x - prev.x) / 3;
      const cpx2 = prev.x + (p.x - prev.x) * 2 / 3;
      return `${acc} C ${cpx1} ${prev.y}, ${cpx2} ${p.y}, ${p.x} ${p.y}`;
    }, '');
  };

  // Grid lines
  const gridLines = [0, 25, 50, 75, 100].map(p => Math.round(roundedMax * p / 100));

  // Get tooltip data
  const totalData = dataByType.total || [];
  const pData = dataByType.P || [];
  const mData = dataByType.M || [];
  const gData = dataByType.G || [];
  const pfData = dataByType.PF || [];

  return (
    <div className="multi-line-chart-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          {Object.entries(colors).map(([key, color]) => (
            <linearGradient key={key} id={`lineGradient${key}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          ))}
        </defs>

        {/* Grid lines */}
        {gridLines.map((val, i) => {
          const y = height - paddingY - (val / roundedMax) * (height - paddingY * 2);
          return (
            <g key={i}>
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={paddingX - 8} y={y + 4} textAnchor="end" style={{ fill: '#94a3b8', fontSize: '9px', fontWeight: 600 }}>{val}</text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {totalData.map((d, i) => {
          if (totalData.length > 15 && i % 2 !== 0) return null;
          const x = paddingX + (i / (totalData.length - 1 || 1)) * (width - paddingX * 2);
          return (
            <text key={i} x={x} y={height - 2} textAnchor="middle" style={{ fill: '#94a3b8', fontSize: '9px', fontWeight: 600 }}>
              {d.label}
            </text>
          );
        })}

        {/* Lines for each type */}
        {['PF', 'G', 'M', 'P'].map(type => {
          const points = getPoints(dataByType[type] || []);
          const path = createPath(points);
          return (
            <g key={type}>
              <path
                d={path}
                fill="none"
                stroke={colors[type]}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.9"
              />
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  fill="white"
                  stroke={colors[type]}
                  strokeWidth="1.5"
                  style={{
                    opacity: hoveredDay === i ? 1 : 0.7,
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </g>
          );
        })}

        {/* Invisible hover areas for tooltip */}
        {totalData.map((_, i) => {
          const x = paddingX + (i / (totalData.length - 1 || 1)) * (width - paddingX * 2);
          return (
            <rect
              key={i}
              x={x - 10}
              y={paddingY}
              width={20}
              height={height - paddingY * 2}
              fill="transparent"
              onMouseEnter={() => setHoveredDay(i)}
              onMouseLeave={() => setHoveredDay(null)}
              style={{ cursor: 'pointer' }}
            />
          );
        })}

        {/* Tooltip */}
        {hoveredDay !== null && totalData[hoveredDay] && (
          <g>
            {/* Vertical line */}
            <line
              x1={paddingX + (hoveredDay / (totalData.length - 1 || 1)) * (width - paddingX * 2)}
              y1={paddingY}
              x2={paddingX + (hoveredDay / (totalData.length - 1 || 1)) * (width - paddingX * 2)}
              y2={height - paddingY}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.5"
            />
            {/* Tooltip box */}
            <g transform={`translate(${Math.min(paddingX + (hoveredDay / (totalData.length - 1 || 1)) * (width - paddingX * 2) - 60, width - 150)}, 10)`}>
              <rect
                x="0"
                y="0"
                width="130"
                height="95"
                rx="8"
                fill="white"
                stroke="#e2e8f0"
                strokeWidth="1"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' }}
              />
              <text x="10" y="18" style={{ fill: '#64748b', fontSize: '10px', fontWeight: 600 }}>
                {totalData[hoveredDay].label} Dezembro 2025
              </text>
              <text x="10" y="34" style={{ fill: '#0f172a', fontSize: '12px', fontWeight: 800 }}>
                {totalData[hoveredDay].value} Total
              </text>
              <text x="10" y="50" style={{ fill: colors.P, fontSize: '10px', fontWeight: 600 }}>
                ● Marmita P: {pData[hoveredDay]?.value || 0} vendas
              </text>
              <text x="10" y="64" style={{ fill: colors.M, fontSize: '10px', fontWeight: 600 }}>
                ● Marmita M: {mData[hoveredDay]?.value || 0} vendas
              </text>
              <text x="10" y="78" style={{ fill: colors.G, fontSize: '10px', fontWeight: 600 }}>
                ● Marmita G: {gData[hoveredDay]?.value || 0} vendas
              </text>
              <text x="10" y="92" style={{ fill: colors.PF, fontSize: '10px', fontWeight: 600 }}>
                ● Prato Feito: {pfData[hoveredDay]?.value || 0} vendas
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};

// Progress Ring Component
const ProgressRing = ({ value, maxValue, label, color, icon }: { value: number, maxValue: number, label: string, color: string, icon: string }) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="progress-ring-card glass-card">
      <div className="progress-ring-container">
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle
            cx="45"
            cy="45"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 45 45)"
            className="progress-circle"
          />
        </svg>
        <span className="progress-icon">{icon}</span>
      </div>
      <div className="progress-info">
        <div className="progress-label">{label}</div>
        <div className="progress-value" style={{ color }}>{percentage.toFixed(0)}%</div>
      </div>
    </div>
  );
};

// Modern Stat Card
const StatCard = ({ icon, label, value, trend, trendValue, colorClass, iconBg, extraInfo }: {
  icon: string, label: string, value: string, trend: 'pos' | 'neg', trendValue: string, colorClass: string, iconBg: string, extraInfo?: { label1: string, value1: string | number, label2?: string, value2?: string | number }
}) => (
  <div className={`stat-card glass-card ${colorClass}`}>
    <div className={`stat-icon-wrapper ${iconBg}`}>{icon}</div>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
    {extraInfo ? (
      <div className="stat-extra-info">
        <div className="extra-item">
          <span className="extra-icon">📦</span>
          <span>{extraInfo.value1} {extraInfo.label1}</span>
        </div>
        {extraInfo.label2 && (
          <div className="extra-item">
            <span className="extra-icon">🎫</span>
            <span>{extraInfo.label2}: {extraInfo.value2}</span>
          </div>
        )}
      </div>
    ) : (
      <div className={`stat-trend ${trend === 'pos' ? 'positive' : 'negative'}`}>
        {trend === 'pos' ? '▲' : '▼'} {trendValue} <span style={{ color: '#64748b', fontWeight: 400 }}>vs mês anterior</span>
      </div>
    )}
  </div>
);

const MarmitasDashboard = ({ marmitas, year, month, filterTamanho, setFilterTamanho, setFilterMonth, setFilterYear }: { marmitas: any[], year: number, month: string, filterTamanho: string, setFilterTamanho: (val: string) => void, setFilterMonth: (val: string) => void, setFilterYear: (val: number) => void }) => {
  const isMonthAll = month === 'all';
  const targetMonth = parseInt(month);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const tamanhos = [
    { value: 'all', label: 'Todos os Tamanhos' },
    { value: 'P', label: 'Marmita P' },
    { value: 'M', label: 'Marmita M' },
    { value: 'G', label: 'Marmita G' },
    { value: 'PF', label: 'Prato Feito' }
  ];

  // 1. Calculate Monthly Summary Stats
  const stats = useMemo(() => {
    const currentItems = marmitas.filter(m => {
      const d = new Date(m.dataEntrega);
      const matchDate = d.getFullYear() === year && (isMonthAll || d.getMonth() === targetMonth);
      if (!matchDate) return false;

      if (filterTamanho === 'all') return true;
      const t = m.tamanho.trim().toUpperCase();
      if (filterTamanho === 'P') return ['P', 'PEQUENA'].includes(t);
      if (filterTamanho === 'M') return ['M', 'MEDIA', 'MÉDIA'].includes(t);
      if (filterTamanho === 'G') return ['G', 'GRANDE'].includes(t);
      if (filterTamanho === 'PF') return ['PF', 'PRATO FEITO', 'PRATOFEITO'].includes(t);
      return false;
    });

    const lastMonthItems = marmitas.filter(m => {
      const d = new Date(m.dataEntrega);
      let matchDate = false;
      if (isMonthAll) {
        matchDate = d.getFullYear() === year - 1;
      } else {
        const prevM = targetMonth === 0 ? 11 : targetMonth - 1;
        const prevY = targetMonth === 0 ? year - 1 : year;
        matchDate = d.getFullYear() === prevY && d.getMonth() === prevM;
      }
      if (!matchDate) return false;

      if (filterTamanho === 'all') return true;
      const t = m.tamanho.trim().toUpperCase();
      if (filterTamanho === 'P') return ['P', 'PEQUENA'].includes(t);
      if (filterTamanho === 'M') return ['M', 'MEDIA', 'MÉDIA'].includes(t);
      if (filterTamanho === 'G') return ['G', 'GRANDE'].includes(t);
      if (filterTamanho === 'PF') return ['PF', 'PRATO FEITO', 'PRATOFEITO'].includes(t);
      return false;
    });

    const revenue = currentItems.reduce((sum, m) => sum + m.valorTotal, 0);
    const qty = currentItems.reduce((sum, m) => sum + (m.quantidade || 1), 0);
    const avgTicket = qty > 0 ? revenue / qty : 0;

    const prevRevenue = lastMonthItems.reduce((sum, m) => sum + m.valorTotal, 0);
    const growth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : (revenue > 0 ? 100 : 0);

    // Type Distribution (by Revenue)
    const dist: Record<string, number> = { P: 0, M: 0, G: 0, PF: 0 };
    currentItems.forEach(m => {
      const t = m.tamanho.trim().toUpperCase();
      if (['P', 'PEQUENA'].includes(t)) dist.P += m.valorTotal;
      else if (['M', 'MEDIA', 'MÉDIA'].includes(t)) dist.M += m.valorTotal;
      else if (['G', 'GRANDE'].includes(t)) dist.G += m.valorTotal;
      else if (['PF', 'PRATO FEITO', 'PRATOFEITO'].includes(t)) dist.PF += m.valorTotal;
    });

    const totalDist = Object.values(dist).reduce((s, v) => s + v, 0);
    const distPerc = {
      P: totalDist > 0 ? (dist.P / totalDist) * 100 : 0,
      M: totalDist > 0 ? (dist.M / totalDist) * 100 : 0,
      G: totalDist > 0 ? (dist.G / totalDist) * 100 : 0,
      PF: totalDist > 0 ? (dist.PF / totalDist) * 100 : 0,
    };

    return { revenue, qty, avgTicket, growth, distPerc };
  }, [marmitas, year, month, filterTamanho]);

  // 2. Annual Accumulation Data (for top-right chart)
  const annualData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      label: new Date(year, i, 1).toLocaleDateString('pt-BR', { month: 'short' }),
      qty: 0,
      revenue: 0
    }));

    marmitas.forEach(m => {
      const d = new Date(m.dataEntrega);
      if (d.getFullYear() === year) {
        const mIdx = d.getMonth();
        const t = m.tamanho.trim().toUpperCase();
        let matchT = filterTamanho === 'all';
        if (!matchT) {
          if (filterTamanho === 'P') matchT = ['P', 'PEQUENA'].includes(t);
          else if (filterTamanho === 'M') matchT = ['M', 'MEDIA', 'MÉDIA'].includes(t);
          else if (filterTamanho === 'G') matchT = ['G', 'GRANDE'].includes(t);
          else if (filterTamanho === 'PF') matchT = ['PF', 'PRATO FEITO', 'PRATOFEITO'].includes(t);
        }

        if (matchT) {
          data[mIdx].qty += (m.quantidade || 1);
          data[mIdx].revenue += m.valorTotal;
        }
      }
    });

    return data;
  }, [marmitas, year, filterTamanho]);

  // 3. Daily Trend Data by type (for bottom-left multi-line chart)
  const dailyDataByType = useMemo(() => {
    if (isMonthAll) return { P: [], M: [], G: [], PF: [], total: [] };

    const daysInMonth = new Date(year, targetMonth + 1, 0).getDate();
    const types = ['P', 'M', 'G', 'PF', 'total'] as const;
    const data: Record<string, { label: string, value: number }[]> = {};

    types.forEach(type => {
      data[type] = Array.from({ length: daysInMonth }, (_, i) => ({ label: `${i + 1}`, value: 0 }));
    });

    marmitas.forEach(m => {
      const d = new Date(m.dataEntrega);
      if (d.getFullYear() === year && d.getMonth() === targetMonth) {
        const t = m.tamanho.trim().toUpperCase();
        const qty = m.quantidade || 1;
        const dayIndex = d.getDate() - 1;

        data.total[dayIndex].value += qty;

        if (['P', 'PEQUENA'].includes(t)) data.P[dayIndex].value += qty;
        else if (['M', 'MEDIA', 'MÉDIA'].includes(t)) data.M[dayIndex].value += qty;
        else if (['G', 'GRANDE'].includes(t)) data.G[dayIndex].value += qty;
        else if (['PF', 'PRATO FEITO', 'PRATOFEITO'].includes(t)) data.PF[dayIndex].value += qty;
      }
    });

    return data;
  }, [marmitas, year, month]);

  // Keep dailyData for backward compatibility
  const dailyData = useMemo(() => {
    if (isMonthAll) return [];
    return dailyDataByType.total || [];
  }, [dailyDataByType, isMonthAll]);

  return (
    <div className="marmitas-dashboard-section">
      {/* Header with Month/Year Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Vendas de Marmitas</h2>
          <div style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 500, marginTop: '4px' }}>Desempenho detalhado do setor</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>📅 Mês</span>
            <select
              value={month}
              onChange={(e) => setFilterMonth(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 600, background: 'white', cursor: 'pointer' }}
            >
              <option value="all">Todos</option>
              <option value="0">Janeiro</option>
              <option value="1">Fevereiro</option>
              <option value="2">Março</option>
              <option value="3">Abril</option>
              <option value="4">Maio</option>
              <option value="5">Junho</option>
              <option value="6">Julho</option>
              <option value="7">Agosto</option>
              <option value="8">Setembro</option>
              <option value="9">Outubro</option>
              <option value="10">Novembro</option>
              <option value="11">Dezembro</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>📆 Ano</span>
            <select
              value={year}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 600, background: 'white', cursor: 'pointer' }}
            >
              {[2023, 2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Row - 3 cards + Acumulado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.3fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Unidades Vendidas */}
        <div className="marmitas-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Unidades Vendidas</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{stats.qty.toLocaleString('pt-BR')} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 600 }}>un</span></div>
          <div className={`m-stat-trend ${stats.growth >= 0 ? 'positive' : 'negative'}`} style={{ marginTop: '0.5rem' }}>
            {stats.growth >= 0 ? '▲' : '▼'} {Math.abs(stats.growth).toFixed(0)}% <span style={{ color: '#94a3b8', fontWeight: 500 }}>vs mês anterior</span>
          </div>
        </div>

        {/* Faturamento */}
        <div className="marmitas-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Faturamento</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div className={`m-stat-trend ${stats.growth >= 0 ? 'positive' : 'negative'}`} style={{ marginTop: '0.5rem' }}>
            {stats.growth >= 0 ? '▲' : '▼'} {Math.abs(stats.growth).toFixed(0)}% <span style={{ color: '#94a3b8', fontWeight: 500 }}>vs mês anterior</span>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="marmitas-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Ticket Médio</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>R$ {stats.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>

        {/* Acumulado do Ano */}
        <div className="marmitas-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Acumulado do Ano <span style={{ fontWeight: 400 }}>({year})</span></div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Total Vendido</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>{annualData.reduce((s, d) => s + d.qty, 0).toLocaleString('pt-BR')} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>un</span></div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Faturamento Anual</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>R$ {annualData.reduce((s, d) => s + d.revenue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
          {/* Mini chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginTop: '0.75rem', height: '40px' }}>
            {annualData.map((d, i) => {
              const maxQty = Math.max(...annualData.map(x => x.qty), 1);
              const h = Math.max((d.qty / maxQty) * 100, 4);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '100%',
                    height: `${h}%`,
                    background: i <= targetMonth ? '#dbeafe' : '#f1f5f9',
                    borderRadius: '2px',
                    minHeight: '2px'
                  }} />
                  <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: '2px' }}>
                    {['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'][i]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid de gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>

        {/* BOTTOM LEFT: Monthly Multi-Line Chart */}
        <div className="marmitas-card">
          <div className="m-card-header">
            <div className="m-card-title">Vendas Diárias</div>
            {!isMonthAll && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748b' }}>
                <span style={{ fontWeight: 600 }}>{dailyDataByType.total?.reduce((s, d) => s + d.value, 0) || 0}</span>
                <span>Total</span>
              </div>
            )}
          </div>
          <div style={{ height: '200px', position: 'relative' }}>
            {isMonthAll ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                Selecione um mês para ver a evolução diária
              </div>
            ) : (
              <MultiLineChart
                dataByType={dailyDataByType}
                hoveredDay={hoveredDay}
                setHoveredDay={setHoveredDay}
              />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', marginTop: '1rem', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#3b82f6' }}></span>
              <span>Marmita P</span>
              <span style={{ color: '#94a3b8', fontWeight: 500, marginLeft: '2px' }}>{dailyDataByType.P?.reduce((s, d) => s + d.value, 0) || 0} vendas</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#f59e0b' }}></span>
              <span>Marmita M</span>
              <span style={{ color: '#94a3b8', fontWeight: 500, marginLeft: '2px' }}>{dailyDataByType.M?.reduce((s, d) => s + d.value, 0) || 0} vendas</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10b981' }}></span>
              <span>Marmita G</span>
              <span style={{ color: '#94a3b8', fontWeight: 500, marginLeft: '2px' }}>{dailyDataByType.G?.reduce((s, d) => s + d.value, 0) || 0} vendas</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#ec4899' }}></span>
              <span>Prato Feito</span>
              <span style={{ color: '#94a3b8', fontWeight: 500, marginLeft: '2px' }}>{dailyDataByType.PF?.reduce((s, d) => s + d.value, 0) || 0} vendas</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Distribution & Insights */}
        <div>
          {/* Distribuição por Tipo */}
          <div className="marmitas-card" style={{ marginBottom: '1rem' }}>
            <div className="m-card-header">
              <div className="m-card-title">Distribuição por Tipo</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Marmita M */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '80px', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Marmita M</div>
                <div style={{ flex: 1, height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${stats.distPerc.M}%`, height: '100%', background: '#3b82f6', borderRadius: '6px' }} />
                </div>
                <div style={{ width: '50px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>{stats.distPerc.M.toFixed(0)}%</div>
                <div style={{ width: '40px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>{Math.round(stats.qty * stats.distPerc.M / 100)}</div>
              </div>
              {/* Marmita P */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '80px', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Marmita P</div>
                <div style={{ flex: 1, height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${stats.distPerc.P}%`, height: '100%', background: '#10b981', borderRadius: '6px' }} />
                </div>
                <div style={{ width: '50px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>{stats.distPerc.P.toFixed(0)}%</div>
                <div style={{ width: '40px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>{Math.round(stats.qty * stats.distPerc.P / 100)}</div>
              </div>
              {/* Marmita G */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '80px', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Marmita G</div>
                <div style={{ flex: 1, height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${stats.distPerc.G}%`, height: '100%', background: '#10b981', borderRadius: '6px' }} />
                </div>
                <div style={{ width: '50px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>{stats.distPerc.G.toFixed(0)}%</div>
                <div style={{ width: '40px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>{Math.round(stats.qty * stats.distPerc.G / 100)}</div>
              </div>
              {/* Prato Feito */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '80px', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Prato Feito</div>
                <div style={{ flex: 1, height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${stats.distPerc.PF}%`, height: '100%', background: '#10b981', borderRadius: '6px' }} />
                </div>
                <div style={{ width: '50px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>{stats.distPerc.PF.toFixed(0)}%</div>
                <div style={{ width: '40px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>{Math.round(stats.qty * stats.distPerc.PF / 100)}</div>
              </div>
            </div>
          </div>

          {/* Vendas mais dias - Insights */}
          <div className="marmitas-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '2px' }}></span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Vendas mais dias</span>
            </div>
            <ul className="m-insights-list">
              <li>Sexta-feira é o dia com <b>maior volume</b> de vendas</li>
              <li>Marmita <b>M</b> representa a maior parte da receita</li>
              <li>Crescimento de <b>+{stats.growth.toFixed(0)}%</b> em relação ao período anterior</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- PAGE COMPONENT ---

export default function Dashboard() {
  const {
    fechamentosCaixa, saidas, marmitas, caixaEntries,
    convenios, boletos, vales, outrosServicos, folhaPagamento,
    funcionarios, clientes
  } = useApp();

  const [filterMonth, setFilterMonth] = useState(new Date().getMonth().toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterTamanho, setFilterTamanho] = useState('all');

  const filteredStats = useMemo(() => {
    const isMonthAll = filterMonth === 'all';
    const targetMonth = parseInt(filterMonth);

    const checkDate = (dateStr: string | Date | undefined) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (d.getFullYear() !== filterYear) return false;
      if (!isMonthAll && d.getMonth() !== targetMonth) return false;
      return true;
    };

    const entradasCaixaLegacy = caixaEntries
      .filter(e => e.tipo === 'entrada' && checkDate(e.data))
      .reduce((sum, e) => sum + e.valor, 0);

    const faturamentoFechamento = fechamentosCaixa
      .filter(f => checkDate(f.data))
      .reduce((sum, f) => {
        const total = (f.entradas.dinheiro || 0) + (f.entradas.pix || 0) +
          (f.entradas.credito || 0) + (f.entradas.debito || 0) + (f.entradas.alimentacao || 0);
        return sum + total;
      }, 0);

    // Filter marmitas by size if needed for the revenue stats
    const marmitasParaCalc = filterTamanho === 'all'
      ? marmitas
      : marmitas.filter(m => {
        const t = m.tamanho.trim().toUpperCase();
        if (filterTamanho === 'P') return ['P', 'PEQUENA'].includes(t);
        if (filterTamanho === 'M') return ['M', 'MEDIA', 'MÉDIA'].includes(t);
        if (filterTamanho === 'G') return ['G', 'GRANDE'].includes(t);
        if (filterTamanho === 'PF') return ['PF', 'PRATO FEITO', 'PRATOFEITO'].includes(t);
        return false;
      });

    const receitaMarmitasStats = marmitasParaCalc
      .filter(m => checkDate(m.dataEntrega))
      .reduce((sum, m) => sum + m.valorTotal, 0);

    // Requested change: Faturamento = Todos os pagamentos (Caixa + Cartão + Alimentação + Pix)
    const faturamentoTotal = faturamentoFechamento + entradasCaixaLegacy;

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

    const saldoCaixa = faturamentoTotal - totalDespesas;

    // Convenios stats
    const conveniosFiltrados = convenios.filter(c => checkDate(c.dataVencimento));
    const conveniosTotal = conveniosFiltrados.reduce((sum, c) => sum + c.valorBoleto, 0);
    const conveniosCount = conveniosFiltrados.length;
    const conveniosTicketMedio = conveniosCount > 0 ? conveniosTotal / conveniosCount : 0;

    const conveniosPendentes = convenios
      .filter(c => c.statusPagamento !== 'pago' && checkDate(c.dataVencimento))
      .reduce((sum, c) => sum + c.valorBoleto, 0);

    const boletosPendentes = boletos
      .filter(b => b.statusPagamento !== 'pago' && checkDate(b.dataVencimento))
      .reduce((sum, b) => sum + b.valor, 0);

    const totalAReceber = conveniosPendentes + boletosPendentes;

    const valesAbertos = vales
      .filter(v => v.status !== 'quitado')
      .reduce((sum, v) => sum + (v.valor - (v.valorPago || 0)), 0);

    return { faturamentoTotal, totalDespesas, saldoCaixa, totalAReceber, receitaMarmitasStats, folhaFilter, valesAbertos, conveniosTotal, conveniosCount, conveniosTicketMedio };

  }, [fechamentosCaixa, saidas, marmitas, caixaEntries, convenios, boletos, folhaPagamento, vales, filterMonth, filterYear, filterTamanho]);

  const getRevenueData = () => {
    const result = [];
    const isMonthAll = filterMonth === 'all';
    const targetMonth = parseInt(filterMonth);

    if (isMonthAll) {
      for (let i = 0; i < 12; i++) {
        const totalMonth = fechamentosCaixa
          .filter(f => {
            const d = new Date(f.data);
            return d.getFullYear() === filterYear && d.getMonth() === i;
          })
          .reduce((sum, f) => sum + ((f.entradas.dinheiro || 0) + (f.entradas.pix || 0) + (f.entradas.credito || 0) + (f.entradas.debito || 0) + (f.entradas.alimentacao || 0)), 0);

        result.push({
          label: new Date(filterYear, i, 1).toLocaleDateString('pt-BR', { month: 'short' }),
          value: totalMonth
        });
      }
    } else {
      const daysInMonth = new Date(filterYear, targetMonth + 1, 0).getDate();
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
        result.push({ label: `${d}`, value: dailyData[d] || 0 });
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

    const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
    return Object.entries(fornMap).map(([label, value], i) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value,
      color: colors[i % colors.length]
    })).sort((a, b) => b.value - a.value).slice(0, 6);
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1>Visão Geral</h1>
            <p>Resumo financeiro. Utilize os filtros para analisar períodos específicos.</p>
          </div>
          <Filters
            month={filterMonth}
            year={filterYear}
            setMonth={setFilterMonth}
            setYear={setFilterYear}
          />
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          icon="📈"
          label="Faturamento"
          value={formatCurrency(filteredStats.faturamentoTotal)}
          trend="pos"
          trendValue="12.5%"
          colorClass="revenue"
          iconBg="revenue"
        />
        <StatCard
          icon="📉"
          label="Despesas Totais"
          value={formatCurrency(filteredStats.totalDespesas)}
          trend="neg"
          trendValue="8.9%"
          colorClass="expenses"
          iconBg="expenses"
        />
        <StatCard
          icon="📦"
          label="Saldo em Caixa"
          value={formatCurrency(filteredStats.saldoCaixa)}
          trend="pos"
          trendValue="18.2%"
          colorClass="total-receita"
          iconBg="total-receita"
        />
        <StatCard
          icon="🍱"
          label="Venda de Marmitas"
          value={formatCurrency(filteredStats.receitaMarmitasStats)}
          trend="neg"
          trendValue="3.2%"
          colorClass="marmitas"
          iconBg="marmitas"
        />
        <StatCard
          icon="🎟️"
          label="Convênios"
          value={formatCurrency(filteredStats.conveniosTotal)}
          trend="pos"
          trendValue="0%"
          colorClass="convenios"
          iconBg="convenios"
          extraInfo={{
            label1: 'pedidos no mês',
            value1: filteredStats.conveniosCount,
            label2: 'Ticket médio',
            value2: formatCurrency(filteredStats.conveniosTicketMedio)
          }}
        />
      </div>

      {/* Charts Section */}
      <div className="charts-section" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="chart-card glass-card span-2">
          <BarChart data={getRevenueData()} title="Evolução de Receita" />
        </div>

        <div className="chart-card glass-card">
          <DonutChart data={getExpensesData()} title="Despesas por Fornecedor" />
        </div>
      </div>

      {/* Marmitas Dashboard */}
      <MarmitasDashboard
        marmitas={marmitas}
        year={filterYear}
        month={filterMonth}
        filterTamanho={filterTamanho}
        setFilterTamanho={setFilterTamanho}
        setFilterMonth={setFilterMonth}
        setFilterYear={setFilterYear}
      />
    </div >
  );
}
