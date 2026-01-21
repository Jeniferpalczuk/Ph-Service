'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Vale, ValeStatus } from '@/types';
import { MoneyInput } from '@/components/MoneyInput';
import '../shared-modern.css';
// import '../convenios/convenios.css'; // Removed

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
        // Persist 'data' to allow rapid entry for the same day
        setFormData(prev => ({
            ...prev,
            funcionario: '',
            valor: '',
            motivo: '',
            status: 'aberto',
            observacoes: ''
        }));
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

        const [y, m, d] = formData.data.split('-').map(Number);
        const dataAjustada = new Date(y, m - 1, d, 12, 0, 0);

        const payload = {
            funcionario: formData.funcionario,
            valor: parseFloat(formData.valor),
            data: dataAjustada,
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
        <div className="modern-page">
            <div className="modern-header">
                <div className="modern-header-info">
                    <div className="modern-header-subtitle">Gestão de Vales</div>
                    <div className="modern-header-title">
                        {totalPendentes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="modern-header-badges">
                        <div className="modern-badge-summary warning">
                            <span>⚠️</span> Pendentes
                        </div>
                        {totalMarcadosParaDesconto > 0 && (
                            <div className="modern-badge-summary info">
                                <span>📉</span> Desc. Previsto: {totalMarcadosParaDesconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        )}
                        {(searchTerm || selectedMonth) && (
                            <button className="modern-badge-summary neutral" onClick={() => {
                                setSearchTerm('');
                            }} style={{ border: 'none', cursor: 'pointer' }}>
                                🧹 Limpar Busca
                            </button>
                        )}
                    </div>
                </div>
                <button className="btn-modern-primary" onClick={() => setShowModal(true)}>
                    ➕ Novo Vale
                </button>
            </div>

            <div className="modern-filters-container">
                <div className="modern-filter-group" style={{ flex: 2 }}>
                    <label>🔍 Buscar:</label>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Buscar por funcionário ou motivo..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '40px' }}
                        />
                    </div>
                </div>
                <div className="modern-filter-group">
                    <label>📅 Mês de Referência:</label>
                    <select
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                    >
                        {monthOptions.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Seção de funcionários para marcar */}
            <div className="modern-table-container" style={{ marginBottom: '2rem', padding: '1.5rem', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                        📋 Resumo por Funcionário (Mês Atual)
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={markAllForDiscount}
                            className="btn-modern-icon"
                            style={{ width: 'auto', padding: '0 12px', fontSize: '0.85rem' }}
                        >
                            ✅ Marcar Todos
                        </button>
                        <button
                            type="button"
                            onClick={clearAllDiscounts}
                            className="btn-modern-icon"
                            style={{ width: 'auto', padding: '0 12px', fontSize: '0.85rem' }}
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
                                    background: markedForDiscount.has(emp.funcionario) ? '#eff6ff' : '#f8fafc',
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
                                        {emp.vales.length} vale(s) • <span style={{ color: emp.status === 'quitado' ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                                            {emp.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                </div>
                                <span className={`modern-status-badge ${emp.status === 'quitado' ? 'pago' : 'pendente'}`}
                                    style={{
                                        backgroundColor: emp.status === 'quitado' ? '#d1fae5' : '#fffbeb',
                                        color: emp.status === 'quitado' ? '#065f46' : '#d97706'
                                    }}>
                                    {emp.status === 'quitado' ? 'Quitado' : 'Pendente'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="modern-table-container">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>DATA</th>
                            <th>FUNCIONÁRIO</th>
                            <th>MOTIVO</th>
                            <th>VALOR</th>
                            <th>STATUS</th>
                            <th style={{ textAlign: 'right' }}>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Nenhum vale registrado.</td></tr>
                        ) : (
                            filteredItems.map(item => (
                                <tr key={item.id} style={{ background: markedForDiscount.has(item.funcionario) ? '#f0f9ff' : undefined }}>
                                    <td>{new Date(item.data).toLocaleDateString('pt-BR')}</td>
                                    <td className="col-highlight">
                                        {markedForDiscount.has(item.funcionario) && <span style={{ marginRight: '6px' }}>✓</span>}
                                        {item.funcionario}
                                    </td>
                                    <td>{item.motivo}</td>
                                    <td className="col-money-negative">{item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td>
                                        <span className={`modern-status-badge ${item.status === 'quitado' ? 'pago' : 'pendente'}`}
                                            style={{
                                                backgroundColor: item.status === 'quitado' ? '#d1fae5' : '#fffbeb',
                                                color: item.status === 'quitado' ? '#065f46' : '#d97706'
                                            }}
                                        >
                                            {item.status === 'quitado' ? 'Descontado/Quitado' : 'Aberto'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button type="button" className="btn-modern-icon" onClick={() => handleEdit(item)} title="Editar">✏️</button>
                                        {user?.role === 'adm' && (
                                            <button type="button" className="btn-modern-icon" onClick={(e) => handleDelete(item.id, e)} title="Excluir">🗑️</button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay animate-fade-in" onClick={resetForm} style={{
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
                        maxWidth: '600px',
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
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                                    {editingItem ? '✏️ Editar Vale' : '➕ Novo Vale'}
                                </h2>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                                    Registre um adiantamento para o funcionário
                                </p>
                            </div>
                            <button className="btn-modern-icon" onClick={resetForm} style={{ width: '40px', height: '40px', borderRadius: '12px' }}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Funcionário *</label>
                                <select
                                    required
                                    value={formData.funcionario}
                                    onChange={e => setFormData({ ...formData, funcionario: e.target.value })}
                                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem' }}
                                >
                                    <option value="">Selecione um funcionário...</option>
                                    {funcionarios.filter(f => f.ativo).map(f => (
                                        <option key={f.id} value={f.nome}>{f.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Valor *</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#94a3b8' }}>R$</span>
                                        <MoneyInput
                                            required
                                            value={formData.valor}
                                            onChange={(val) => setFormData({ ...formData, valor: val.toString() })}
                                            style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem', fontWeight: 700, color: '#0ea5e9' }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Data *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.data}
                                        onChange={e => setFormData({ ...formData, data: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem' }}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Motivo *</label>
                                <input
                                    required
                                    value={formData.motivo}
                                    onChange={e => setFormData({ ...formData, motivo: e.target.value })}
                                    placeholder="Ex: Adiantamento Quinzenal"
                                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem' }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Status *</label>
                                <select
                                    required
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem' }}
                                >
                                    <option value="aberto">Aberto</option>
                                    <option value="marcado_desconto">Marcado para Desconto</option>
                                    <option value="quitado">Quitado</option>
                                </select>
                            </div>

                            <div style={{
                                marginTop: '2rem',
                                display: 'flex',
                                gap: '1rem',
                                position: 'sticky',
                                bottom: 0,
                                background: '#ffffff',
                                padding: '1rem 0 0 0',
                                borderTop: '1px solid #f1f5f9'
                            }}>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    style={{
                                        flex: 1,
                                        padding: '1rem',
                                        borderRadius: '14px',
                                        background: '#f1f5f9',
                                        color: '#64748b',
                                        fontWeight: 700,
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 2,
                                        padding: '1rem',
                                        borderRadius: '14px',
                                        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                                        color: '#ffffff',
                                        fontWeight: 800,
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: '0 10px 15px -3px rgba(14, 165, 233, 0.3)'
                                    }}
                                >
                                    {editingItem ? 'Salvar Alterações' : 'Adicionar Vale'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
