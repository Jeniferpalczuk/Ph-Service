'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Marmita } from '@/types';
import '../shared-modern.css';

export default function MarmitasPage() {
    const { user } = useAuth();
    const { marmitas, addMarmita, updateMarmita, deleteMarmita } = useApp();
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
        setFormData({
            dataEntrega: new Date().toISOString().split('T')[0],
            qtdP: '', unitP: '', totalP: '',
            qtdM: '', unitM: '', totalM: '',
            qtdG: '', unitG: '', totalG: '',
            qtdPF: '', unitPF: '', totalPF: ''
        });
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const [y, m, d] = formData.dataEntrega.split('-').map(Number);
        const dataRef = new Date(y, m - 1, d, 12, 0, 0);

        const sizes = [
            { key: 'P', label: 'Pequena', qtd: formData.qtdP, unit: formData.unitP, total: formData.totalP },
            { key: 'M', label: 'Média', qtd: formData.qtdM, unit: formData.unitM, total: formData.totalM },
            { key: 'G', label: 'Grande', qtd: formData.qtdG, unit: formData.unitG, total: formData.totalG },
            { key: 'PF', label: 'Prato Feito', qtd: formData.qtdPF, unit: formData.unitPF, total: formData.totalPF },
        ];

        let addedCount = 0;
        sizes.forEach(size => {
            const qtd = parseInt(size.qtd) || 0;
            const unit = parseFloat(size.unit) || 0;
            const total = parseFloat(size.total) || 0;

            if (qtd > 0 || total > 0) {
                const payload = {
                    cliente: 'Venda Diária',
                    tamanho: size.key,
                    quantidade: qtd,
                    valorUnitario: unit,
                    valorTotal: total,
                    dataEntrega: dataRef,
                    statusRecebimento: 'pago' as const,
                    formaPagamento: 'dinheiro' as const,
                    observacoes: `Lote ${size.label}`
                };
                addMarmita(payload);
                addedCount++;
            }
        });

        if (addedCount > 0) resetForm();
        else alert('Preencha ao menos uma quantidade.');
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Excluir este lançamento permanentemente?')) {
            deleteMarmita(id);
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

    const handleDeleteGroup = (dateString: string) => {
        if (window.confirm(`Tem certeza que deseja excluir TODOS os lançamentos do dia ${dateString}? Esta ação não pode ser desfeita.`)) {
            const itemsToDelete = dailySummary[dateString]?.items || [];
            itemsToDelete.forEach(item => deleteMarmita(item.id));
            setSelectedDateDetails(null);
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

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            const [y, m, d] = editData.dataEntrega.split('-').map(Number);
            const newData = new Date(y, m - 1, d, 12, 0, 0);

            updateMarmita(editingItem.id, {
                quantidade: parseInt(editData.qtd),
                valorUnitario: parseFloat(editData.valorUnitario),
                valorTotal: parseFloat(editData.valorTotal),
                dataEntrega: newData
            });
            setShowEditModal(false);
            setEditingItem(null);
            setSelectedDateDetails(null);
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
                            <span>🍱</span> {totalQtd} totais no período
                        </div>
                    </div>
                </div>
                <button className="btn-modern-primary" onClick={() => setShowModal(true)}>
                    ➕ Lançar Vendas do Dia
                </button>
            </div>

            <div className="modern-table-container">
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
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteGroup(dateString);
                                            }}
                                            style={{ color: '#ef4444' }}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedDateDetails && dailySummary[selectedDateDetails] && (
                <div className="modal-overlay" onClick={() => setSelectedDateDetails(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ margin: 0 }}>Detalhes: {selectedDateDetails}</h3>
                                <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                                    Faturamento: <b>{dailySummary[selectedDateDetails].totalFin.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b>
                                </p>
                            </div>
                            <button className="modal-close" onClick={() => setSelectedDateDetails(null)}>✕</button>
                        </div>
                        <div className="modern-table-container">
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
                                                <button className="btn-modern-icon" onClick={() => openEditModal(item)}>✏️</button>
                                                {user?.role === 'adm' && (
                                                    <button className="btn-modern-icon" onClick={() => handleDelete(item.id)}>🗑️</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px' }}>
                        <div className="modal-header">
                            <div>
                                <h2 style={{ margin: 0 }}>Lançar Vendas</h2>
                                <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Informe as quantidades vendidas por tamanho.</p>
                            </div>
                            <button className="modal-close" onClick={resetForm}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Data da Venda</label>
                                <input type="date" required value={formData.dataEntrega} onChange={e => setFormData({ ...formData, dataEntrega: e.target.value })} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                                {['P', 'M', 'G', 'PF'].map(type => (
                                    <div key={type} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#94a3b8', marginBottom: '1rem' }}>{type}</div>
                                        <div className="form-group"><label>Qtd</label>
                                            <input type="number" min="0" placeholder="0" value={(formData as any)[`qtd${type}`]} onChange={e => handleCalcChange('qtd', e.target.value, type as any)} />
                                        </div>
                                        <div className="form-group"><label>Unitário (R$)</label>
                                            <input type="number" step="0.01" value={(formData as any)[`unit${type}`]} onChange={e => handleCalcChange('unit', e.target.value, type as any)} />
                                        </div>
                                        <div className="form-group"><label>Total</label>
                                            <input type="number" step="0.01" value={(formData as any)[`total${type}`]} readOnly style={{ background: '#f1f5f9', fontWeight: 800 }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="modal-actions" style={{ marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar Vendas</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && editingItem && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Editar: {editingItem.tamanho}</h3>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <div className="form-group">
                                <label>Data da Entrega</label>
                                <input
                                    type="date"
                                    required
                                    value={editData.dataEntrega}
                                    onChange={e => setEditData({ ...editData, dataEntrega: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Quantidade</label>
                                <input type="number" required value={editData.qtd} onChange={e => {
                                    const q = e.target.value;
                                    const total = calcTotal(q, editData.valorUnitario);
                                    setEditData({ ...editData, qtd: q, valorTotal: total });
                                }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Valor Unitário (R$)</label>
                                <input type="number" step="0.01" required value={editData.valorUnitario} onChange={e => {
                                    const u = e.target.value;
                                    const total = calcTotal(editData.qtd, u);
                                    setEditData({ ...editData, valorUnitario: u, valorTotal: total });
                                }}
                                />
                            </div>
                            <div className="form-group"><label>Valor Total</label><input type="number" step="0.01" value={editData.valorTotal} readOnly style={{ background: '#f1f5f9' }} /></div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
