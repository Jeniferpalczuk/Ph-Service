'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Marmita } from '@/types';
import {
    useMarmitasList,
    useCreateMarmita,
    useCreateMarmitasLote,
    useUpdateMarmita,
    useDeleteMarmita
} from '@/hooks/financeiro/useMarmitas';
import { useClientesDropdown } from '@/hooks/cadastros/useDropdown';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'react-hot-toast';
import {
    LuPlus,
    LuUtensils,
    LuPencil,
    LuTrash2,
    LuX,
    LuShoppingBag,
    LuCalendar,
    LuTrendingUp,
    LuCircleCheck
} from 'react-icons/lu';
import '../shared-modern.css';

export default function MarmitasPage() {
    const { user } = useAuth();

    // Hooks de React Query
    // Filter States
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const createLoteMutation = useCreateMarmitasLote();
    const updateMutation = useUpdateMarmita();
    const deleteMutation = useDeleteMarmita();

    // Clientes dropdown for selecting cliente
    const { data: clientesDD } = useClientesDropdown();
    const clientes = clientesDD ?? [];

    // Fetch Marmitas via React Query
    const lastDay = new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]), 0).getDate().toString().padStart(2, '0');
    const { data: marmitasData, isLoading, isError, error } = useMarmitasList({
        pageSize: 200, // ~30 dias * 4 tamanhos = max ~120 registros/mês
        startDate: `${selectedMonth}-01`,
        endDate: `${selectedMonth}-${lastDay}`
    });

    // Meses para seleção
    const monthOptions = useMemo(() => {
        const months = [];
        const now = new Date();
        for (let i = 0; i < 24; i++) { // Go back 2 years
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            });
        }
        return months;
    }, []);

    const marmitas = marmitasData?.data ?? [];

    const [showModal, setShowModal] = useState(false);

    // Detalhes do Dia
    const [selectedDateDetails, setSelectedDateDetails] = useState<string | null>(null);

    // Edição Individual
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Marmita | null>(null);
    const [editData, setEditData] = useState({ cliente: '', qtd: '', valorUnitario: '', valorTotal: '', dataEntrega: '' });

    // Form State (Lançamento Diário)
    const [formData, setFormData] = useState({
        cliente: '',
        dataEntrega: new Date().toISOString().split('T')[0],
        qtdP: '', unitP: '', totalP: '',
        qtdM: '', unitM: '', totalM: '',
        qtdG: '', unitG: '', totalG: '',
        qtdPF: '', unitPF: '', totalPF: ''
    });

    const resetForm = () => {
        setFormData(prev => ({
            ...prev,
            cliente: '',
            qtdP: '', unitP: '', totalP: '',
            qtdM: '', unitM: '', totalM: '',
            qtdG: '', unitG: '', totalG: '',
            qtdPF: '', unitPF: '', totalPF: ''
        }));
        setShowModal(false);
    };

    const calcTotal = (qtd: string, unit: string) => {
        const q = parseFloat(qtd);
        const u = parseFloat(unit);
        if (!isNaN(q) && !isNaN(u)) return (q * u).toFixed(2);
        return '';
    };

    const handleCalcChange = (field: string, value: string, type: 'P' | 'M' | 'G' | 'PF') => {
        const prev = { ...formData };
        // @ts-ignore
        prev[`${field}${type}`] = value;
        const qKey = `qtd${type}`;
        const uKey = `unit${type}`;
        const tKey = `total${type}`;
        // @ts-ignore
        const q = prev[qKey];
        // @ts-ignore
        const u = prev[uKey];
        // @ts-ignore
        prev[tKey] = calcTotal(q, u);
        setFormData(prev);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const [y, m, d] = formData.dataEntrega.split('-').map(Number);
        const dataRef = new Date(y, m - 1, d, 12, 0, 0);

        const sizes = [
            { key: 'P' as const, label: 'Pequena', qtd: formData.qtdP, unit: formData.unitP, total: formData.totalP },
            { key: 'M' as const, label: 'Média', qtd: formData.qtdM, unit: formData.unitM, total: formData.totalM },
            { key: 'G' as const, label: 'Grande', qtd: formData.qtdG, unit: formData.unitG, total: formData.totalG },
            { key: 'PF' as const, label: 'Prato Feito', qtd: formData.qtdPF, unit: formData.unitPF, total: formData.totalPF },
        ];

        const marmitasParaInserir = sizes
            .filter(size => (parseInt(size.qtd) || 0) > 0)
            .map(size => ({
                tamanho: size.key,
                quantidade: parseInt(size.qtd),
                valorUnitario: parseFloat(size.unit) || 0,
                valorTotal: parseFloat(size.total) || 0,
            }));

        if (!formData.cliente) {
            toast.error('Selecione um cliente');
            return;
        }
        if (marmitasParaInserir.length === 0) {
            toast.error('Preencha ao menos uma quantidade.');
            return;
        }

        try {
            await createLoteMutation.mutateAsync({
                dataEntrega: dataRef,
                cliente: formData.cliente || '',
                marmitas: marmitasParaInserir
            });
            toast.success('Lançamento realizado com sucesso!');
            resetForm();
        } catch (err) {
            console.error(err);
            toast.error('Erro ao salvar lançamento.');
        }
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (window.confirm('Excluir este lançamento permanentemente?')) {
            try {
                await deleteMutation.mutateAsync(id);
                toast.success('Lançamento excluído!');
            } catch (err) {
                toast.error('Erro ao excluir lançamento.');
            }
        }
    };

    const dailySummary = useMemo(() => {
        const summary: Record<string, { dateObj: Date, P: number, M: number, G: number, PF: number, totalFin: number, items: Marmita[] }> = {};
        marmitas.forEach(m => {
            const d = new Date(m.dataEntrega);
            const dateKey = d.toLocaleDateString('pt-BR');
            if (!summary[dateKey]) {
                summary[dateKey] = { dateObj: d, P: 0, M: 0, G: 0, PF: 0, totalFin: 0, items: [] };
            }
            summary[dateKey].items.push(m);
            summary[dateKey].totalFin += m.valorTotal;
            const qtd = m.quantidade || 1;
            const t = m.tamanho;
            if (['P', 'Pequena'].includes(t)) summary[dateKey].P += qtd;
            else if (['M', 'Media', 'Média'].includes(t)) summary[dateKey].M += qtd;
            else if (['G', 'Grande'].includes(t)) summary[dateKey].G += qtd;
            else if (['PF', 'Prato Feito'].includes(t)) summary[dateKey].PF += qtd;
        });
        return summary;
    }, [marmitas]);

    const handleDeleteGroup = async (dateString: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (window.confirm(`Tem certeza que deseja excluir TODOS os lançamentos do dia ${dateString}? Esta ação não pode ser desfeita.`)) {
            const itemsToDelete = dailySummary[dateString]?.items || [];
            try {
                await Promise.all(itemsToDelete.map(item => deleteMutation.mutateAsync(item.id)));
                toast.success('Lançamentos do dia excluídos!');
                setSelectedDateDetails(null);
            } catch (err) {
                toast.error('Erro ao excluir lançamentos do dia.');
            }
        }
    };

    const openEditModal = (item: Marmita) => {
        setEditingItem(item);
        setEditData({
            cliente: item.cliente || '',
            qtd: item.quantidade ? item.quantidade.toString() : '1',
            valorUnitario: item.valorUnitario ? item.valorUnitario.toString() : '',
            valorTotal: item.valorTotal.toString(),
            dataEntrega: new Date(item.dataEntrega).toISOString().split('T')[0]
        });
        setShowEditModal(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            try {
                const [y, m, d] = editData.dataEntrega.split('-').map(Number);
                const newData = new Date(y, m - 1, d, 12, 0, 0);

                await updateMutation.mutateAsync({
                    id: editingItem.id,
                    updates: {
                        cliente: editData.cliente,
                        quantidade: parseInt(editData.qtd),
                        valorUnitario: parseFloat(editData.valorUnitario),
                        valorTotal: parseFloat(editData.valorTotal),
                        dataEntrega: newData
                    }
                });
                toast.success('Lançamento atualizado!');
                setShowEditModal(false);
                setEditingItem(null);
                setSelectedDateDetails(null);
            } catch (err) {
                toast.error('Erro ao atualizar lançamento.');
            }
        }
    };

    const sortedDays = useMemo(() => Object.entries(dailySummary).sort(([, a], [, b]) => b.dateObj.getTime() - a.dateObj.getTime()), [dailySummary]);

    const totalGeral = sortedDays.reduce((sum, [, d]) => sum + d.totalFin, 0);
    const totalQtd = sortedDays.reduce((sum, [, d]) => sum + d.P + d.M + d.G + d.PF, 0);

    return (
        <div className="modern-page">
            <div className="modern-header marmitas-page">
                <div className="modern-header-info">
                    <div className="modern-header-subtitle">Controle de Marmitas</div>
                    <div className="modern-header-title">
                        {totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="modern-header-badges">
                        <div className="modern-badge-summary info">
                            <span><LuUtensils size={16} /></span> {totalQtd} totais no período
                        </div>
                    </div>
                </div>
                <button className="btn-lancar-vendas" onClick={() => setShowModal(true)}>
                    <span className="btn-lancar-icon"><LuShoppingBag size={20} /></span>
                    <span className="btn-lancar-text">
                        <span className="btn-lancar-label">Lançar Vendas</span>
                        <span className="btn-lancar-sublabel">do Dia</span>
                    </span>
                    <span className="btn-lancar-badge"><LuPlus size={14} /></span>
                </button>
            </div>

            <div className="modern-filters-container">
                <div className="modern-filter-group">
                    <label>Mês de Referência:</label>
                    <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                        {monthOptions.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="modern-table-container card" style={{ padding: 0 }}>
                {isLoading ? (
                    <div style={{ padding: '2rem' }}>
                        <TableSkeleton rows={8} cols={7} />
                    </div>
                ) : isError ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                        Erro ao carregar marmitas: {error instanceof Error ? error.message : 'Erro desconhecido'}
                    </div>
                ) : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>DATA</th>
                                <th style={{ textAlign: 'center' }}>P</th>
                                <th style={{ textAlign: 'center' }}>M</th>
                                <th style={{ textAlign: 'center' }}>G</th>
                                <th style={{ textAlign: 'center' }}>PF</th>
                                <th style={{ textAlign: 'center' }}>TOTAL DO DIA</th>
                                <th style={{ textAlign: 'right' }}>AÇÕES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedDays.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Nenhuma venda registrada.</td></tr>
                            ) : (
                                sortedDays.map(([dateString, data]) => (
                                    <tr key={dateString} onClick={() => setSelectedDateDetails(dateString)} style={{ cursor: 'pointer' }}>
                                        <td className="col-highlight">{dateString}</td>
                                        <td style={{ textAlign: 'center' }}><span className="modern-status-badge neutral">{data.P}</span></td>
                                        <td style={{ textAlign: 'center' }}><span className="modern-status-badge neutral">{data.M}</span></td>
                                        <td style={{ textAlign: 'center' }}><span className="modern-status-badge neutral">{data.G}</span></td>
                                        <td style={{ textAlign: 'center' }}><span className="modern-status-badge neutral">{data.PF}</span></td>
                                        <td style={{ textAlign: 'center' }} className="col-money">
                                            {data.totalFin.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                className="btn-modern-icon"
                                                title="Excluir dia inteiro"
                                                onClick={(e) => handleDeleteGroup(dateString, e)}
                                                style={{ color: '#ef4444' }}
                                            >
                                                <LuTrash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedDateDetails && dailySummary[selectedDateDetails] && (
                <div className="modal-overlay animate-fade-in" onClick={() => setSelectedDateDetails(null)} style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <div className="modal-content animate-scale-in" onClick={e => e.stopPropagation()} style={{
                        background: '#ffffff',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '750px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        padding: 0
                    }}>
                        <div className="modal-header" style={{
                            padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'linear-gradient(to right, #f8fafc, #ffffff)',
                            borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                            position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(10px)'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Vendas: {selectedDateDetails}</h3>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                                    Detalhamento por tamanho • Total do Dia: <b style={{ color: '#10b981' }}>{dailySummary[selectedDateDetails].totalFin.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b>
                                </p>
                            </div>
                            <button className="btn-modern-icon" onClick={() => setSelectedDateDetails(null)} style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LuX size={18} /></button>
                        </div>
                        <div className="modern-table-container" style={{ margin: '1rem', border: '1px solid #f1f5f9' }}>
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Cliente</th>
                                        <th>Tamanho</th>
                                        <th style={{ textAlign: 'center' }}>Qtd</th>
                                        <th style={{ textAlign: 'center' }}>Unit.</th>
                                        <th style={{ textAlign: 'center' }}>Total</th>
                                        <th style={{ textAlign: 'right' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dailySummary[selectedDateDetails].items.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.cliente || '-'}</td>
                                        <td className="col-highlight">{item.tamanho}</td>
                                            <td style={{ textAlign: 'center' }}>{item.quantidade || 1}</td>
                                            <td style={{ textAlign: 'center', color: '#64748b' }}>
                                                {item.valorUnitario ? item.valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                            </td>
                                            <td style={{ textAlign: 'center' }} className="col-money">
                                                {item.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </td>
                                            <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button className="btn-modern-icon" onClick={() => openEditModal(item)}><LuPencil size={16} /></button>
                                                {user?.role === 'adm' && (
                                                    <button className="btn-modern-icon" onClick={(e) => handleDelete(item.id, e)} style={{ color: '#ef4444' }}><LuTrash2 size={16} /></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: '1.5rem 2rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
                            <button className="btn btn-secondary" onClick={() => setSelectedDateDetails(null)} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700 }}>Fechar</button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (() => {
                const marmitaTypes = [
                    { key: 'P', label: 'Pequena', emoji: '🥡', accent: '#3b82f6', accentLight: '#eff6ff', accentBorder: '#bfdbfe', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
                    { key: 'M', label: 'Média', emoji: '🍱', accent: '#10b981', accentLight: '#ecfdf5', accentBorder: '#a7f3d0', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
                    { key: 'G', label: 'Grande', emoji: '🍛', accent: '#8b5cf6', accentLight: '#f5f3ff', accentBorder: '#ddd6fe', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
                    { key: 'PF', label: 'Prato Feito', emoji: '🍽️', accent: '#f59e0b', accentLight: '#fffbeb', accentBorder: '#fde68a', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
                ];

                const grandTotal = marmitaTypes.reduce((sum, t) => {
                    return sum + (parseFloat((formData as any)[`total${t.key}`]) || 0);
                }, 0);

                const totalQtdModal = marmitaTypes.reduce((sum, t) => {
                    return sum + (parseInt((formData as any)[`qtd${t.key}`]) || 0);
                }, 0);

                return (
                    <div className="modal-overlay animate-fade-in" onClick={resetForm}>
                        <div className="marmita-modal-content" onClick={e => e.stopPropagation()}>

                            {/* Header Premium */}
                            <div className="marmita-modal-header">
                                <div className="marmita-modal-header-icon">
                                    <LuShoppingBag size={24} />
                                </div>
                                <div className="marmita-modal-header-text">
                                    <h2>Lançar Vendas do Dia</h2>
                                    <p>Informe as quantidades e valores por tamanho de marmita</p>
                                </div>
                                <button className="marmita-modal-close" onClick={resetForm}>
                                    <LuX size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="marmita-modal-body">

                                    {/* Data */}
                                    {/* Cliente selector */}
                                    <div className="marmita-date-section">
                                        <div className="marmita-date-icon"><LuUtensils size={18} /></div>
                                        <div className="marmita-date-field">
                                            <label>Cliente</label>
                                            <select
                                                required
                                                value={formData.cliente}
                                                onChange={e => setFormData({ ...formData, cliente: e.target.value })}
                                                className="marmita-date-input"
                                            >
                                                <option value="">Selecione...</option>
                                                {clientes.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    {/* Data */}
                                    <div className="marmita-date-section">
                                        <div className="marmita-date-icon"><LuCalendar size={18} /></div>
                                        <div className="marmita-date-field">
                                            <label>Data da Venda</label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.dataEntrega}
                                                onChange={e => setFormData({ ...formData, dataEntrega: e.target.value })}
                                                className="marmita-date-input"
                                            />
                                        </div>
                                    </div>

                                    {/* Cards de Tamanho */}
                                    <div className="marmita-types-grid">
                                        {marmitaTypes.map(t => {
                                            const qtdVal = (formData as any)[`qtd${t.key}`];
                                            const unitVal = (formData as any)[`unit${t.key}`];
                                            const totalVal = (formData as any)[`total${t.key}`];
                                            const hasValue = (parseInt(qtdVal) || 0) > 0;

                                            return (
                                                <div
                                                    key={t.key}
                                                    className={`marmita-type-card${hasValue ? ' marmita-type-card--active' : ''}`}
                                                    style={{
                                                        '--card-accent': t.accent,
                                                        '--card-accent-light': t.accentLight,
                                                        '--card-accent-border': t.accentBorder,
                                                    } as React.CSSProperties}
                                                >
                                                    {/* Card Header */}
                                                    <div className="marmita-card-header">
                                                        <div className="marmita-card-emoji">{t.emoji}</div>
                                                        <div className="marmita-card-title">
                                                            <span className="marmita-card-key">{t.key}</span>
                                                            <span className="marmita-card-label">{t.label}</span>
                                                        </div>
                                                        {hasValue && (
                                                            <div className="marmita-card-check">
                                                                <LuCircleCheck size={16} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Qty Input */}
                                                    <div className="marmita-card-field">
                                                        <label>Quantidade</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            value={qtdVal}
                                                            onChange={e => handleCalcChange('qtd', e.target.value, t.key as any)}
                                                            className="marmita-card-input marmita-card-input--qty"
                                                        />
                                                    </div>

                                                    {/* Unit Price Input */}
                                                    <div className="marmita-card-field">
                                                        <label>Valor Unitário</label>
                                                        <div className="marmita-card-input-prefix">
                                                            <span className="marmita-prefix-label">R$</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="0,00"
                                                                value={unitVal}
                                                                onChange={e => handleCalcChange('unit', e.target.value, t.key as any)}
                                                                className="marmita-card-input"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Total (read-only) */}
                                                    <div className="marmita-card-total">
                                                        <span className="marmita-card-total-label">Total</span>
                                                        <span className="marmita-card-total-value">
                                                            {totalVal
                                                                ? parseFloat(totalVal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                                : 'R$ 0,00'
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Grand Total */}
                                    <div className="marmita-grand-total">
                                        <div className="marmita-grand-total-left">
                                            <LuTrendingUp size={20} />
                                            <div>
                                                <div className="marmita-grand-label">Total Geral do Lançamento</div>
                                                <div className="marmita-grand-sub">{totalQtdModal} marmita{totalQtdModal !== 1 ? 's' : ''} no total</div>
                                            </div>
                                        </div>
                                        <div className="marmita-grand-value">
                                            {grandTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="marmita-modal-footer">
                                    <button type="button" className="marmita-btn-cancel" onClick={resetForm}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="marmita-btn-submit" disabled={createLoteMutation.isPending}>
                                        {createLoteMutation.isPending ? (
                                            <><span className="marmita-btn-spinner" /> Salvando...</>
                                        ) : (
                                            <><LuCircleCheck size={18} /> Salvar Lançamento</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            })()}

            {showEditModal && editingItem && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowEditModal(false)} style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <div className="modal-content animate-scale-in" onClick={e => e.stopPropagation()} style={{
                        background: '#ffffff',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '450px',
                        maxHeight: '90vh',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        padding: 0
                    }}>
                        <div className="modal-header" style={{
                            padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'linear-gradient(to right, #f8fafc, #ffffff)',
                            borderTopLeftRadius: '24px', borderTopRightRadius: '24px'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Editar: {editingItem.tamanho}</h3>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>Ajuste os valores do lançamento</p>
                            </div>
                            <button className="btn-modern-icon" onClick={() => setShowEditModal(false)} style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LuX size={18} /></button>
                        </div>
                        <form onSubmit={handleUpdate} style={{ padding: '2rem' }}>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Cliente</label>
                                <select
                                    required
                                    value={editData.cliente}
                                    onChange={e => setEditData({ ...editData, cliente: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem' }}
                                >
                                    <option value="">Selecione...</option>
                                    {clientes.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Data da Entrega</label>
                                <input
                                    type="date"
                                    required
                                    value={editData.dataEntrega}
                                    onChange={e => setEditData({ ...editData, dataEntrega: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Quantidade</label>
                                <input type="number" required value={editData.qtd} onChange={e => {
                                    const q = e.target.value;
                                    const total = calcTotal(q, editData.valorUnitario);
                                    setEditData({ ...editData, qtd: q, valorTotal: total });
                                }}
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem', fontWeight: 700 }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Valor Unitário (R$)</label>
                                <input type="number" step="0.01" required value={editData.valorUnitario} onChange={e => {
                                    const u = e.target.value;
                                    const total = calcTotal(editData.qtd, u);
                                    setEditData({ ...editData, valorUnitario: u, valorTotal: total });
                                }}
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Valor Total</label>
                                <input type="number" step="0.01" value={editData.valorTotal} readOnly style={{ background: '#ffffff', fontWeight: 900, color: '#10b981', border: '2px solid #10b981', width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '1rem' }} />
                            </div>
                            <div className="modal-actions" style={{
                                display: 'flex', gap: '1rem', padding: '1.5rem 2rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', margin: '0 -2rem -2rem -2rem'
                            }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 700, border: '1px solid #e2e8f0', background: '#ffffff' }}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending} style={{ flex: 2, padding: '1rem', borderRadius: '14px', fontWeight: 700, border: 'none', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#ffffff' }}>
                                    {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
            {/* page-specific styling for more professional look */}
            <style jsx>{`
                /* neutralize header badge color */
                .marmitas-page .modern-header-badges .modern-badge-summary.info {
                    background: var(--neutral-100);
                    color: var(--text-secondary);
                }
                /* tone down launch button */
                .btn-lancar-vendas {
                    background: var(--surface);
                    color: var(--text-primary);
                    box-shadow: var(--shadow-soft);
                    border: 1px solid var(--border);
                }
                .btn-lancar-vendas:hover {
                    transform: none;
                    box-shadow: var(--shadow-soft);
                }
                /* remove accent gradients on cards and use neutral accent */
                .marmita-type-card {
                    background: var(--surface);
                    --card-accent: var(--neutral-300) !important;
                    --card-accent-light: var(--neutral-100) !important;
                    --card-accent-border: var(--border) !important;
                }
            `}</style>
        </div>
    );
}
