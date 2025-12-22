'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Convenio, PaymentStatus, ClosingType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import './convenios.css';

export default function ConveniosPage() {
    const { user } = useAuth();
    const { convenios, addConvenio, updateConvenio, deleteConvenio, clientes } = useApp();
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

    // Filter and sort convenios by most recent
    const filteredConvenios = convenios
        .filter(convenio => {
            const matchesSearch = convenio.empresaCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                convenio.periodoReferencia.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'todos' || convenio.statusPagamento === filterStatus;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => new Date(b.dataVencimento).getTime() - new Date(a.dataVencimento).getTime());

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
                        <span className="stat-value">{totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Pago</span>
                        <span className="stat-value text-success">{totalPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Pendente</span>
                        <span className="stat-value text-warning">{totalPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    ➕ Novo Convênio
                </button>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.1rem' }}>🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar por empresa ou período..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                        style={{ paddingLeft: '40px' }}
                    />
                </div>
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
                                    <td className="font-semibold">{convenio.valorBoleto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
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
                <div className="modal-overlay animate-fade-in" onClick={resetForm} style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()} style={{
                        background: '#ffffff',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '700px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        padding: 0
                    }}>
                        <div className="modal-header" style={{
                            padding: '1.5rem 2rem',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'linear-gradient(to right, #f8fafc, #ffffff)',
                            borderTopLeftRadius: '24px',
                            borderTopRightRadius: '24px',
                            position: 'sticky',
                            top: 0,
                            zIndex: 10,
                            backdropFilter: 'blur(10px)'
                        }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                                    {editingConvenio ? 'Editar' : 'Novo'} Convênio
                                </h2>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                                    Preencha as informações do fechamento
                                </p>
                            </div>
                            <button className="btn-modern-icon" onClick={resetForm} style={{ width: '40px', height: '40px', borderRadius: '12px' }}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form" style={{ padding: '2rem' }}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>
                                    Empresa/Cliente *
                                </label>
                                <select
                                    required
                                    value={formData.empresaCliente}
                                    onChange={(e) => setFormData({ ...formData, empresaCliente: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem' }}
                                >
                                    <option value="">Selecione um cliente...</option>
                                    {clientes.filter(c => c.ativo).map(c => (
                                        <option key={c.id} value={c.nome}>{c.nome} ({c.tipo === 'empresa' ? 'Empresa' : 'PF'})</option>
                                    ))}
                                </select>
                                <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>
                                    💡 Cadastre novos clientes em Cadastros → Clientes
                                </small>
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Tipo de Fechamento *</label>
                                    <select
                                        required
                                        value={formData.tipoFechamento}
                                        onChange={(e) => setFormData({ ...formData, tipoFechamento: e.target.value as ClosingType })}
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem' }}
                                    >
                                        <option value="mensal">Mensal</option>
                                        <option value="quinzenal">Quinzenal</option>
                                        <option value="semanal">Semanal</option>
                                        <option value="personalizado">Personalizado</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Período de Referência *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Janeiro/2024"
                                        value={formData.periodoReferencia}
                                        onChange={(e) => setFormData({ ...formData, periodoReferencia: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem' }}
                                    />
                                </div>
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Data do Fechamento *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.dataFechamento}
                                        onChange={(e) => setFormData({ ...formData, dataFechamento: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Valor do Boleto *</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#94a3b8' }}>R$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            required
                                            value={formData.valorBoleto}
                                            onChange={(e) => setFormData({ ...formData, valorBoleto: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem', fontWeight: 700, color: '#0ea5e9' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Banco *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.banco}
                                        onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Data de Vencimento *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.dataVencimento}
                                        onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem' }}
                                    />
                                </div>
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Status do Pagamento *</label>
                                    <select
                                        required
                                        value={formData.statusPagamento}
                                        onChange={(e) => setFormData({ ...formData, statusPagamento: e.target.value as PaymentStatus })}
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem' }}
                                    >
                                        <option value="pendente">Pendente</option>
                                        <option value="pago">Pago</option>
                                        <option value="vencido">Vencido</option>
                                        <option value="parcial">Parcial</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Data de Pagamento</label>
                                    <input
                                        type="date"
                                        value={formData.dataPagamento}
                                        onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem' }}
                                    />
                                </div>
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Nota Fiscal</label>
                                    <input
                                        type="text"
                                        value={formData.notaFiscal}
                                        onChange={(e) => setFormData({ ...formData, notaFiscal: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Enviado Para</label>
                                    <input
                                        type="text"
                                        value={formData.enviadoPara}
                                        onChange={(e) => setFormData({ ...formData, enviadoPara: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem' }}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Observações</label>
                                <textarea
                                    rows={3}
                                    value={formData.observacoes}
                                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem', resize: 'vertical' }}
                                />
                            </div>

                            <div className="modal-actions" style={{
                                display: 'flex',
                                gap: '1rem',
                                padding: '1.5rem 2rem',
                                background: '#f8fafc',
                                borderTop: '1px solid #f1f5f9',
                                margin: '0 -2rem -2rem -2rem'
                            }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={resetForm}
                                    style={{ flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 700, border: '1px solid #e2e8f0', background: '#ffffff', color: '#64748b' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 2, padding: '1rem', borderRadius: '14px', fontWeight: 700, border: 'none', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#ffffff', boxShadow: '0 10px 15px -3px rgba(14, 165, 233, 0.3)' }}
                                >
                                    {editingConvenio ? 'Atualizar Convênio' : 'Salvar Convênio'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
