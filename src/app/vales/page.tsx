'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Vale, ValeStatus } from '@/types';
import '../convenios/convenios.css';

export default function ValesPage() {
    const { user } = useAuth();
    const { vales, funcionarios, addVale, updateVale, deleteVale } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Vale | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Funcionários marcados para desconto no mês
    const [markedForDiscount, setMarkedForDiscount] = useState<Set<string>>(new Set());

    const [formData, setFormData] = useState({
        funcionario: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        motivo: '',
        status: 'aberto' as ValeStatus,
        observacoes: ''
    });

    const resetForm = () => {
        setFormData({
            funcionario: '',
            valor: '',
            data: new Date().toISOString().split('T')[0],
            motivo: '',
            status: 'aberto',
            observacoes: ''
        });
        setEditingItem(null);
        setShowModal(false);
    };

    const handleEdit = (item: Vale) => {
        setEditingItem(item);
        setFormData({
            funcionario: item.funcionario,
            valor: item.valor.toString(),
            data: new Date(item.data).toISOString().split('T')[0],
            motivo: item.motivo,
            status: item.status,
            observacoes: item.observacoes || ''
        });
        setShowModal(true);
    };

    const handleDelete = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm('Excluir este vale?')) deleteVale(id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            funcionario: formData.funcionario,
            valor: parseFloat(formData.valor),
            data: new Date(formData.data),
            motivo: formData.motivo,
            status: formData.status,
            observacoes: formData.observacoes
        };

        if (editingItem) updateVale(editingItem.id, payload);
        else addVale(payload);

        resetForm();
    };

    // Toggle funcionário marcado para desconto
    const toggleDiscount = (funcionarioNome: string) => {
        setMarkedForDiscount(prev => {
            const newSet = new Set(prev);
            if (newSet.has(funcionarioNome)) {
                newSet.delete(funcionarioNome);
            } else {
                newSet.add(funcionarioNome);
            }
            return newSet;
        });
    };

    // Marcar todos para desconto
    const markAllForDiscount = () => {
        const toMark = new Set(valesByEmployee.map(v => v.funcionario));
        setMarkedForDiscount(toMark);
    };

    // Desmarcar todos
    const clearAllDiscounts = () => {
        setMarkedForDiscount(new Set());
    };

    // Filtrar vales por mês selecionado
    const filteredByMonth = useMemo(() => {
        return vales.filter(v => {
            const d = new Date(v.data);
            const valeMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            return valeMonth === selectedMonth;
        });
    }, [vales, selectedMonth]);

    const filteredItems = useMemo(() => {
        return filteredByMonth.filter(v =>
            v.funcionario.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.motivo.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [filteredByMonth, searchTerm]);

    // Agrupar vales por funcionário
    const valesByEmployee = useMemo(() => {
        const groups: { funcionario: string; total: number; vales: Vale[]; status: 'aberto' | 'quitado' }[] = [];
        const map = new Map<string, Vale[]>();

        filteredItems.forEach(v => {
            if (!map.has(v.funcionario)) map.set(v.funcionario, []);
            map.get(v.funcionario)!.push(v);
        });

        map.forEach((valesArr, funcionario) => {
            const total = valesArr.reduce((sum, v) => sum + v.valor, 0);
            const allQuitado = valesArr.every(v => v.status === 'quitado');
            groups.push({ funcionario, total, vales: valesArr, status: allQuitado ? 'quitado' : 'aberto' });
        });

        return groups.sort((a, b) => b.total - a.total);
    }, [filteredItems]);

    const totalPendentes = filteredItems
        .filter(v => v.status === 'aberto')
        .reduce((sum, v) => sum + v.valor, 0);

    const totalMarcadosParaDesconto = useMemo(() => {
        return valesByEmployee
            .filter(v => markedForDiscount.has(v.funcionario) && v.status === 'aberto')
            .reduce((sum, v) => sum + v.total, 0);
    }, [valesByEmployee, markedForDiscount]);

    // Gerar meses para seleção
    const monthOptions = useMemo(() => {
        const months = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            });
        }
        return months;
    }, []);

    return (
        <div className="convenios-page">
            <div className="page-header">
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-label">Total Pendente ({filteredByMonth.filter(v => v.status === 'aberto').length} vales)</span>
                        <span className="stat-value text-danger">{totalPendentes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Marcados p/ Desconto</span>
                        <span className="stat-value text-warning">{valesByEmployee.filter(v => markedForDiscount.has(v.funcionario)).reduce((s, v) => s + v.total, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Novo Vale</button>
            </div>

            <div className="filters-bar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.1rem' }}>🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar por funcionário ou motivo..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="search-input"
                        style={{ paddingLeft: '40px' }}
                    />
                </div>
                <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="filter-select"
                    style={{ minWidth: '180px' }}
                >
                    {monthOptions.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>
            </div>

            {/* Seção de funcionários para marcar */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                        📋 Funcionários com Vales no Mês
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={markAllForDiscount}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                        >
                            ✅ Marcar Todos
                        </button>
                        <button
                            type="button"
                            onClick={clearAllDiscounts}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                        >
                            ❌ Limpar
                        </button>
                    </div>
                </div>

                {valesByEmployee.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                        Nenhum vale encontrado neste mês
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {valesByEmployee.map(emp => (
                            <div
                                key={emp.funcionario}
                                onClick={() => toggleDiscount(emp.funcionario)}
                                style={{
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: markedForDiscount.has(emp.funcionario) ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                    background: markedForDiscount.has(emp.funcionario) ? '#eff6ff' : '#fff',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem'
                                }}
                            >
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '6px',
                                    border: markedForDiscount.has(emp.funcionario) ? 'none' : '2px solid #cbd5e1',
                                    background: markedForDiscount.has(emp.funcionario) ? '#3b82f6' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {markedForDiscount.has(emp.funcionario) && (
                                        <span style={{ color: 'white', fontSize: '14px' }}>✓</span>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>{emp.funcionario}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        {emp.vales.length} vale(s) • <span className={emp.status === 'quitado' ? 'text-success' : 'text-danger'}>
                                            {emp.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                </div>
                                <span className={`badge ${emp.status === 'quitado' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                                    {emp.status === 'quitado' ? 'Quitado' : 'Pendente'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="table-container card">
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Funcionário</th>
                            <th>Motivo</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length === 0 ? (
                            <tr><td colSpan={6} className="text-center">Nenhum vale registrado.</td></tr>
                        ) : (
                            filteredItems.map(item => (
                                <tr key={item.id} style={{ background: markedForDiscount.has(item.funcionario) ? '#f0f9ff' : undefined }}>
                                    <td>{new Date(item.data).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 600 }}>
                                        {markedForDiscount.has(item.funcionario) && <span style={{ marginRight: '6px' }}>✓</span>}
                                        {item.funcionario}
                                    </td>
                                    <td>{item.motivo}</td>
                                    <td className="text-danger font-semibold">{item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td>
                                        <span className={`badge ${item.status === 'quitado' ? 'badge-success' : 'badge-warning'}`}>
                                            {item.status === 'quitado' ? 'Descontado/Quitado' : 'Aberto'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button type="button" className="btn-icon" onClick={() => handleEdit(item)} style={{ cursor: 'pointer' }}>✏️</button>
                                            {user?.role === 'adm' && (
                                                <button type="button" className="btn-icon" onClick={(e) => handleDelete(item.id, e)} style={{ cursor: 'pointer' }}>🗑️</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingItem ? 'Editar Vale' : 'Novo Vale'}</h2>
                            <button className="modal-close" onClick={resetForm}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Funcionário *</label>
                                <select required value={formData.funcionario} onChange={e => setFormData({ ...formData, funcionario: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    {funcionarios.filter(f => f.ativo).length > 0 ? (
                                        funcionarios.filter(f => f.ativo).map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)
                                    ) : (
                                        <option value="" disabled>Nenhum funcionário ativo</option>
                                    )}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Valor (R$) *</label>
                                    <input type="number" step="0.01" min="0" placeholder="0.00" required value={formData.valor} onChange={e => setFormData({ ...formData, valor: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Data *</label>
                                    <input type="date" required value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Motivo</label>
                                <input required placeholder="Ex: Adiantamento, Remédio" value={formData.motivo} onChange={e => setFormData({ ...formData, motivo: e.target.value })} />
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as ValeStatus })}>
                                    <option value="aberto">Aberto (A descontar)</option>
                                    <option value="quitado">Quitado / Descontado</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Observações</label>
                                <textarea rows={2} value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
