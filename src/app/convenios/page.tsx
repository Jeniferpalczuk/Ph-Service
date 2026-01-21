'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PaymentStatus, ClosingType } from '@/types';
import { Convenio } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { MoneyInput } from '@/components/MoneyInput';
import '../shared-modern.css';

export default function ConveniosPage() {
    const { user } = useAuth();
    const { convenios, addConvenio, updateConvenio, deleteConvenio, clientes } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editingConvenio, setEditingConvenio] = useState<Convenio | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
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

        const [yF, mF, dF] = formData.dataFechamento.split('-').map(Number);
        const dataFechAjustada = new Date(yF, mF - 1, dF, 12, 0, 0);

        const [yV, mV, dV] = formData.dataVencimento.split('-').map(Number);
        const dataVencAjustada = new Date(yV, mV - 1, dV, 12, 0, 0);

        let dataPagAjustada = undefined;
        if (formData.dataPagamento) {
            const [yP, mP, dP] = formData.dataPagamento.split('-').map(Number);
            dataPagAjustada = new Date(yP, mP - 1, dP, 12, 0, 0);
        }

        const convenioData = {
            empresaCliente: formData.empresaCliente,
            tipoFechamento: formData.tipoFechamento,
            periodoReferencia: formData.periodoReferencia,
            dataFechamento: dataFechAjustada,
            valorBoleto: parseFloat(formData.valorBoleto),
            banco: formData.banco,
            dataVencimento: dataVencAjustada,
            dataPagamento: dataPagAjustada,
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
        // Persist commonly used fields: tipoFechamento, periodoReferencia, dataFechamento, banco, dataVencimento, dataPagamento
        // Reset specific fields: empresaCliente, valorBoleto, statusPagamento, notaFiscal, enviadoPara, observacoes
        setFormData(prev => ({
            ...prev,
            empresaCliente: '',
            valorBoleto: '',
            statusPagamento: 'pendente',
            notaFiscal: '',
            enviadoPara: '',
            observacoes: '',
        }));
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

    // Filter and sort convenios by most recent
    const filteredConvenios = useMemo(() => {
        return convenios
            .filter(convenio => {
                const d = new Date(convenio.dataVencimento);
                const convMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

                const matchesMonth = convMonth === selectedMonth;
                const matchesSearch = convenio.empresaCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    convenio.periodoReferencia.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = filterStatus === 'todos' || convenio.statusPagamento === filterStatus;
                return matchesMonth && matchesSearch && matchesStatus;
            })
            .sort((a, b) => new Date(b.dataVencimento).getTime() - new Date(a.dataVencimento).getTime());
    }, [convenios, searchTerm, filterStatus, selectedMonth]);

    const totalValor = useMemo(() => filteredConvenios.reduce((sum, c) => sum + c.valorBoleto, 0), [filteredConvenios]);
    const totalPago = useMemo(() => filteredConvenios.filter(c => c.statusPagamento === 'pago').length, [filteredConvenios]);
    const totalPendente = useMemo(() => filteredConvenios.filter(c => c.statusPagamento === 'pendente').length, [filteredConvenios]);
    const totalVencido = useMemo(() => filteredConvenios.filter(c => c.statusPagamento === 'vencido').length, [filteredConvenios]);

    return (
        <div className="modern-page">
            <div className="modern-header">
                <div className="modern-header-info">
                    <div className="modern-header-subtitle">Gestão de Convênios</div>
                    <div className="modern-header-title">
                        {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="modern-header-badges">
                        <div className="modern-badge-summary success">
                            <span>✅</span> {totalPago} pagos
                        </div>
                        <div className="modern-badge-summary warning">
                            <span>🕒</span> {totalPendente} pendentes
                        </div>
                        {totalVencido > 0 && (
                            <div className="modern-badge-summary danger">
                                <span>🚨</span> {totalVencido} vencidos
                            </div>
                        )}
                        {(searchTerm || filterStatus !== 'todos') && (
                            <button className="modern-badge-summary neutral" onClick={() => {
                                setSearchTerm('');
                                setFilterStatus('todos');
                            }} style={{ border: 'none', cursor: 'pointer' }}>
                                🧹 Limpar Filtros
                            </button>
                        )}
                    </div>
                </div>
                <button className="btn-modern-primary" onClick={() => setShowModal(true)}>
                    ➕ Novo Convênio
                </button>
            </div>

            <div className="modern-filters-container">
                <div className="modern-filter-group" style={{ flex: 2 }}>
                    <label>🔍 Buscar:</label>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Buscar por empresa ou período..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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

            <div className="modern-table-container">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>EMPRESA/CLIENTE</th>
                            <th>TIPO</th>
                            <th>PERÍODO</th>
                            <th>VALOR</th>
                            <th>BANCO</th>
                            <th>VENCIMENTO</th>
                            <th>STATUS</th>
                            <th style={{ textAlign: 'right' }}>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredConvenios.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                    Nenhum convênio encontrado.
                                </td>
                            </tr>
                        ) : (
                            filteredConvenios.map((convenio) => (
                                <tr key={convenio.id}>
                                    <td className="col-highlight">{convenio.empresaCliente}</td>
                                    <td>{convenio.tipoFechamento}</td>
                                    <td>{convenio.periodoReferencia}</td>
                                    <td className="col-money">{convenio.valorBoleto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td>{convenio.banco}</td>
                                    <td>{new Date(convenio.dataVencimento).toLocaleDateString('pt-BR')}</td>
                                    <td>
                                        <span className={`modern-status-badge ${convenio.statusPagamento === 'pago' ? 'pago' : 'pendente'}`}
                                            style={{
                                                backgroundColor: convenio.statusPagamento === 'pago' ? '#d1fae5' : (convenio.statusPagamento === 'vencido' ? '#fee2e2' : '#fef3c7'),
                                                color: convenio.statusPagamento === 'pago' ? '#065f46' : (convenio.statusPagamento === 'vencido' ? '#dc2626' : '#92400e')
                                            }}>
                                            {convenio.statusPagamento}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button className="btn-modern-icon" onClick={() => handleEdit(convenio)} title="Editar">✏️</button>
                                        {user?.role === 'adm' && (
                                            <button className="btn-modern-icon" onClick={(e) => handleDelete(convenio.id, e)} title="Excluir">🗑️</button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="modern-footer">
                    <div className="modern-footer-totals">
                        <div className="modern-total-item">Total: <b>{totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b></div>
                    </div>
                </div>
            </div>

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
                                    {editingConvenio ? '✏️ Editar Convênio' : '➕ Novo Convênio'}
                                </h2>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                                    Preencha as informações do fechamento
                                </p>
                            </div>
                            <button className="btn-modern-icon" onClick={resetForm} style={{ width: '40px', height: '40px', borderRadius: '12px' }}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>
                                    🏢 Empresa/Cliente *
                                </label>
                                <select
                                    required
                                    value={formData.empresaCliente}
                                    onChange={(e) => setFormData({ ...formData, empresaCliente: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem 1rem',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        background: '#f8fafc',
                                        fontSize: '0.95rem'
                                    }}
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

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Tipo de Fechamento *</label>
                                    <select
                                        required
                                        value={formData.tipoFechamento}
                                        onChange={(e) => setFormData({ ...formData, tipoFechamento: e.target.value as ClosingType })}
                                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem' }}
                                    >
                                        <option value="mensal">Mensal</option>
                                        <option value="quinzenal">Quinzenal</option>
                                        <option value="semanal">Semanal</option>
                                        <option value="personalizado">Personalizado</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Período de Referência *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Janeiro/2024"
                                        value={formData.periodoReferencia}
                                        onChange={(e) => setFormData({ ...formData, periodoReferencia: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Data do Fechamento *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.dataFechamento}
                                        onChange={(e) => setFormData({ ...formData, dataFechamento: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Valor do Boleto *</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#94a3b8' }}>R$</span>
                                        <MoneyInput
                                            min="0"
                                            placeholder="0.00"
                                            required
                                            value={formData.valorBoleto}
                                            onChange={(val) => setFormData({ ...formData, valorBoleto: val.toString() })}
                                            style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem', fontWeight: 700, color: '#0ea5e9' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>🏦 Banco *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.banco}
                                        onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                                        placeholder="Ex: Itaú, Bradesco..."
                                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>📅 Data de Vencimento *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.dataVencimento}
                                        onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Status do Pagamento *</label>
                                    <select
                                        required
                                        value={formData.statusPagamento}
                                        onChange={(e) => setFormData({ ...formData, statusPagamento: e.target.value as PaymentStatus })}
                                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem' }}
                                    >
                                        <option value="pendente">Pendente</option>
                                        <option value="pago">Pago</option>
                                        <option value="vencido">Vencido</option>
                                        <option value="parcial">Parcial</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Data de Pagamento</label>
                                    <input
                                        type="date"
                                        value={formData.dataPagamento}
                                        onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Nota Fiscal</label>
                                    <input
                                        type="text"
                                        value={formData.notaFiscal}
                                        onChange={(e) => setFormData({ ...formData, notaFiscal: e.target.value })}
                                        placeholder="Opcional"
                                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Enviado Para</label>
                                    <input
                                        type="text"
                                        value={formData.enviadoPara}
                                        onChange={(e) => setFormData({ ...formData, enviadoPara: e.target.value })}
                                        placeholder="Opcional"
                                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem' }}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Observações</label>
                                <textarea
                                    rows={3}
                                    value={formData.observacoes}
                                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                    style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem', resize: 'vertical' }}
                                />
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
                                    {editingConvenio ? 'Salvar Alterações' : 'Adicionar Convênio'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
