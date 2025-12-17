'use client';

import { useState } from 'react';
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

    const filteredItems = vales.filter(v =>
        v.funcionario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.motivo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPendentes = filteredItems
        .filter(v => v.status === 'aberto')
        .reduce((sum, v) => sum + v.valor, 0);

    return (
        <div className="convenios-page">
            <div className="page-header">
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-label">Total em Vales (Pendentes)</span>
                        <span className="stat-value text-danger">R$ {totalPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Novo Vale</button>
            </div>

            <div className="filters-bar">
                <input
                    type="text"
                    placeholder="Buscar por funcionário ou motivo..."
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
                                <tr key={item.id}>
                                    <td>{new Date(item.data).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 600 }}>{item.funcionario}</td>
                                    <td>{item.motivo}</td>
                                    <td className="text-danger font-semibold">R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
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
                                    {funcionarios.length > 0 ? (
                                        funcionarios.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)
                                    ) : (
                                        <option value="" disabled>Nenhum funcionário cadastrado</option>
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
