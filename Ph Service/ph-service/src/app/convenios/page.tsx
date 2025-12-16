'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Convenio, PaymentStatus, ClosingType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import './convenios.css';

export default function ConveniosPage() {
    const { user } = useAuth();
    const { convenios, addConvenio, updateConvenio, deleteConvenio } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editingConvenio, setEditingConvenio] = useState<Convenio | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'todos'>('todos');

    // Form state
    const [formData, setFormData] = useState({
        empresaCliente: '',
        tipoFechamento: 'mensal' as ClosingType,
        periodoReferencia: '',
        dataFechamento: '',
        valorBoleto: '',
        banco: '',
        dataVencimento: '',
        dataPagamento: '',
        statusPagamento: 'pendente' as PaymentStatus,
        notaFiscal: '',
        enviadoPara: '',
        observacoes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const convenioData = {
            empresaCliente: formData.empresaCliente,
            tipoFechamento: formData.tipoFechamento,
            periodoReferencia: formData.periodoReferencia,
            dataFechamento: new Date(formData.dataFechamento),
            valorBoleto: parseFloat(formData.valorBoleto),
            banco: formData.banco,
            dataVencimento: new Date(formData.dataVencimento),
            dataPagamento: formData.dataPagamento ? new Date(formData.dataPagamento) : undefined,
            statusPagamento: formData.statusPagamento,
            notaFiscal: formData.notaFiscal || undefined,
            enviadoPara: formData.enviadoPara || undefined,
            observacoes: formData.observacoes || undefined,
            anexos: [],
        };

        if (editingConvenio) {
            updateConvenio(editingConvenio.id, convenioData);
        } else {
            addConvenio(convenioData);
        }

        resetForm();
    };

    const resetForm = () => {
        setFormData({
            empresaCliente: '',
            tipoFechamento: 'mensal',
            periodoReferencia: '',
            dataFechamento: '',
            valorBoleto: '',
            banco: '',
            dataVencimento: '',
            dataPagamento: '',
            statusPagamento: 'pendente',
            notaFiscal: '',
            enviadoPara: '',
            observacoes: '',
        });
        setEditingConvenio(null);
        setShowModal(false);
    };

    const handleEdit = (convenio: Convenio) => {
        setEditingConvenio(convenio);
        setFormData({
            empresaCliente: convenio.empresaCliente,
            tipoFechamento: convenio.tipoFechamento,
            periodoReferencia: convenio.periodoReferencia,
            dataFechamento: new Date(convenio.dataFechamento).toISOString().split('T')[0],
            valorBoleto: convenio.valorBoleto.toString(),
            banco: convenio.banco,
            dataVencimento: new Date(convenio.dataVencimento).toISOString().split('T')[0],
            dataPagamento: convenio.dataPagamento ? new Date(convenio.dataPagamento).toISOString().split('T')[0] : '',
            statusPagamento: convenio.statusPagamento,
            notaFiscal: convenio.notaFiscal || '',
            enviadoPara: convenio.enviadoPara || '',
            observacoes: convenio.observacoes || '',
        });
        setShowModal(true);
    };

    const handleDelete = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm('Tem certeza que deseja excluir este convênio?')) {
            deleteConvenio(id);
        }
    };

    const getStatusBadge = (status: PaymentStatus) => {
        const badges = {
            pago: 'badge-success',
            pendente: 'badge-warning',
            vencido: 'badge-danger',
            parcial: 'badge-primary',
        };
        return badges[status];
    };

    const getStatusLabel = (status: PaymentStatus) => {
        const labels = {
            pago: 'Pago',
            pendente: 'Pendente',
            vencido: 'Vencido',
            parcial: 'Parcial',
        };
        return labels[status];
    };

    // Filter convenios
    const filteredConvenios = convenios.filter(convenio => {
        const matchesSearch = convenio.empresaCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
            convenio.periodoReferencia.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'todos' || convenio.statusPagamento === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const totalValor = filteredConvenios.reduce((sum, c) => sum + c.valorBoleto, 0);
    const totalPago = filteredConvenios.filter(c => c.statusPagamento === 'pago').reduce((sum, c) => sum + c.valorBoleto, 0);
    const totalPendente = filteredConvenios.filter(c => c.statusPagamento !== 'pago').reduce((sum, c) => sum + c.valorBoleto, 0);

    return (
        <div className="convenios-page">
            {/* Header */}
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
                    ➕ Novo Convênio
                </button>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <input
                    type="text"
                    placeholder="Buscar por empresa ou período..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as PaymentStatus | 'todos')}
                    className="filter-select"
                >
                    <option value="todos">Todos os Status</option>
                    <option value="pago">Pago</option>
                    <option value="pendente">Pendente</option>
                    <option value="vencido">Vencido</option>
                    <option value="parcial">Parcial</option>
                </select>
            </div>

            {/* Table */}
            <div className="table-container card">
                <table>
                    <thead>
                        <tr>
                            <th>Empresa/Cliente</th>
                            <th>Tipo</th>
                            <th>Período</th>
                            <th>Valor</th>
                            <th>Banco</th>
                            <th>Vencimento</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredConvenios.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center">
                                    Nenhum convênio encontrado
                                </td>
                            </tr>
                        ) : (
                            filteredConvenios.map((convenio) => (
                                <tr key={convenio.id}>
                                    <td className="font-semibold">{convenio.empresaCliente}</td>
                                    <td>{convenio.tipoFechamento}</td>
                                    <td>{convenio.periodoReferencia}</td>
                                    <td className="font-semibold">R$ {convenio.valorBoleto.toFixed(2)}</td>
                                    <td>{convenio.banco}</td>
                                    <td>{new Date(convenio.dataVencimento).toLocaleDateString('pt-BR')}</td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(convenio.statusPagamento)}`}>
                                            {getStatusLabel(convenio.statusPagamento)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-icon btn-edit"
                                                onClick={() => handleEdit(convenio)}
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            {user?.role === 'adm' && (
                                                <button
                                                    className="btn-icon btn-delete"
                                                    onClick={(e) => handleDelete(convenio.id, e)}
                                                    title="Excluir"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingConvenio ? 'Editar Convênio' : 'Novo Convênio'}</h2>
                            <button className="modal-close" onClick={resetForm}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Empresa/Cliente *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.empresaCliente}
                                        onChange={(e) => setFormData({ ...formData, empresaCliente: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tipo de Fechamento *</label>
                                    <select
                                        required
                                        value={formData.tipoFechamento}
                                        onChange={(e) => setFormData({ ...formData, tipoFechamento: e.target.value as ClosingType })}
                                    >
                                        <option value="mensal">Mensal</option>
                                        <option value="quinzenal">Quinzenal</option>
                                        <option value="semanal">Semanal</option>
                                        <option value="personalizado">Personalizado</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Período de Referência *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Janeiro/2024"
                                        value={formData.periodoReferencia}
                                        onChange={(e) => setFormData({ ...formData, periodoReferencia: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Data do Fechamento *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.dataFechamento}
                                        onChange={(e) => setFormData({ ...formData, dataFechamento: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Valor do Boleto *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        required
                                        value={formData.valorBoleto}
                                        onChange={(e) => setFormData({ ...formData, valorBoleto: e.target.value })}
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
                                    <label>Data de Vencimento *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.dataVencimento}
                                        onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Data de Pagamento</label>
                                    <input
                                        type="date"
                                        value={formData.dataPagamento}
                                        onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Status do Pagamento *</label>
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
                                <div className="form-group">
                                    <label>Nota Fiscal</label>
                                    <input
                                        type="text"
                                        value={formData.notaFiscal}
                                        onChange={(e) => setFormData({ ...formData, notaFiscal: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Enviado Para</label>
                                <input
                                    type="text"
                                    value={formData.enviadoPara}
                                    onChange={(e) => setFormData({ ...formData, enviadoPara: e.target.value })}
                                />
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
                                    {editingConvenio ? 'Atualizar' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
