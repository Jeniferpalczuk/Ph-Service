'use client';

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { FechamentoCaixa } from '@/types';
import { useAuth } from '@/context/AuthContext';
import '../shared-modern.css';

export default function CaixaPage() {
    const {
        fechamentosCaixa,
        addFechamentoCaixa,
        updateFechamentoCaixa,
        deleteFechamentoCaixa,
        funcionarios
    } = useApp();
    const { user } = useAuth();

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<FechamentoCaixa | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTurno, setFilterTurno] = useState('all');

    // Form State
    const [formData, setFormData] = useState({
        data: new Date().toISOString().split('T')[0],
        funcionario: '',
        turno: 'manha' as 'manha' | 'tarde',
        saidas: '',
        credito: '',
        debito: '',
        alimentacao: '',
        dinheiro: '',
        pix: '',
        observacoes: ''
    });

    // Helper State for Tarde Calculation
    const [calculoMode, setCalculoMode] = useState(false);
    const [leituras, setLeituras] = useState({
        credito: '',
        debito: '',
        alimentacao: ''
    });

    const resetForm = () => {
        setFormData({
            data: new Date().toISOString().split('T')[0],
            funcionario: '',
            turno: 'manha',
            saidas: '',
            credito: '',
            debito: '',
            alimentacao: '',
            dinheiro: '',
            pix: '',
            observacoes: ''
        });
        setLeituras({ credito: '', debito: '', alimentacao: '' });
        setCalculoMode(false);
        setEditingItem(null);
        setShowModal(false);
    };

    const handleEdit = (item: FechamentoCaixa) => {
        setEditingItem(item);
        setFormData({
            data: new Date(item.data).toISOString().split('T')[0],
            funcionario: item.funcionario,
            turno: item.turno,
            saidas: item.saidas > 0 ? item.saidas.toString() : '',
            credito: item.entradas.credito > 0 ? item.entradas.credito.toString() : '',
            debito: item.entradas.debito > 0 ? item.entradas.debito.toString() : '',
            alimentacao: item.entradas.alimentacao > 0 ? item.entradas.alimentacao.toString() : '',
            dinheiro: item.entradas.dinheiro > 0 ? item.entradas.dinheiro.toString() : '',
            pix: item.entradas.pix > 0 ? item.entradas.pix.toString() : '',
            observacoes: item.observacoes || ''
        });
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este fechamento?')) {
            deleteFechamentoCaixa(id);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const [ano, mes, dia] = formData.data.split('-').map(Number);
        const dataAjustada = new Date(ano, mes - 1, dia, 12, 0, 0);

        const payload = {
            data: dataAjustada,
            funcionario: formData.funcionario,
            turno: formData.turno,
            saidas: parseFloat(formData.saidas) || 0,
            entradas: {
                credito: parseFloat(formData.credito) || 0,
                debito: parseFloat(formData.debito) || 0,
                alimentacao: parseFloat(formData.alimentacao) || 0,
                dinheiro: parseFloat(formData.dinheiro) || 0,
                pix: parseFloat(formData.pix) || 0,
            },
            observacoes: formData.observacoes
        };

        if (editingItem) {
            updateFechamentoCaixa(editingItem.id, payload);
        } else {
            addFechamentoCaixa(payload);
        }
        resetForm();
    };

    const fechamentoManha = formData.turno === 'tarde'
        ? fechamentosCaixa.find(f =>
            new Date(f.data).toISOString().split('T')[0] === formData.data &&
            f.turno === 'manha'
        )
        : null;

    useEffect(() => {
        if (formData.turno === 'tarde' && fechamentoManha && calculoMode) {
            const calcVal = (leitura: string, manhaVal: number) => {
                const total = parseFloat(leitura) || 0;
                const diff = total - manhaVal;
                return diff > 0 ? diff.toFixed(2) : '';
            };

            setFormData(prev => ({
                ...prev,
                credito: calcVal(leituras.credito, fechamentoManha.entradas.credito),
                debito: calcVal(leituras.debito, fechamentoManha.entradas.debito),
                alimentacao: calcVal(leituras.alimentacao, fechamentoManha.entradas.alimentacao),
            }));
        }
    }, [leituras, fechamentoManha, formData.turno, calculoMode]);

    const filteredItems = useMemo(() => {
        return fechamentosCaixa.filter(item => {
            const matchesSearch = item.funcionario.toLowerCase().includes(searchTerm.toLowerCase()) ||
                new Date(item.data).toLocaleDateString().includes(searchTerm);
            const matchesTurno = filterTurno === 'all' || item.turno === filterTurno;
            return matchesSearch && matchesTurno;
        }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    }, [fechamentosCaixa, searchTerm, filterTurno]);

    const totalEntradas = filteredItems.reduce((sum, item) => sum + Object.values(item.entradas).reduce((a, b) => a + b, 0), 0);
    const totalSaidas = filteredItems.reduce((sum, item) => sum + item.saidas, 0);
    const saldoLiquido = totalEntradas - totalSaidas;

    return (
        <div className="modern-page">
            <div className="modern-header">
                <div className="modern-header-info">
                    <div className="modern-header-subtitle">Fechamento de Caixa</div>
                    <div className="modern-header-title">
                        R$ {saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="modern-header-badges">
                        <div className="modern-badge-summary success">
                            <span>📈</span> R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} entradas
                        </div>
                        <div className="modern-badge-summary danger">
                            <span>📉</span> R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} saídas
                        </div>
                        {(searchTerm || filterTurno !== 'all') && (
                            <button className="modern-badge-summary neutral" onClick={() => { setSearchTerm(''); setFilterTurno('all'); }} style={{ border: 'none', cursor: 'pointer' }}>
                                🧹 Limpar Filtros
                            </button>
                        )}
                    </div>
                </div>
                <button className="btn-modern-primary" onClick={() => setShowModal(true)}>
                    <span>+</span> Novo Fechamento
                </button>
            </div>

            <div className="modern-filters-container">
                <div className="modern-filter-group">
                    <label>🔍 Buscar:</label>
                    <input
                        type="text"
                        placeholder="Funcionário ou data..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="modern-filter-group">
                    <label>🌙 Turno:</label>
                    <select value={filterTurno} onChange={e => setFilterTurno(e.target.value)}>
                        <option value="all">Todos os Turnos</option>
                        <option value="manha">Manhã</option>
                        <option value="tarde">Tarde</option>
                    </select>
                </div>
            </div>

            <div className="modern-table-container">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>DATA</th>
                            <th>TURNO</th>
                            <th>FUNCIONÁRIO</th>
                            <th>ENTRADAS</th>
                            <th>SAÍDAS</th>
                            <th>LÍQUIDO</th>
                            <th style={{ textAlign: 'right' }}>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Nenhum fechamento registrado.</td></tr>
                        ) : (
                            filteredItems.map(item => {
                                const entradasItem = Object.values(item.entradas).reduce((a, b) => a + b, 0);
                                return (
                                    <tr key={item.id}>
                                        <td>{new Date(item.data).toLocaleDateString('pt-BR')}</td>
                                        <td>
                                            <span className={`modern-status-badge ${item.turno}`}
                                                style={{
                                                    backgroundColor: item.turno === 'manha' ? '#eff6ff' : '#fffbeb',
                                                    color: item.turno === 'manha' ? '#1e40af' : '#92400e'
                                                }}>
                                                {item.turno === 'manha' ? '☀️ Manhã' : '🌙 Tarde'}
                                            </span>
                                        </td>
                                        <td className="col-highlight">{item.funcionario}</td>
                                        <td className="col-money">R$ {entradasItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="col-money-negative">R$ {item.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="col-highlight">R$ {(entradasItem - item.saidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button className="btn-modern-icon" onClick={() => handleEdit(item)}>✏️</button>
                                            <button className="btn-modern-icon" onClick={() => handleDelete(item.id)}>🗑️</button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                <div className="modern-footer">
                    <div className="modern-footer-totals">
                        <div className="modern-total-item">Entradas: <b className="green">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></div>
                        <div className="modern-total-item">Saídas: <b className="red">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></div>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                        <div className="modal-header">
                            <h2>{editingItem ? 'Editar Fechamento' : 'Novo Fechamento'}</h2>
                            <button className="modal-close" onClick={resetForm}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Data *</label>
                                    <input type="date" required value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Turno *</label>
                                    <select value={formData.turno} onChange={e => { setFormData({ ...formData, turno: e.target.value as any }); setCalculoMode(false); }} disabled={!!editingItem}>
                                        <option value="manha">Manhã</option>
                                        <option value="tarde">Tarde</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Funcionário *</label>
                                <select required value={formData.funcionario} onChange={e => setFormData({ ...formData, funcionario: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    {funcionarios.filter(f => f.ativo).map(f => (
                                        <option key={f.id} value={f.nome}>{f.nome}</option>
                                    ))}
                                </select>
                            </div>

                            {formData.turno === 'tarde' && fechamentoManha && !editingItem && (
                                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, color: '#0f172a' }}>📊 Calculadora de Turno (T2)</h4>
                                        <label style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                                            <input type="checkbox" checked={calculoMode} onChange={e => setCalculoMode(e.target.checked)} />
                                            Cálculo Automático
                                        </label>
                                    </div>

                                    {calculoMode && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div className="form-group">
                                                <label>Total Crédito (Maquininha)</label>
                                                <input type="number" step="0.01" value={leituras.credito} onChange={e => setLeituras({ ...leituras, credito: e.target.value })} />
                                                <small style={{ color: '#64748b' }}>Manhã: R$ {fechamentoManha.entradas.credito.toFixed(2)}</small>
                                            </div>
                                            <div className="form-group">
                                                <label>Total Débito (Maquininha)</label>
                                                <input type="number" step="0.01" value={leituras.debito} onChange={e => setLeituras({ ...leituras, debito: e.target.value })} />
                                                <small style={{ color: '#64748b' }}>Manhã: R$ {fechamentoManha.entradas.debito.toFixed(2)}</small>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={{ marginBottom: '1rem', fontWeight: 800, color: '#1e293b', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💵 Entradas do Turno</div>
                            <div className="form-row">
                                <div className="form-group"><label>Crédito</label><input type="number" step="0.01" value={formData.credito} onChange={e => setFormData({ ...formData, credito: e.target.value })} disabled={calculoMode} /></div>
                                <div className="form-group"><label>Débito</label><input type="number" step="0.01" value={formData.debito} onChange={e => setFormData({ ...formData, debito: e.target.value })} disabled={calculoMode} /></div>
                                <div className="form-group"><label>Alimentação</label><input type="number" step="0.01" value={formData.alimentacao} onChange={e => setFormData({ ...formData, alimentacao: e.target.value })} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Dinheiro</label><input type="number" step="0.01" value={formData.dinheiro} onChange={e => setFormData({ ...formData, dinheiro: e.target.value })} /></div>
                                <div className="form-group"><label>PIX</label><input type="number" step="0.01" value={formData.pix} onChange={e => setFormData({ ...formData, pix: e.target.value })} /></div>
                                <div className="form-group"><label>Saídas</label><input type="number" step="0.01" value={formData.saidas} onChange={e => setFormData({ ...formData, saidas: e.target.value })} /></div>
                            </div>

                            <div className="form-group">
                                <label>Observações</label>
                                <textarea rows={2} value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar Fechamento</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
