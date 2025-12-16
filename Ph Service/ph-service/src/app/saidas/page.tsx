'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Saida, ExpenseCategory, PaymentMethod } from '@/types';
import '../convenios/convenios.css';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
    'fornecedores', 'funcionarios', 'aluguel', 'energia', 'agua', 'gas',
    'internet', 'telefone', 'impostos', 'manutencao', 'marketing', 'outros'
];

export default function SaidasPage() {
    const { user } = useAuth();
    const { saidas, addSaida, updateSaida, deleteSaida, fornecedores } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Saida | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        descricao: '',
        valor: '',
        categoria: 'outros' as ExpenseCategory,
        formaPagamento: 'dinheiro' as PaymentMethod,
        data: new Date().toISOString().split('T')[0],
        fornecedor: '',
        observacoes: ''
    });

    const resetForm = () => {
        setFormData({
            descricao: '',
            valor: '',
            categoria: 'outros',
            formaPagamento: 'dinheiro',
            data: new Date().toISOString().split('T')[0],
            fornecedor: '',
            observacoes: ''
        });
        setEditingItem(null);
        setShowModal(false);
    };

    const handleEdit = (item: Saida) => {
        setEditingItem(item);
        setFormData({
            descricao: item.descricao,
            valor: item.valor.toString(),
            categoria: item.categoria,
            formaPagamento: item.formaPagamento,
            data: new Date(item.data).toISOString().split('T')[0],
            fornecedor: item.fornecedor || '',
            observacoes: item.observacoes || ''
        });
        setShowModal(true);
    };

    const handleDelete = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm('Excluir esta despesa?')) deleteSaida(id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            descricao: formData.descricao,
            valor: parseFloat(formData.valor),
            categoria: formData.categoria,
            formaPagamento: formData.formaPagamento,
            data: new Date(formData.data),
            fornecedor: formData.fornecedor,
            observacoes: formData.observacoes,
            anexos: []
        };

        if (editingItem) updateSaida(editingItem.id, payload);
        else addSaida(payload);

        resetForm();
    };

    const filteredItems = saidas.filter(s =>
        s.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.categoria && s.categoria.includes(searchTerm.toLowerCase()))
    );

    const totalDespesas = filteredItems.reduce((sum, s) => sum + s.valor, 0);

    return (
        <div className="convenios-page">
            <div className="page-header">
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-label">Total Despesas</span>
                        <span className="stat-value text-danger">R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Nova Despesa</button>
            </div>

            <div className="filters-bar">
                <input
                    type="text"
                    placeholder="Buscar por descrição ou categoria..."
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
                            <th>Descrição</th>
                            <th>Categoria</th>
                            <th>Valor</th>
                            <th>Pagamento</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length === 0 ? (
                            <tr><td colSpan={6} className="text-center">Nenhuma despesa registrada.</td></tr>
                        ) : (
                            filteredItems.map(item => (
                                <tr key={item.id}>
                                    <td>{new Date(item.data).toLocaleDateString()}</td>
                                    <td className="font-semibold">{item.descricao}</td>
                                    <td><span className="badge badge-neutral">{item.categoria}</span></td>
                                    <td className="text-danger font-semibold">
                                        R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td>{item.formaPagamento.replace('_', ' ')}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-icon" onClick={() => handleEdit(item)}>✏️</button>
                                            {user?.role === 'adm' && (
                                                <button className="btn-icon" onClick={(e) => handleDelete(item.id, e)}>🗑️</button>
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
                            <h2>{editingItem ? 'Editar Despesa' : 'Nova Despesa'}</h2>
                            <button className="modal-close" onClick={resetForm}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Descrição *</label>
                                <input required value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} />
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
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Categoria *</label>
                                    <select required value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value as any })}>
                                        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Pagamento *</label>
                                    <select required value={formData.formaPagamento} onChange={e => setFormData({ ...formData, formaPagamento: e.target.value as any })}>
                                        <option value="dinheiro">Dinheiro</option>
                                        <option value="pix">PIX</option>
                                        <option value="cartao_credito">Cartão Crédito</option>
                                        <option value="cartao_debito">Cartão Débito</option>
                                        <option value="boleto">Boleto</option>
                                        <option value="transferencia">Transferência</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Fornecedor (Opções Cadastradas)</label>
                                <input
                                    list="fornecedores-list"
                                    placeholder="Selecione ou digite um novo..."
                                    value={formData.fornecedor}
                                    onChange={e => setFormData({ ...formData, fornecedor: e.target.value })}
                                />
                                <datalist id="fornecedores-list">
                                    {fornecedores.map(f => (
                                        <option key={f.id} value={f.nome} />
                                    ))}
                                </datalist>
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
