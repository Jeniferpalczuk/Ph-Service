'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Boleto, PaymentStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';
import '../convenios/convenios.css';

export default function BoletosPage() {
    const { user } = useAuth();
    const { boletos, addBoleto, updateBoleto, deleteBoleto } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editingBoleto, setEditingBoleto] = useState<Boleto | null>(null);

    const [formData, setFormData] = useState({
        cliente: '',
        valor: '',
        banco: '',
        dataVencimento: '',
        dataPagamento: '',
        statusPagamento: 'pendente' as PaymentStatus,
        observacoes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const boletoData = {
            cliente: formData.cliente,
            valor: parseFloat(formData.valor),
            banco: formData.banco,
            dataVencimento: new Date(formData.dataVencimento),
            dataPagamento: formData.dataPagamento ? new Date(formData.dataPagamento) : undefined,
            statusPagamento: formData.statusPagamento,
            observacoes: formData.observacoes || undefined,
        };

        if (editingBoleto) {
            updateBoleto(editingBoleto.id, boletoData);
        } else {
            addBoleto(boletoData);
        }

        resetForm();
    };

    const resetForm = () => {
        setFormData({
            cliente: '',
            valor: '',
            banco: '',
            dataVencimento: '',
            dataPagamento: '',
            statusPagamento: 'pendente',
            observacoes: '',
        });
        setEditingBoleto(null);
        setShowModal(false);
    };

    const handleEdit = (boleto: Boleto) => {
        setEditingBoleto(boleto);
        setFormData({
            cliente: boleto.cliente,
            valor: boleto.valor.toString(),
            banco: boleto.banco,
            dataVencimento: new Date(boleto.dataVencimento).toISOString().split('T')[0],
            dataPagamento: boleto.dataPagamento ? new Date(boleto.dataPagamento).toISOString().split('T')[0] : '',
            statusPagamento: boleto.statusPagamento,
            observacoes: boleto.observacoes || '',
        });
        setShowModal(true);
    };

    const handleDelete = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm('Tem certeza que deseja excluir este boleto?')) {
            deleteBoleto(id);
        }
    };

    const totalValor = boletos.reduce((sum, b) => sum + b.valor, 0);
    const totalPago = boletos.filter(b => b.statusPagamento === 'pago').reduce((sum, b) => sum + b.valor, 0);
    const totalPendente = boletos.filter(b => b.statusPagamento !== 'pago').reduce((sum, b) => sum + b.valor, 0);

    return (
        <div className="convenios-page">
            <div className="page-header">
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-label">Total</span>
                        <span className="stat-value">R$ {totalValor.toFixed(2)}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Pago</span>
                        <span className="stat-value text-success">R$ {totalPago.toFixed(2)}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Pendente</span>
                        <span className="stat-value text-warning">R$ {totalPendente.toFixed(2)}</span>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    ➕ Novo Boleto
                </button>
            </div>

            <div className="table-container card">
                <table>
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Banco</th>
                            <th>Valor</th>
                            <th>Vencimento</th>
                            <th>Pagamento</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {boletos.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center">
                                    Nenhum boleto registrado
                                </td>
                            </tr>
                        ) : (
                            boletos.map((boleto) => (
                                <tr key={boleto.id}>
                                    <td className="font-semibold">{boleto.cliente}</td>
                                    <td>{boleto.banco}</td>
                                    <td className="font-semibold">R$ {boleto.valor.toFixed(2)}</td>
                                    <td>{new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}</td>
                                    <td>{boleto.dataPagamento ? new Date(boleto.dataPagamento).toLocaleDateString('pt-BR') : '-'}</td>
                                    <td>
                                        <span className={`badge ${boleto.statusPagamento === 'pago' ? 'badge-success' : 'badge-warning'}`}>
                                            {boleto.statusPagamento === 'pago' ? 'Pago' : 'Pendente'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-icon" onClick={() => handleEdit(boleto)}>✏️</button>
                                            {user?.role === 'adm' && (
                                                <button className="btn-icon" onClick={(e) => handleDelete(boleto.id, e)}>🗑️</button>
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
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingBoleto ? 'Editar Boleto' : 'Novo Boleto'}</h2>
                            <button className="modal-close" onClick={resetForm}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Cliente *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.cliente}
                                        onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Banco *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.banco}
                                        onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Valor *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        required
                                        value={formData.valor}
                                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Data de Vencimento *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.dataVencimento}
                                        onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Data de Pagamento</label>
                                    <input
                                        type="date"
                                        value={formData.dataPagamento}
                                        onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Status *</label>
                                    <select
                                        required
                                        value={formData.statusPagamento}
                                        onChange={(e) => setFormData({ ...formData, statusPagamento: e.target.value as PaymentStatus })}
                                    >
                                        <option value="pendente">Pendente</option>
                                        <option value="pago">Pago</option>
                                        <option value="vencido">Vencido</option>
                                        <option value="parcial">Parcial</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Observações</label>
                                <textarea
                                    rows={3}
                                    value={formData.observacoes}
                                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingBoleto ? 'Atualizar' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
