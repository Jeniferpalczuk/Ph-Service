'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { FechamentoCaixa } from '@/types';
import { useAuth } from '@/context/AuthContext';
import '../convenios/convenios.css';

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

    const handleDelete = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm('Tem certeza que deseja excluir este fechamento?')) {
            deleteFechamentoCaixa(id);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Fix Data Timezone: Create date at noon to avoid UTC midnight shifts
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

    // Logic for Turno Tarde Calculation
    const fechamentoManha = formData.turno === 'tarde'
        ? fechamentosCaixa.find(f =>
            new Date(f.data).toISOString().split('T')[0] === formData.data &&
            f.turno === 'manha'
        )
        : null;

    useEffect(() => {
        if (formData.turno === 'tarde' && fechamentoManha && calculoMode) {
            // Auto calculate based on readings
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


    // Filter Logic
    const filteredItems = fechamentosCaixa.filter(item =>
        item.funcionario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(item.data).toLocaleDateString().includes(searchTerm)
    ).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    return (
        <div className="convenios-page">
            <div className="page-header">
                <h2>Fechamento de Caixa</h2>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        ➕ Novo Fechamento
                    </button>
                </div>
            </div>

            <div className="filters-bar">
                <input
                    type="text"
                    placeholder="Buscar por funcionário ou data..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="table-container card">
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Turno</th>
                            <th>Funcionário</th>
                            <th>Entradas (Total)</th>
                            <th>Saídas</th>
                            <th>Líquido</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length === 0 ? (
                            <tr><td colSpan={7} className="text-center">Nenhum fechamento registrado.</td></tr>
                        ) : (
                            filteredItems.map(item => {
                                const totalEntradas = Object.values(item.entradas).reduce((a, b) => a + b, 0);
                                return (
                                    <tr key={item.id}>
                                        <td>{new Date(item.data).toLocaleDateString('pt-BR')}</td>
                                        <td>
                                            <span className={`badge ${item.turno === 'manha' ? 'badge-primary' : 'badge-warning'}`}>
                                                {item.turno === 'manha' ? '☀️ Manhã' : '🌙 Tarde'}
                                            </span>
                                        </td>
                                        <td className="font-semibold">{item.funcionario}</td>
                                        <td className="text-success font-semibold">R$ {totalEntradas.toFixed(2)}</td>
                                        <td className="text-danger">R$ {item.saidas.toFixed(2)}</td>
                                        <td className="font-bold">R$ {(totalEntradas - item.saidas).toFixed(2)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-icon" onClick={() => handleEdit(item)}>✏️</button>
                                                {user?.role === 'adm' && (
                                                    <button className="btn-icon" onClick={(e) => handleDelete(item.id, e)}>🗑️</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2>{editingItem ? 'Editar Fechamento' : 'Novo Fechamento'}</h2>
                            <button className="modal-close" onClick={resetForm}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Data *</label>
                                    <input
                                        type="date" required
                                        value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Turno *</label>
                                    <select
                                        value={formData.turno}
                                        onChange={e => {
                                            setFormData({ ...formData, turno: e.target.value as any });
                                            setCalculoMode(false); // Reset calc mode on change
                                        }}
                                        disabled={!!editingItem} // Avoid validation issues if editing logic is complex
                                    >
                                        <option value="manha">Manhã</option>
                                        <option value="tarde">Tarde</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Funcionário *</label>
                                {funcionarios.length > 0 ? (
                                    <select
                                        required
                                        value={formData.funcionario}
                                        onChange={e => setFormData({ ...formData, funcionario: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {funcionarios.filter(f => f.ativo).map(f => (
                                            <option key={f.id} value={f.nome}>{f.nome}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text" required placeholder="Nome do Funcionário"
                                        value={formData.funcionario} onChange={e => setFormData({ ...formData, funcionario: e.target.value })}
                                    />
                                )}
                            </div>

                            {formData.turno === 'tarde' && fechamentoManha && !editingItem && (
                                <div className="info-box" style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <h4 style={{ margin: 0 }}>📊 Calculadora de Turno (T2)</h4>
                                        <label style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={calculoMode} onChange={e => setCalculoMode(e.target.checked)} />
                                            Ativar Cálculo Automático
                                        </label>
                                    </div>

                                    {calculoMode && (
                                        <div className="calc-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            <small style={{ gridColumn: '1 / -1', color: 'var(--text-secondary)' }}>
                                                Digite o valor TOTAL ACUMULADO do dia (Maquininha). O sistema subtrairá o valor da Manhã.
                                            </small>

                                            <div className="form-group">
                                                <label>Total Crédito (Dia)</label>
                                                <input
                                                    type="number" step="0.01" min="0" placeholder="0.00"
                                                    value={leituras.credito} onChange={e => setLeituras({ ...leituras, credito: e.target.value })}
                                                />
                                                <small>Manhã: R$ {fechamentoManha.entradas.credito.toFixed(2)}</small>
                                            </div>
                                            <div className="form-group">
                                                <label>Total Débito (Dia)</label>
                                                <input
                                                    type="number" step="0.01" min="0" placeholder="0.00"
                                                    value={leituras.debito} onChange={e => setLeituras({ ...leituras, debito: e.target.value })}
                                                />
                                                <small>Manhã: R$ {fechamentoManha.entradas.debito.toFixed(2)}</small>
                                            </div>
                                            <div className="form-group">
                                                <label>Total Alimentação (Dia)</label>
                                                <input
                                                    type="number" step="0.01" min="0" placeholder="0.00"
                                                    value={leituras.alimentacao} onChange={e => setLeituras({ ...leituras, alimentacao: e.target.value })}
                                                />
                                                <small>Manhã: R$ {fechamentoManha.entradas.alimentacao.toFixed(2)}</small>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="section-title" style={{ marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 600 }}>💵 Entradas (Valores do Turno)</div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Crédito</label>
                                    <input type="number" step="0.01" min="0" placeholder="0.00"
                                        value={formData.credito} onChange={e => setFormData({ ...formData, credito: e.target.value })}
                                        disabled={calculoMode}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Débito</label>
                                    <input type="number" step="0.01" min="0" placeholder="0.00"
                                        value={formData.debito} onChange={e => setFormData({ ...formData, debito: e.target.value })}
                                        disabled={calculoMode}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Alimentação</label>
                                    <input type="number" step="0.01" min="0" placeholder="0.00"
                                        value={formData.alimentacao} onChange={e => setFormData({ ...formData, alimentacao: e.target.value })}
                                        disabled={calculoMode}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Dinheiro (Espécie)</label>
                                    <input type="number" step="0.01" min="0" placeholder="0.00"
                                        value={formData.dinheiro} onChange={e => setFormData({ ...formData, dinheiro: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>PIX</label>
                                    <input type="number" step="0.01" min="0" placeholder="0.00"
                                        value={formData.pix} onChange={e => setFormData({ ...formData, pix: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="section-title" style={{ marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 600 }}>📤 Saídas</div>
                            <div className="form-group">
                                <label>Total Saídas (Se houver)</label>
                                <input
                                    type="number" step="0.01" min="0" placeholder="0.00"
                                    value={formData.saidas} onChange={e => setFormData({ ...formData, saidas: e.target.value })}
                                />
                                <small style={{ color: 'var(--text-tertiary)' }}>Registre o valor total retirado do caixa durante o turno.</small>
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
