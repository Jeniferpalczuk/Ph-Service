'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Saida, ExpenseCategory, PaymentMethod } from '@/types';
import { useAuth } from '@/context/AuthContext';
import '../shared-modern.css';

export default function SaidasPage() {
    const { user } = useAuth();
    const { saidas, addSaida, updateSaida, deleteSaida, fornecedores } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editingSaida, setEditingSaida] = useState<Saida | null>(null);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    const [formData, setFormData] = useState({
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        categoria: 'outros' as ExpenseCategory,
        formaPagamento: 'dinheiro' as PaymentMethod,
        fornecedor: '',
        observacoes: '',
    });

    const CATEGORY_MAP: Record<string, ExpenseCategory> = {
        'Fornecedores': 'fornecedores',
        'Funcionários': 'funcionarios',
        'Aluguel': 'aluguel',
        'Energia': 'energia',
        'Água': 'agua',
        'Gás': 'gas',
        'Internet': 'internet',
        'Telefone': 'telefone',
        'Impostos': 'impostos',
        'Manutenção': 'manutencao',
        'Marketing': 'marketing',
        'Outros': 'outros'
    };

    const categorias = Object.keys(CATEGORY_MAP);
    const pagamentos: PaymentMethod[] = ['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia'];

    const resetForm = () => {
        setFormData({
            descricao: '',
            valor: '',
            data: new Date().toISOString().split('T')[0],
            categoria: 'outros' as ExpenseCategory,
            formaPagamento: 'dinheiro' as PaymentMethod,
            fornecedor: '',
            observacoes: '',
        });
        setEditingSaida(null);
        setShowModal(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const [y, m, d] = formData.data.split('-').map(Number);
        const dataAjustada = new Date(y, m - 1, d, 12, 0, 0);

        const saidaData = {
            descricao: formData.descricao,
            valor: parseFloat(formData.valor),
            data: dataAjustada,
            categoria: formData.categoria,
            formaPagamento: formData.formaPagamento,
            fornecedor: formData.fornecedor || undefined,
            observacoes: formData.observacoes || undefined,
            anexos: []
        };

        if (editingSaida) {
            updateSaida(editingSaida.id, saidaData);
        } else {
            addSaida(saidaData);
        }
        resetForm();
    };

    const handleEdit = (saida: Saida) => {
        setEditingSaida(saida);
        setFormData({
            descricao: saida.descricao,
            valor: saida.valor.toString(),
            data: new Date(saida.data).toISOString().split('T')[0],
            categoria: saida.categoria as ExpenseCategory,
            formaPagamento: saida.formaPagamento as PaymentMethod,
            fornecedor: saida.fornecedor || '',
            observacoes: saida.observacoes || '',
        });
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta saída?')) {
            deleteSaida(id);
        }
    };

    const filteredSaidas = useMemo(() => {
        return saidas.filter(s => {
            const matchesSearch = s.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
            const matchesCategory = filterCategory === 'all' || s.categoria === filterCategory;
            return matchesSearch && matchesCategory;
        }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    }, [saidas, searchTerm, filterCategory]);

    const totalSaidas = filteredSaidas.reduce((sum, s) => sum + s.valor, 0);

    return (
        <div className="modern-page">
            <div className="modern-header">
                <div className="modern-header-info">
                    <div className="modern-header-subtitle">Gestão de Despesas</div>
                    <div className="modern-header-title">
                        {totalSaidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="modern-header-badges">
                        <div className="modern-badge-summary danger">
                            <span>💸</span> {filteredSaidas.length} lançamentos
                        </div>
                        {(searchTerm || filterCategory !== 'all') && (
                            <button className="modern-badge-summary neutral" onClick={() => { setSearchTerm(''); setFilterCategory('all'); }} style={{ border: 'none', cursor: 'pointer' }}>
                                🧹 Limpar Filtros
                            </button>
                        )}
                    </div>
                </div>
                <button className="btn-modern-primary" onClick={() => setShowModal(true)}>
                    <span>+</span> Nova Saída
                </button>
            </div>

            <div className="modern-filters-container">
                <div className="modern-filter-group">
                    <label>🔍 Buscar:</label>
                    <input
                        type="text"
                        placeholder="Descrição ou fornecedor..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="modern-filter-group">
                    <label>📂 Categoria:</label>
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                        <option value="all">Todas as Categorias</option>
                        {Object.entries(CATEGORY_MAP).map(([label, value]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="modern-table-container">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>DATA</th>
                            <th>DESCRIÇÃO / FORNECEDOR</th>
                            <th>CATEGORIA</th>
                            <th>FORMA</th>
                            <th>VALOR</th>
                            <th style={{ textAlign: 'right' }}>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSaidas.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Nenhuma saída registrada.</td></tr>
                        ) : (
                            filteredSaidas.map(saida => (
                                <tr key={saida.id}>
                                    <td>{new Date(saida.data).toLocaleDateString('pt-BR')}</td>
                                    <td>
                                        <div className="col-highlight">{saida.descricao}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{saida.fornecedor || '-'}</div>
                                    </td>
                                    <td>
                                        <span className="modern-status-badge neutral" style={{ textTransform: 'capitalize' }}>{saida.categoria}</span>
                                    </td>
                                    <td style={{ textTransform: 'capitalize' }}>{saida.formaPagamento.replace('_', ' ')}</td>
                                    <td className="col-money-negative">{saida.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button className="btn-modern-icon" onClick={() => handleEdit(saida)}>✏️</button>
                                        <button className="btn-modern-icon" onClick={() => handleDelete(saida.id)}>🗑️</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="modern-footer">
                    <div className="modern-footer-totals">
                        <div className="modern-total-item">Total do Período: <b className="red">{totalSaidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b></div>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2>{editingSaida ? 'Editar Saída' : 'Nova Saída'}</h2>
                            <button className="modal-close" onClick={resetForm}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Descrição *</label>
                                <input required value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Valor *</label>
                                    <input type="number" step="0.01" required value={formData.valor} onChange={e => setFormData({ ...formData, valor: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Data *</label>
                                    <input type="date" required value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Categoria *</label>
                                    <select value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value as ExpenseCategory })}>
                                        {Object.entries(CATEGORY_MAP).map(([label, value]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Forma de Pagamento *</label>
                                    <select value={formData.formaPagamento} onChange={e => setFormData({ ...formData, formaPagamento: e.target.value as PaymentMethod })}>
                                        {pagamentos.map(p => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Fornecedor</label>
                                <input
                                    list="fornecedores-saidas-list"
                                    value={formData.fornecedor}
                                    onChange={e => setFormData({ ...formData, fornecedor: e.target.value })}
                                    placeholder="Selecione ou digite..."
                                />
                                <datalist id="fornecedores-saidas-list">
                                    {fornecedores.filter(f => f.ativo).map(f => (
                                        <option key={f.id} value={f.nome}>{f.nome}</option>
                                    ))}
                                </datalist>
                            </div>

                            <div className="form-group">
                                <label>Observações</label>
                                <textarea rows={2} value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar Saída</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
