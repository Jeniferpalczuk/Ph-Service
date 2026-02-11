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
import { TableSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'react-hot-toast';
import {
    LuPlus,
    LuUtensils,
    LuPencil,
    LuTrash2,
    LuX
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

    // Fetch Marmitas via React Query
    const lastDay = new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]), 0).getDate().toString().padStart(2, '0');
    const { data: marmitasData, isLoading, isError, error } = useMarmitasList({
        pageSize: 1000,
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
    const [editData, setEditData] = useState({ qtd: '', valorUnitario: '', valorTotal: '', dataEntrega: '' });

    // Form State (Lançamento Diário)
    const [formData, setFormData] = useState({
        dataEntrega: new Date().toISOString().split('T')[0],
        qtdP: '', unitP: '', totalP: '',
        qtdM: '', unitM: '', totalM: '',
        qtdG: '', unitG: '', totalG: '',
        qtdPF: '', unitPF: '', totalPF: ''
    });

    const resetForm = () => {
        setFormData(prev => ({
            ...prev,
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

        if (marmitasParaInserir.length === 0) {
            toast.error('Preencha ao menos uma quantidade.');
            return;
        }

        try {
            await createLoteMutation.mutateAsync({
                dataEntrega: dataRef,
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
            <div className="modern-header">
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
                <button className="btn-modern-primary" onClick={() => setShowModal(true)}>
                    <LuPlus size={18} /> Lançar Vendas do Dia
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

            {showModal && (
                <div className="modal-overlay animate-fade-in" onClick={resetForm}>
                    <div className="modal-content card animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', width: '95%' }}>
                        <div className="modal-header">
                            <div>
                                <h2>Lançar Vendas</h2>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Informe as quantidades vendidas por tamanho.</p>
                            </div>
                            <button className="modal-close" onClick={resetForm}><LuX size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                            <div className="form-group" style={{ marginBottom: '2rem', maxWidth: '300px' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Data da Venda</label>
                                <input type="date" required value={formData.dataEntrega} onChange={e => setFormData({ ...formData, dataEntrega: e.target.value })} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                                {['P', 'M', 'G', 'PF'].map(type => (
                                    <div key={type} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#94a3b8', marginBottom: '1.25rem', display: 'flex', justifyContent: 'baseline', gap: '0.5rem' }}>
                                            {type} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', textTransform: 'uppercase' }}>{type === 'PF' ? 'Prato Feito' : 'Marmita'}</span>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem' }}>Qtd</label>
                                            <input type="number" min="0" placeholder="0" value={(formData as any)[`qtd${type}`]} onChange={e => handleCalcChange('qtd', e.target.value, type as any)} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 800 }} />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem' }}>Unitário (R$)</label>
                                            <input type="number" step="0.01" value={(formData as any)[`unit${type}`]} onChange={e => handleCalcChange('unit', e.target.value, type as any)} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem' }}>Total</label>
                                            <input type="number" step="0.01" value={(formData as any)[`total${type}`]} readOnly style={{ background: '#ffffff', fontWeight: 900, color: '#10b981', border: '2px solid #10b981', width: '100%', padding: '0.6rem 0.75rem', borderRadius: '10px', fontSize: '1rem' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="modal-actions" style={{
                                display: 'flex', gap: '1rem', padding: '1.5rem 2rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', margin: '2rem -2rem -2rem -2rem'
                            }}>
                                <button type="button" className="btn btn-secondary" onClick={resetForm} style={{ flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 700, border: '1px solid #e2e8f0', background: '#ffffff' }}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={createLoteMutation.isPending} style={{ flex: 2, padding: '1rem', borderRadius: '14px', fontWeight: 700, border: 'none', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#ffffff', boxShadow: '0 10px 15px -3px rgba(14, 165, 233, 0.3)' }}>
                                    {createLoteMutation.isPending ? 'Salvando...' : 'Salvar Lote de Vendas'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
    );
}
