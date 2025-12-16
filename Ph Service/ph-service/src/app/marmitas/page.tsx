'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Marmita } from '@/types';

export default function MarmitasPage() {
    const { user } = useAuth();
    const { marmitas, addMarmita, updateMarmita, deleteMarmita } = useApp();
    const [showModal, setShowModal] = useState(false);

    // Detalhes do Dia
    const [selectedDateDetails, setSelectedDateDetails] = useState<string | null>(null);

    // Edição Individual
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Marmita | null>(null);
    const [editData, setEditData] = useState({ qtd: '', valorUnitario: '', valorTotal: '' });

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

    // Helper para cálculo automático
    const calcTotal = (qtd: string, unit: string) => {
        const q = parseFloat(qtd);
        const u = parseFloat(unit);
        if (!isNaN(q) && !isNaN(u)) return (q * u).toFixed(2);
        return '';
    };

    const handleCalcChange = (field: string, value: string, type: 'P' | 'M' | 'G' | 'PF') => {
        // Copia estado atual
        const prev = { ...formData };

        // Atualiza o campo que mudou
        // @ts-ignore
        prev[`${field}${type}`] = value;

        // Calcula total se mudou qtd ou unit
        const qKey = `qtd${type}`;
        const uKey = `unit${type}`;
        const tKey = `total${type}`;

        // @ts-ignore
        const q = prev[qKey];
        // @ts-ignore
        const u = prev[uKey];

        // @ts-ignore
        prev[tKey] = calcTotal(q, u); // Auto update total

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
                    valorTotal: total, // Usa o total (pode ter sido editado manually ou calculado)
                    dataEntrega: dataRef,
                    statusRecebimento: 'pago' as const,
                    formaPagamento: 'dinheiro' as const,
                    observacoes: `Lote ${size.label}`
                };
                addMarmita(payload);
                addedCount++;
            }
        });

        if (addedCount > 0) {
            resetForm();
        } else {
            alert('Preencha ao menos uma quantidade.');
        }
    };

    const handleDelete = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (window.confirm('Excluir este lançamento permanentemente?')) {
            deleteMarmita(id);
        }
    };

    const openEditModal = (item: Marmita, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setEditingItem(item);
        setEditData({
            qtd: item.quantidade ? item.quantidade.toString() : '1',
            valorUnitario: item.valorUnitario ? item.valorUnitario.toString() : '',
            valorTotal: item.valorTotal.toString()
        });
        setShowEditModal(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            updateMarmita(editingItem.id, {
                quantidade: parseInt(editData.qtd),
                valorUnitario: parseFloat(editData.valorUnitario),
                valorTotal: parseFloat(editData.valorTotal)
            });
            setShowEditModal(false);
            setEditingItem(null);
        }
    };

    // --- Agrupamento ---
    const dailySummary: Record<string, { dateObj: Date, P: number, M: number, G: number, PF: number, totalFin: number, items: Marmita[] }> = {};

    marmitas.forEach(m => {
        const d = new Date(m.dataEntrega);
        const dateKey = d.toLocaleDateString('pt-BR');

        if (!dailySummary[dateKey]) {
            dailySummary[dateKey] = { dateObj: d, P: 0, M: 0, G: 0, PF: 0, totalFin: 0, items: [] };
        }

        dailySummary[dateKey].items.push(m);
        dailySummary[dateKey].totalFin += m.valorTotal;

        const qtd = m.quantidade || 1;
        const t = m.tamanho;

        if (['P', 'Pequena'].includes(t)) dailySummary[dateKey].P += qtd;
        else if (['M', 'Media', 'Média'].includes(t)) dailySummary[dateKey].M += qtd;
        else if (['G', 'Grande'].includes(t)) dailySummary[dateKey].G += qtd;
        else if (['PF', 'Prato Feito'].includes(t)) dailySummary[dateKey].PF += qtd;
    });

    const sortedDays = Object.entries(dailySummary).sort(([, a], [, b]) => b.dateObj.getTime() - a.dateObj.getTime());

    return (
        <div style={{ padding: '1rem', width: '100%' }}>

            <div className="table-wrapper">
                <div className="table-header-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>🍱</span>
                        <h3>Controle de Marmita</h3>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        ➕ Lançar Vendas do Dia
                    </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>DATA</th>
                                <th className="text-center">P</th>
                                <th className="text-center">M</th>
                                <th className="text-center">G</th>
                                <th className="text-center">PF</th>
                                <th className="text-center">TOTAL DO DIA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedDays.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>Nenhuma venda registrada.</td></tr>
                            ) : (
                                sortedDays.map(([dateString, data]) => (
                                    <tr key={dateString} onClick={() => setSelectedDateDetails(dateString)} className="row-hover">
                                        <td style={{ fontWeight: 600 }}>{dateString}</td>
                                        <td className="text-center"><span className="badge badge-neutral">{data.P}</span></td>
                                        <td className="text-center"><span className="badge badge-neutral">{data.M}</span></td>
                                        <td className="text-center"><span className="badge badge-neutral">{data.G}</span></td>
                                        <td className="text-center"><span className="badge badge-neutral">{data.PF}</span></td>
                                        <td className="text-center" style={{ fontWeight: 700, color: 'var(--success-600)', fontSize: '1.1rem' }}>
                                            R$ {data.totalFin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DETALHES (Lista do Dia) */}
            {selectedDateDetails && dailySummary[selectedDateDetails] && (
                <div className="modal-overlay" onClick={() => setSelectedDateDetails(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ marginBottom: '0.25rem' }}>Detalhes: {selectedDateDetails}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    Total: <b>R$ {dailySummary[selectedDateDetails].totalFin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b>
                                </p>
                            </div>
                            <button className="modal-close" onClick={() => setSelectedDateDetails(null)}>✕</button>
                        </div>
                        <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Tamanho</th>
                                        <th className="text-center">Qtd</th>
                                        <th className="text-center">Unit.</th>
                                        <th className="text-center">Total</th>
                                        <th className="text-center" style={{ width: '120px' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dailySummary[selectedDateDetails].items.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                <span className="badge" style={{
                                                    fontSize: '1rem', width: '40px', textAlign: 'center',
                                                    backgroundColor: ['P', 'Pequena'].includes(item.tamanho) ? '#dbeafe' : ['M', 'Media', 'Média'].includes(item.tamanho) ? '#dcfce7' : ['G', 'Grande'].includes(item.tamanho) ? '#f3e8ff' : '#fef3c7',
                                                    color: ['P', 'Pequena'].includes(item.tamanho) ? '#1e40af' : ['M', 'Media', 'Média'].includes(item.tamanho) ? '#166534' : ['G', 'Grande'].includes(item.tamanho) ? '#6b21a8' : '#b45309'
                                                }}>
                                                    {item.tamanho}
                                                </span>
                                            </td>
                                            <td className="text-center" style={{ fontSize: '1rem' }}>{item.quantidade || 1}</td>
                                            <td className="text-center" style={{ color: 'var(--text-secondary)' }}>
                                                {item.valorUnitario ? `R$ ${item.valorUnitario.toFixed(2)}` : '-'}
                                            </td>
                                            <td className="text-center" style={{ fontWeight: 600 }}>
                                                R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-center">
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => openEditModal(item, e)}
                                                        className="btn-icon"
                                                        title="Editar"
                                                        style={{ background: 'var(--surface-hover)', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                                                    >
                                                        ✏️
                                                    </button>
                                                    {user?.role === 'adm' && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleDelete(item.id, e)}
                                                            className="btn-icon"
                                                            title="Excluir"
                                                            style={{ color: 'var(--danger-600)', background: 'var(--danger-50)', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL NOVO LANÇAMENTO - COM VALOR UNITÁRIO */}
            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                        <div className="modal-header">
                            <div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Lançar Vendas</h2>
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Preencha quantidades e valores unitários. O total é automático.</p>
                            </div>
                            <button className="modal-close" onClick={resetForm}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label style={{ fontSize: '1rem' }}>Data da Venda</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.dataEntrega}
                                    onChange={e => setFormData({ ...formData, dataEntrega: e.target.value })}
                                    style={{
                                        fontWeight: 'bold',
                                        fontSize: '1.1rem',
                                        padding: '12px',
                                        background: 'var(--surface-hover)',
                                        border: '1px solid var(--primary)'
                                    }}
                                />
                            </div>

                            <div className="sizes-grid">
                                {/* P */}
                                <div className="size-card">
                                    <div className="size-badge">P</div>
                                    <div className="form-group"><label>Qtd</label>
                                        <input type="number" min="0" placeholder="0" value={formData.qtdP} onChange={e => handleCalcChange('qtd', e.target.value, 'P')} />
                                    </div>
                                    <div className="form-group"><label>Unitário (R$)</label>
                                        <input type="number" step="0.01" min="0" placeholder="0.00" value={formData.unitP} onChange={e => handleCalcChange('unit', e.target.value, 'P')} />
                                    </div>
                                    <div className="form-group"><label>Total (Auto)</label>
                                        <input type="number" step="0.01" value={formData.totalP} readOnly style={{ background: 'var(--surface-hover)', fontWeight: 'bold' }} />
                                    </div>
                                </div>
                                {/* M */}
                                <div className="size-card">
                                    <div className="size-badge">M</div>
                                    <div className="form-group"><label>Qtd</label>
                                        <input type="number" min="0" placeholder="0" value={formData.qtdM} onChange={e => handleCalcChange('qtd', e.target.value, 'M')} />
                                    </div>
                                    <div className="form-group"><label>Unitário (R$)</label>
                                        <input type="number" step="0.01" min="0" placeholder="0.00" value={formData.unitM} onChange={e => handleCalcChange('unit', e.target.value, 'M')} />
                                    </div>
                                    <div className="form-group"><label>Total (Auto)</label>
                                        <input type="number" step="0.01" value={formData.totalM} readOnly style={{ background: 'var(--surface-hover)', fontWeight: 'bold' }} />
                                    </div>
                                </div>
                                {/* G */}
                                <div className="size-card">
                                    <div className="size-badge">G</div>
                                    <div className="form-group"><label>Qtd</label>
                                        <input type="number" min="0" placeholder="0" value={formData.qtdG} onChange={e => handleCalcChange('qtd', e.target.value, 'G')} />
                                    </div>
                                    <div className="form-group"><label>Unitário (R$)</label>
                                        <input type="number" step="0.01" min="0" placeholder="0.00" value={formData.unitG} onChange={e => handleCalcChange('unit', e.target.value, 'G')} />
                                    </div>
                                    <div className="form-group"><label>Total (Auto)</label>
                                        <input type="number" step="0.01" value={formData.totalG} readOnly style={{ background: 'var(--surface-hover)', fontWeight: 'bold' }} />
                                    </div>
                                </div>
                                {/* PF */}
                                <div className="size-card pf-card">
                                    <div className="size-badge">PF</div>
                                    <div className="form-group"><label>Qtd</label>
                                        <input type="number" min="0" placeholder="0" value={formData.qtdPF} onChange={e => handleCalcChange('qtd', e.target.value, 'PF')} />
                                    </div>
                                    <div className="form-group"><label>Unitário (R$)</label>
                                        <input type="number" step="0.01" min="0" placeholder="0.00" value={formData.unitPF} onChange={e => handleCalcChange('unit', e.target.value, 'PF')} />
                                    </div>
                                    <div className="form-group"><label>Total (Auto)</label>
                                        <input type="number" step="0.01" value={formData.totalPF} readOnly style={{ background: 'var(--surface-hover)', fontWeight: 'bold' }} />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-actions" style={{ marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={resetForm} style={{ padding: '12px 24px' }}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" style={{ padding: '12px 36px', fontSize: '1.1rem' }}>Salvar Vendas</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL EDIÇÃO */}
            {showEditModal && editingItem && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Editar: {editingItem.tamanho}</h3>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <div className="form-group">
                                <label>Quantidade</label>
                                <input
                                    type="number" required value={editData.qtd}
                                    onChange={e => {
                                        const q = e.target.value;
                                        const total = calcTotal(q, editData.valorUnitario);
                                        setEditData({ ...editData, qtd: q, valorTotal: total });
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Valor Unitário (R$)</label>
                                <input
                                    type="number" step="0.01" required value={editData.valorUnitario}
                                    onChange={e => {
                                        const u = e.target.value;
                                        const total = calcTotal(editData.qtd, u);
                                        setEditData({ ...editData, valorUnitario: u, valorTotal: total });
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Valor Total (Auto)</label>
                                <input type="number" step="0.01" required value={editData.valorTotal} readOnly />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .sizes-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); /* Aumentado minmax */
                    gap: 1rem;
                }
                .size-card {
                    background: var(--surface);
                    padding: 1rem;
                    border-radius: 12px;
                    border: 1px solid var(--border);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }
                .size-badge {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: var(--text-tertiary);
                    opacity: 0.5;
                    margin-bottom: 0.5rem;
                    text-align: center;
                }
                .pf-card {
                    background: linear-gradient(to bottom right, var(--surface), var(--surface-hover));
                }
                .form-group label {
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-bottom: 0.3rem;
                    display: block;
                    color: var(--text-secondary);
                }
                .form-group input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    font-weight: 600;
                }
                .form-group input:read-only {
                    background: var(--surface-hover);
                    color: var(--text-tertiary);
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
