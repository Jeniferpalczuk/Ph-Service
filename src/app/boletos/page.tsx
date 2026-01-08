'use client';

import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Boleto, PaymentStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';
import '../shared-modern.css';

export default function BoletosPage() {
    const { user } = useAuth();
    const { boletos, addBoleto, updateBoleto, deleteBoleto, fornecedores } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editingBoleto, setEditingBoleto] = useState<Boleto | null>(null);
    const [showNotification, setShowNotification] = useState(true);

    // Filter States
    const [filterCliente, setFilterCliente] = useState('');
    const [filterBanco, setFilterBanco] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Parcelamento state
    const [isParcelado, setIsParcelado] = useState(false);
    const [numeroParcelas, setNumeroParcelas] = useState(2);
    const [formData, setFormData] = useState({
        cliente: '',
        valor: '',
        banco: '',
        dataVencimento: '',
        dataPagamento: '',
        statusPagamento: 'pendente' as PaymentStatus,
        observacoes: '',
    });

    const [parcelasDates, setParcelasDates] = useState<string[]>([]);

    // Auto-generate installment dates when base date or count changes
    useEffect(() => {
        if (isParcelado && formData.dataVencimento) {
            const dates = [];
            const dataBase = new Date(formData.dataVencimento);
            for (let i = 0; i < numeroParcelas; i++) {
                const d = new Date(dataBase);
                d.setMonth(d.getMonth() + i);
                dates.push(d.toISOString().split('T')[0]);
            }
            setParcelasDates(dates);
        }
    }, [isParcelado, numeroParcelas, formData.dataVencimento]);

    const handleParcelaDateChange = (index: number, newDate: string) => {
        const newDates = [...parcelasDates];
        newDates[index] = newDate;
        setParcelasDates(newDates);
    };

    // Verificar boletos próximos do vencimento (3 dias)
    const boletosProximosVencimento = useMemo(() => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const tresDias = new Date(hoje);
        tresDias.setDate(tresDias.getDate() + 3);

        return boletos.filter(b => {
            if (b.statusPagamento === 'pago') return false;
            const venc = new Date(b.dataVencimento);
            venc.setHours(0, 0, 0, 0);
            return venc >= hoje && venc <= tresDias;
        });
    }, [boletos]);

    // Boletos vencidos
    const boletosVencidos = useMemo(() => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        return boletos.filter(b => {
            if (b.statusPagamento === 'pago') return false;
            const venc = new Date(b.dataVencimento);
            venc.setHours(0, 0, 0, 0);
            return venc < hoje;
        });
    }, [boletos]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isParcelado && !editingBoleto) {
            // Gerar parcelas
            const valorTotal = parseFloat(formData.valor);
            const valorParcela = valorTotal / numeroParcelas;

            parcelasDates.forEach((dateStr, i) => {
                const boletoData = {
                    cliente: formData.cliente,
                    valor: valorParcela,
                    banco: formData.banco,
                    dataVencimento: new Date(dateStr),
                    dataPagamento: undefined,
                    statusPagamento: 'pendente' as PaymentStatus,
                    observacoes: `Parcela ${i + 1}/${numeroParcelas}${formData.observacoes ? ' - ' + formData.observacoes : ''}`,
                };
                addBoleto(boletoData);
            });
        } else {
            const [yV, mV, dV] = formData.dataVencimento.split('-').map(Number);
            const vencAjustada = new Date(yV, mV - 1, dV, 12, 0, 0);

            let pagAjustada = undefined;
            if (formData.dataPagamento) {
                const [yP, mP, dP] = formData.dataPagamento.split('-').map(Number);
                pagAjustada = new Date(yP, mP - 1, dP, 12, 0, 0);
            }

            const boletoData = {
                cliente: formData.cliente,
                valor: parseFloat(formData.valor),
                banco: formData.banco,
                dataVencimento: vencAjustada,
                dataPagamento: pagAjustada,
                statusPagamento: formData.statusPagamento,
                observacoes: formData.observacoes || undefined,
            };

            if (editingBoleto) {
                updateBoleto(editingBoleto.id, boletoData);
            } else {
                addBoleto(boletoData);
            }
        }

        resetForm();
    };

    const resetForm = () => {
        setFormData(prev => ({
            ...prev,
            cliente: '',
            valor: '',
            statusPagamento: 'pendente',
            observacoes: '',
        }));
        setEditingBoleto(null);
        setShowModal(false);
        setIsParcelado(false);
        setNumeroParcelas(2);
        setParcelasDates([]);
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
        setIsParcelado(false); // Não pode parcelar ao editar
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este boleto?')) {
            deleteBoleto(id);
        }
    };

    const handleMarkAsPaid = async (boleto: Boleto) => {
        if (confirm(`Confirmar pagamento do boleto de ${boleto.cliente}?`)) {
            const today = new Date();
            // Set to noon to avoid timezone rollback
            const payDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);

            await updateBoleto(boleto.id, {
                ...boleto,
                statusPagamento: 'pago',
                dataPagamento: payDate
            });
        }
    };

    const bancos = useMemo(() => Array.from(new Set(boletos.map(b => b.banco))), [boletos]);

    const filteredBoletos = useMemo(() => {
        return boletos
            .filter(b => {
                const matchesCliente = b.cliente.toLowerCase().includes(filterCliente.toLowerCase());
                const matchesBanco = filterBanco === 'all' || b.banco === filterBanco;
                const matchesStatus = filterStatus === 'all' || b.statusPagamento === filterStatus;
                const matchesSearch = b.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    b.banco.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (b.observacoes || '').toLowerCase().includes(searchTerm.toLowerCase());
                return matchesCliente && matchesBanco && matchesStatus && matchesSearch;
            })
            .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());
    }, [boletos, filterCliente, filterBanco, filterStatus, searchTerm]);

    const totalValor = filteredBoletos.reduce((sum, b) => sum + b.valor, 0);
    const totalPago = filteredBoletos.filter(b => b.statusPagamento === 'pago').length;
    const totalPendente = filteredBoletos.filter(b => b.statusPagamento !== 'pago').length;

    // Calcular dias até vencimento
    const diasAteVencimento = (data: Date | string) => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const venc = new Date(data);
        venc.setHours(0, 0, 0, 0);
        const diff = Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <div className="modern-page">
            {/* Notificação de boletos próximos do vencimento */}
            {showNotification && (boletosProximosVencimento.length > 0 || boletosVencidos.length > 0) && (
                <div style={{
                    marginBottom: '1.5rem',
                    borderRadius: '12px',
                    overflow: 'hidden'
                }}>
                    {boletosVencidos.length > 0 && (
                        <div style={{
                            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                            border: '1px solid #fecaca',
                            padding: '1rem 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>🚨</span>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.95rem' }}>
                                        {boletosVencidos.length} boleto(s) VENCIDO(S)!
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#b91c1c' }}>
                                        {boletosVencidos.slice(0, 3).map(b => b.cliente).join(', ')}
                                        {boletosVencidos.length > 3 && ` e mais ${boletosVencidos.length - 3}...`}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowNotification(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#dc2626' }}
                            >
                                ✕
                            </button>
                        </div>
                    )}
                    {boletosProximosVencimento.length > 0 && (
                        <div style={{
                            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                            border: '1px solid #fcd34d',
                            padding: '1rem 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#d97706', fontSize: '0.95rem' }}>
                                        {boletosProximosVencimento.length} boleto(s) vencem nos próximos 3 dias
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#92400e' }}>
                                        {boletosProximosVencimento.map(b => (
                                            <span key={b.id} style={{ marginRight: '8px' }}>
                                                {b.cliente} ({diasAteVencimento(b.dataVencimento) === 0 ? 'HOJE' :
                                                    diasAteVencimento(b.dataVencimento) === 1 ? 'amanhã' :
                                                        `${diasAteVencimento(b.dataVencimento)} dias`})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowNotification(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#d97706' }}
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="modern-header">
                <div className="modern-header-info">
                    <div className="modern-header-subtitle">Gestão de Boletos</div>
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
                        {(filterCliente || filterBanco !== 'all' || filterStatus !== 'all' || searchTerm) && (
                            <button className="modern-badge-summary neutral" onClick={() => {
                                setFilterCliente('');
                                setFilterBanco('all');
                                setFilterStatus('all');
                                setSearchTerm('');
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
                <div className="modern-filter-group" style={{ flex: 2 }}>
                    <label>🔍 Buscar:</label>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Pesquisar cliente, banco, observações..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '40px' }}
                        />
                    </div>
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
                            <th>OBS</th>
                            <th style={{ textAlign: 'right' }}>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBoletos.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Nenhum boleto encontrado.</td></tr>
                        ) : (
                            filteredBoletos.map((boleto) => {
                                const dias = diasAteVencimento(boleto.dataVencimento);
                                const isVencido = dias < 0 && boleto.statusPagamento !== 'pago';
                                const isProximo = dias >= 0 && dias <= 3 && boleto.statusPagamento !== 'pago';

                                return (
                                    <tr key={boleto.id} style={{
                                        background: isVencido ? '#fef2f2' : (isProximo ? '#fffbeb' : undefined)
                                    }}>
                                        <td className="col-highlight">{boleto.cliente}</td>
                                        <td>{boleto.banco}</td>
                                        <td className="col-money">{boleto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}
                                                {isVencido && <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>VENCIDO</span>}
                                                {isProximo && <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                                                    {dias === 0 ? 'HOJE' : dias === 1 ? 'AMANHÃ' : `${dias} DIAS`}
                                                </span>}
                                            </div>
                                        </td>
                                        <td>{boleto.dataPagamento ? new Date(boleto.dataPagamento).toLocaleDateString('pt-BR') : '-'}</td>
                                        <td>
                                            <span className={`modern-status-badge ${boleto.statusPagamento === 'pago' ? 'pago' : 'pendente'}`}
                                                style={{
                                                    backgroundColor: boleto.statusPagamento === 'pago' ? '#d1fae5' : (isVencido ? '#fee2e2' : '#fef3c7'),
                                                    color: boleto.statusPagamento === 'pago' ? '#065f46' : (isVencido ? '#dc2626' : '#92400e')
                                                }}>
                                                {boleto.statusPagamento}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {boleto.observacoes || '-'}
                                        </td>
                                        <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            {boleto.statusPagamento !== 'pago' && (
                                                <button
                                                    className="btn-modern-icon"
                                                    onClick={() => handleMarkAsPaid(boleto)}
                                                    title="Marcar como Pago"
                                                    style={{ color: '#059669', background: '#ecfdf5' }}
                                                >
                                                    ✅
                                                </button>
                                            )}
                                            <button className="btn-modern-icon" onClick={() => handleEdit(boleto)}>✏️</button>
                                            {user?.role === 'adm' && (
                                                <button className="btn-modern-icon" onClick={() => handleDelete(boleto.id)}>🗑️</button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
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
                                    {editingBoleto ? '✏️ Editar Boleto' : '➕ Novo Boleto'}
                                </h2>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                                    {editingBoleto ? 'Atualize as informações do título' : 'Preencha os dados para registrar um novo título'}
                                </p>
                            </div>
                            <button className="btn-modern-icon" onClick={resetForm} style={{ width: '40px', height: '40px', borderRadius: '12px' }}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>
                                        🏢 Cliente (Fornecedor) *
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            required
                                            value={formData.cliente}
                                            onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.8rem 1rem',
                                                borderRadius: '12px',
                                                border: '1px solid #e2e8f0',
                                                background: '#f8fafc',
                                                fontSize: '0.95rem',
                                                appearance: 'none',
                                                backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'right 1rem center',
                                                backgroundSize: '0.65em auto'
                                            }}
                                        >
                                            <option value="">Selecione o fornecedor...</option>
                                            {fornecedores.filter(f => f.ativo).map(f => (
                                                <option key={f.id} value={f.nome}>{f.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>
                                        🏦 Instituição Bancária *
                                    </label>
                                    <input
                                        required
                                        value={formData.banco}
                                        onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                                        placeholder="Ex: Itaú, Bradesco..."
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem 1rem',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            background: '#f8fafc',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>
                                        💰 Valor Total *
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 600 }}>R$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.valor}
                                            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                            placeholder="0,00"
                                            style={{
                                                width: '100%',
                                                padding: '0.8rem 1rem 0.8rem 2.5rem',
                                                borderRadius: '12px',
                                                border: '1px solid #e2e8f0',
                                                background: '#f8fafc',
                                                fontSize: '1rem',
                                                fontWeight: 700,
                                                color: '#0ea5e9'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>
                                        📅 Data de Vencimento {isParcelado ? '(1ª Parcela)' : ''} *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.dataVencimento}
                                        onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem 1rem',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            background: '#f8fafc',
                                            fontSize: '0.95rem',
                                            fontWeight: 600
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Seção de Parcelamento */}
                            {!editingBoleto && (
                                <div style={{
                                    marginTop: '1.5rem',
                                    background: isParcelado ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' : '#f8fafc',
                                    borderRadius: '16px',
                                    padding: '1.25rem',
                                    border: isParcelado ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isParcelado ? '1.25rem' : 0 }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', margin: 0 }}>
                                            <input
                                                type="checkbox"
                                                checked={isParcelado}
                                                onChange={(e) => setIsParcelado(e.target.checked)}
                                                style={{ width: '20px', height: '20px', accentColor: '#0ea5e9', cursor: 'pointer' }}
                                            />
                                            <div>
                                                <span style={{ fontWeight: 700, color: isParcelado ? '#0369a1' : '#475569', display: 'block', fontSize: '0.95rem' }}>
                                                    💳 Parcelar este boleto
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: isParcelado ? '#0ea5e9' : '#94a3b8' }}> Divida o valor total em parcelas mensais</span>
                                            </div>
                                        </label>
                                        {isParcelado && (
                                            <div style={{ background: '#ffffff', padding: '4px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#0ea5e9', border: '1px solid #0ea5e9' }}>
                                                ATIVADO
                                            </div>
                                        )}
                                    </div>

                                    {isParcelado && (
                                        <div className="animate-fade-in">
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                                <div className="form-group" style={{ margin: 0 }}>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>Qtd. de Parcelas</label>
                                                    <select
                                                        value={numeroParcelas}
                                                        onChange={(e) => setNumeroParcelas(parseInt(e.target.value))}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.7rem',
                                                            borderRadius: '10px',
                                                            border: '1px solid #bae6fd',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                                            <option key={n} value={n}>{n}x</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="form-group" style={{ margin: 0 }}>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>Valor por Parcela</label>
                                                    <div style={{
                                                        padding: '0.7rem',
                                                        background: '#ffffff',
                                                        borderRadius: '10px',
                                                        border: '1px solid #bae6fd',
                                                        fontWeight: 800,
                                                        color: '#0369a1',
                                                        textAlign: 'center'
                                                    }}>
                                                        {formData.valor ? (parseFloat(formData.valor) / numeroParcelas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Preview das parcelas com edição de data */}
                                            {formData.valor && formData.dataVencimento && parcelasDates.length > 0 && (
                                                <div style={{
                                                    background: '#ffffff',
                                                    borderRadius: '12px',
                                                    padding: '1rem',
                                                    border: '1px solid #bae6fd',
                                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                                }}>
                                                    <div style={{ fontWeight: 700, marginBottom: '0.8rem', fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span>📋 Cronograma de Vencimentos</span>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                                                        {parcelasDates.map((dateStr, i) => (
                                                            <div key={i} style={{
                                                                padding: '8px 12px',
                                                                background: '#f8fafc',
                                                                borderRadius: '10px',
                                                                fontSize: '0.85rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                border: '1px solid #f1f5f9'
                                                            }}>
                                                                <span style={{ fontWeight: 700, color: '#475569' }}>{i + 1}ª Parcela</span>
                                                                <input
                                                                    type="date"
                                                                    value={dateStr}
                                                                    onChange={(e) => handleParcelaDateChange(i, e.target.value)}
                                                                    style={{
                                                                        padding: '4px 8px',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #cbd5e1',
                                                                        fontSize: '0.8rem',
                                                                        fontWeight: 700,
                                                                        color: '#0369a1',
                                                                        width: 'auto'
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {!isParcelado && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                                    <div className="form-group">
                                        <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>
                                            ✅ Data de Pagamento (Opcional)
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.dataPagamento}
                                            onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.8rem 1rem',
                                                borderRadius: '12px',
                                                border: '1px solid #d1fae5',
                                                background: formData.dataPagamento ? '#ecfdf5' : '#f8fafc',
                                                fontSize: '0.95rem'
                                            }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>
                                            🔄 Status do Título *
                                        </label>
                                        <select
                                            required
                                            value={formData.statusPagamento}
                                            onChange={(e) => setFormData({ ...formData, statusPagamento: e.target.value as PaymentStatus })}
                                            style={{
                                                width: '100%',
                                                padding: '0.8rem 1rem',
                                                borderRadius: '12px',
                                                border: '1px solid #e2e8f0',
                                                background: '#f8fafc',
                                                fontSize: '0.95rem',
                                                fontWeight: 600,
                                                color: formData.statusPagamento === 'pago' ? '#059669' : (formData.statusPagamento === 'vencido' ? '#dc2626' : '#d97706')
                                            }}
                                        >
                                            <option value="pendente">⏳ Pendente</option>
                                            <option value="pago">✅ Pago</option>
                                            <option value="vencido">🚨 Vencido</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>
                                    📝 Observações Adicionais
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.observacoes}
                                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                    placeholder="Informações relevantes sobre este boleto..."
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        borderRadius: '16px',
                                        border: '1px solid #e2e8f0',
                                        background: '#f8fafc',
                                        fontSize: '0.95rem',
                                        resize: 'none'
                                    }}
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
                                        background: isParcelado ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'linear-gradient(135deg, #10b981, #059669)',
                                        color: '#ffffff',
                                        fontWeight: 800,
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        transform: 'scale(1)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {editingBoleto ? 'Salvar Alterações' : (isParcelado ? `Confirmar ${numeroParcelas} Parcelas` : 'Registrar Boleto')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
