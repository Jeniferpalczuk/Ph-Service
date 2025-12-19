'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Boleto, PaymentStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';
import '../shared-modern.css';

export default function BoletosPage() {
    const { user } = useAuth();
    const { boletos, addBoleto, updateBoleto, deleteBoleto, fornecedores } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editingBoleto, setEditingBoleto] = useState<Boleto | null>(null);

    // Filter States
    const [filterCliente, setFilterCliente] = useState('');
    const [filterBanco, setFilterBanco] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

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

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este boleto?')) {
            deleteBoleto(id);
        }
    };

    const bancos = useMemo(() => Array.from(new Set(boletos.map(b => b.banco))), [boletos]);

    const filteredBoletos = useMemo(() => {
        return boletos
            .filter(b => {
                const matchesCliente = b.cliente.toLowerCase().includes(filterCliente.toLowerCase());
                const matchesBanco = filterBanco === 'all' || b.banco === filterBanco;
                const matchesStatus = filterStatus === 'all' || b.statusPagamento === filterStatus;
                return matchesCliente && matchesBanco && matchesStatus;
            })
            .sort((a, b) => new Date(b.dataVencimento).getTime() - new Date(a.dataVencimento).getTime());
    }, [boletos, filterCliente, filterBanco, filterStatus]);

    const totalValor = filteredBoletos.reduce((sum, b) => sum + b.valor, 0);
    const totalPago = filteredBoletos.filter(b => b.statusPagamento === 'pago').length;
    const totalPendente = filteredBoletos.filter(b => b.statusPagamento !== 'pago').length;

    return (
        <div className="modern-page">
            <div className="modern-header">
                <div className="modern-header-info">
                    <div className="modern-header-subtitle">Gestão de Boletos</div>
                    <div className="modern-header-title">
                        R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="modern-header-badges">
                        <div className="modern-badge-summary success">
                            <span>✅</span> {totalPago} pagos
                        </div>
                        <div className="modern-badge-summary warning">
                            <span>🕒</span> {totalPendente} pendentes
                        </div>
                        {(filterCliente || filterBanco !== 'all' || filterStatus !== 'all') && (
                            <button className="modern-badge-summary neutral" onClick={() => {
                                setFilterCliente('');
                                setFilterBanco('all');
                                setFilterStatus('all');
                            }} style={{ border: 'none', cursor: 'pointer' }}>
                                🧹 Limpar Filtros
                            </button>
                        )}
                    </div>
                </div>
                <button className="btn-modern-primary" onClick={() => setShowModal(true)}>
                    ➕ Novo Boleto
                </button>
            </div>

            <div className="modern-filters-container">
                <div className="modern-filter-group">
                    <label>👤 Cliente:</label>
                    <input
                        type="text"
                        placeholder="Pesquisar cliente..."
                        value={filterCliente}
                        onChange={e => setFilterCliente(e.target.value)}
                    />
                </div>
                <div className="modern-filter-group">
                    <label>🏦 Banco:</label>
                    <select value={filterBanco} onChange={e => setFilterBanco(e.target.value)}>
                        <option value="all">Todos os Bancos</option>
                        {bancos.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                <div className="modern-filter-group">
                    <label>🔄 Status:</label>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="all">Status: Todos</option>
                        <option value="pago">Pago</option>
                        <option value="pendente">Pendente</option>
                        <option value="vencido">Vencido</option>
                    </select>
                </div>
            </div>

            <div className="modern-table-container">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>CLIENTE</th>
                            <th>BANCO</th>
                            <th>VALOR</th>
                            <th>VENCIMENTO</th>
                            <th>PAGAMENTO</th>
                            <th>STATUS</th>
                            <th style={{ textAlign: 'right' }}>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBoletos.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Nenhum boleto encontrado.</td></tr>
                        ) : (
                            filteredBoletos.map((boleto) => (
                                <tr key={boleto.id}>
                                    <td className="col-highlight">{boleto.cliente}</td>
                                    <td>{boleto.banco}</td>
                                    <td className="col-money">R$ {boleto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td>{new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}</td>
                                    <td>{boleto.dataPagamento ? new Date(boleto.dataPagamento).toLocaleDateString('pt-BR') : '-'}</td>
                                    <td>
                                        <span className={`modern-status-badge ${boleto.statusPagamento === 'pago' ? 'pago' : 'pendente'}`}
                                            style={{
                                                backgroundColor: boleto.statusPagamento === 'pago' ? '#d1fae5' : '#fef3c7',
                                                color: boleto.statusPagamento === 'pago' ? '#065f46' : '#92400e'
                                            }}>
                                            {boleto.statusPagamento}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button className="btn-modern-icon" onClick={() => handleEdit(boleto)}>✏️</button>
                                        <button className="btn-modern-icon" onClick={() => handleDelete(boleto.id)}>🗑️</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="modern-footer">
                    <div className="modern-footer-totals">
                        <div className="modern-total-item">Total: <b>R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></div>
                    </div>
                </div>
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
                                    <label>Cliente (Fornecedor) *</label>
                                    <input
                                        required
                                        list="fornecedores-list"
                                        value={formData.cliente}
                                        onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                                        placeholder="Selecione ou digite..."
                                    />
                                    <datalist id="fornecedores-list">
                                        {fornecedores.filter(f => f.ativo).map(f => (
                                            <option key={f.id} value={f.nome}>{f.nome}</option>
                                        ))}
                                    </datalist>
                                </div>
                                <div className="form-group">
                                    <label>Banco *</label>
                                    <input required value={formData.banco} onChange={(e) => setFormData({ ...formData, banco: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Valor *</label>
                                    <input type="number" step="0.01" required value={formData.valor} onChange={(e) => setFormData({ ...formData, valor: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Data de Vencimento *</label>
                                    <input type="date" required value={formData.dataVencimento} onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Data de Pagamento</label>
                                    <input type="date" value={formData.dataPagamento} onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Status *</label>
                                    <select required value={formData.statusPagamento} onChange={(e) => setFormData({ ...formData, statusPagamento: e.target.value as PaymentStatus })}>
                                        <option value="pendente">Pendente</option>
                                        <option value="pago">Pago</option>
                                        <option value="vencido">Vencido</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Observações</label>
                                <textarea rows={3} value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">{editingBoleto ? 'Atualizar' : 'Salvar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
