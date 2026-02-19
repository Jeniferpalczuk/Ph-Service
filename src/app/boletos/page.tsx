'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MoneyInput } from '@/components/MoneyInput';
import { PaymentStatus, Boleto } from '@/types';
import {
    useBoletosList,
    useCreateBoleto,
    useUpdateBoleto,
    useDeleteBoleto,
    useMarcarBoletoPago,
    useBoletosStats
} from '@/hooks/financeiro/useBoletos';
import { useFornecedoresDropdown } from '@/hooks/cadastros/useDropdown';
import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { toast } from 'react-hot-toast';
import {
    LuPlus,
    LuCheck,
    LuClock,
    LuTriangleAlert,
    LuPencil,
    LuTrash2,
    LuX
} from 'react-icons/lu';
import '../shared-modern.css';

/**
 * BoletosPage - Fase 4 (Performance & UX)
 * 
 * Migrada para React Query com Skeletons e Toast.
 */
export default function BoletosPage() {
    const { user } = useAuth();

    // Hooks do Financeiro (Migrados)
    const createBoletoMutation = useCreateBoleto();
    const updateBoletoMutation = useUpdateBoleto();
    const deleteBoletoMutation = useDeleteBoleto();
    const marcarPagoMutation = useMarcarBoletoPago();
    const { data: statsData } = useBoletosStats();

    // Hooks de Cadastros (Migrados)
    const { data: fornecedoresDD } = useFornecedoresDropdown();
    const fornecedores = fornecedoresDD ?? [];

    const [showModal, setShowModal] = useState(false);
    const [editingBoleto, setEditingBoleto] = useState<Boleto | null>(null);
    const [showNotification, setShowNotification] = useState(true);

    // Filter States
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);

    // Fetch Boletos via React Query
    const { data: boletosData, isLoading: isLoadingBoletos, isError: isErrorBoletos, error: errorBoletos } = useBoletosList({
        page,
        search: searchTerm,
        startDate: `${selectedMonth}-01`,
        endDate: `${selectedMonth}-${new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]), 0).getDate().toString().padStart(2, '0')}`,
    });

    const boletos = boletosData?.data ?? [];
    const totalPages = boletosData?.totalPages ?? 1;

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

    // Alertas de vencimento baseados nos dados atuais
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (isParcelado && !editingBoleto) {
                const valorTotal = parseFloat(formData.valor);
                const valorParcela = valorTotal / numeroParcelas;

                // Process installment creation
                for (let i = 0; i < parcelasDates.length; i++) {
                    const dateStr = parcelasDates[i];
                    await createBoletoMutation.mutateAsync({
                        cliente: formData.cliente,
                        valor: valorParcela,
                        banco: formData.banco,
                        dataVencimento: new Date(dateStr + 'T12:00:00'),
                        dataPagamento: null,
                        statusPagamento: 'pendente',
                        observacoes: `Parcela ${i + 1}/${numeroParcelas}${formData.observacoes ? ' - ' + formData.observacoes : ''}`,
                    });
                }
                toast.success(`${numeroParcelas} parcelas criadas com sucesso!`);
            } else {
                if (!formData.dataVencimento) {
                    toast.error('Data de vencimento é obrigatória');
                    return;
                }

                const [yV, mV, dV] = formData.dataVencimento.split('-').map(Number);
                const vencAjustada = new Date(yV, mV - 1, dV, 12, 0, 0);

                let pagAjustada = null;
                if (formData.dataPagamento) {
                    const [yP, mP, dP] = formData.dataPagamento.split('-').map(Number);
                    pagAjustada = new Date(yP, mP - 1, dP, 12, 0, 0);
                }

                const payload = {
                    cliente: formData.cliente,
                    valor: parseFloat(formData.valor),
                    banco: formData.banco,
                    dataVencimento: vencAjustada,
                    dataPagamento: pagAjustada,
                    statusPagamento: formData.statusPagamento,
                    observacoes: formData.observacoes || null,
                };

                if (editingBoleto) {
                    await updateBoletoMutation.mutateAsync({ id: editingBoleto.id, updates: payload });
                    toast.success('Boleto atualizado!');
                } else {
                    await createBoletoMutation.mutateAsync(payload);
                    toast.success('Boleto criado com sucesso!');
                }
            }
            resetForm();
        } catch (err) {
            console.error('Erro ao salvar boleto:', err); // Log full error
            toast.error(err instanceof Error ? err.message : 'Erro ao salvar boleto.');
        }
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
        setIsParcelado(false);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este boleto?')) {
            try {
                await deleteBoletoMutation.mutateAsync(id);
                toast.success('Boleto excluído');
            } catch (err) {
                toast.error('Erro ao excluir boleto');
            }
        }
    };

    const handleMarkAsPaid = async (boleto: Boleto) => {
        if (confirm(`Confirmar pagamento do boleto de ${boleto.cliente}?`)) {
            try {
                await marcarPagoMutation.mutateAsync({ id: boleto.id });
                toast.success('Boleto marcado como pago!');
            } catch (err) {
                toast.error('Erro ao processar pagamento.');
            }
        }
    };

    // Month Generator
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
            {/* Notificações no topo */}
            {showNotification && (boletosProximosVencimento.length > 0 || boletosVencidos.length > 0) && (
                <div style={{ marginBottom: '1.5rem', borderRadius: '12px', overflow: 'hidden' }}>
                    {boletosVencidos.length > 0 && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <LuTriangleAlert size={20} color="#dc2626" />
                                <span style={{ fontWeight: 700, color: '#dc2626' }}>{boletosVencidos.length} boleto(s) VENCIDO(S)!</span>
                            </div>
                            <button onClick={() => setShowNotification(false)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', display: 'flex' }}><LuX size={18} /></button>
                        </div>
                    )}
                </div>
            )}

            <div className="modern-header">
                <div>
                    <div className="modern-header-subtitle">Financeiro</div>
                    <div className="modern-header-title">Gestão de Boletos</div>
                    <div className="modern-header-badges">
                        <div className="modern-badge-summary success">
                            <LuCheck size={16} /> {statsData?.totalPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} pagos
                        </div>
                        <div className="modern-badge-summary warning">
                            <LuClock size={16} /> {statsData?.totalPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} pendentes
                        </div>
                    </div>
                </div>
                <button className="btn-modern-primary" onClick={() => setShowModal(true)}><LuPlus size={18} /> Novo Boleto</button>
            </div>

            <div className="modern-filters-container">
                <div className="modern-filter-group" style={{ flex: 2 }}>
                    <label>Buscar:</label>
                    <input
                        type="text"
                        placeholder="Buscar por cliente ou banco..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="modern-filter-group">
                    <label>Mês:</label>
                    <select value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setPage(1); }}>
                        {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="modern-table-container card" style={{ padding: '0' }}>
                {isLoadingBoletos ? (
                    <div style={{ padding: '2rem' }}>
                        <TableSkeleton rows={10} cols={7} />
                    </div>
                ) : isErrorBoletos ? (
                    <div className="error-state">
                        <p>Erro ao carregar boletos: {(errorBoletos as Error).message}</p>
                    </div>
                ) : (
                    <>
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
                                {boletos.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>Nenhum boleto encontrado.</td></tr>
                                ) : (
                                    boletos.map((boleto) => {
                                        const dias = diasAteVencimento(boleto.dataVencimento);
                                        const isVencido = dias < 0 && boleto.statusPagamento !== 'pago';
                                        return (
                                            <tr key={boleto.id} className={isVencido ? 'vencido-row' : ''}>
                                                <td className="col-highlight">{boleto.cliente}</td>
                                                <td>{boleto.banco}</td>
                                                <td className="col-money">{boleto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                <td>{new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}</td>
                                                <td>{boleto.dataPagamento ? new Date(boleto.dataPagamento).toLocaleDateString('pt-BR') : '-'}</td>
                                                <td>
                                                    <span className={`status-badge ${boleto.statusPagamento}`}>
                                                        {boleto.statusPagamento}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        {boleto.statusPagamento !== 'pago' && (
                                                            <button className="btn-modern-icon success" onClick={() => handleMarkAsPaid(boleto)} title="Marcar como Pago"><LuCheck size={16} /></button>
                                                        )}
                                                        <button className="btn-modern-icon" onClick={() => handleEdit(boleto)} title="Editar"><LuPencil size={16} /></button>
                                                        <button className="btn-modern-icon" onClick={() => handleDelete(boleto.id)} title="Excluir"><LuTrash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>

                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={(p) => setPage(p)}
                        />
                    </>
                )}
            </div>

            {/* Modal de Cadastro (Standardized) */}
            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%' }}>
                        <div className="modal-header">
                            <div>
                                <h2>{editingBoleto ? 'Editar Boleto' : 'Novo Boleto'}</h2>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Configure os dados do título financeiro</p>
                            </div>
                            <button className="modal-close" onClick={resetForm}><LuX size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>Cliente (Fornecedor)</label>
                                        <select
                                            required
                                            value={formData.cliente}
                                            onChange={e => setFormData({ ...formData, cliente: e.target.value })}
                                        >
                                            <option value="">Selecione...</option>
                                            {fornecedores.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Banco</label>
                                        <input required value={formData.banco} onChange={e => setFormData({ ...formData, banco: e.target.value })} placeholder="Ex: Itaú" />
                                    </div>
                                    <div className="form-group">
                                        <label>Valor</label>
                                        <MoneyInput required value={formData.valor} onChange={val => setFormData({ ...formData, valor: val.toString() })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Vencimento</label>
                                        <input type="date" required value={formData.dataVencimento} onChange={e => setFormData({ ...formData, dataVencimento: e.target.value })} />
                                    </div>
                                </div>

                                {!editingBoleto && (
                                    <div className="parcelamento-section" style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
                                            <input type="checkbox" checked={isParcelado} onChange={e => setIsParcelado(e.target.checked)} />
                                            Parcelar Título?
                                        </label>
                                        {isParcelado && (
                                            <div style={{ marginTop: '10px' }}>
                                                <div className="grid-2">
                                                    <div className="form-group">
                                                        <label>Número de Parcelas</label>
                                                        <select value={numeroParcelas} onChange={e => setNumeroParcelas(parseInt(e.target.value))}>
                                                            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => <option key={n} value={n}>{n}x</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Valor da Parcela</label>
                                                        <div className="static-val">
                                                            {(parseFloat(formData.valor || '0') / numeroParcelas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ marginTop: '1rem' }}>
                                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Datas de Vencimento das Parcelas:</label>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                        {parcelasDates.map((date, index) => (
                                                            <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Parcela {index + 1}</span>
                                                                <input
                                                                    type="date"
                                                                    value={date}
                                                                    onChange={(e) => handleParcelaDateChange(index, e.target.value)}
                                                                    style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <label>Observações</label>
                                    <textarea value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} rows={2} />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={resetForm}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={createBoletoMutation.isPending || updateBoletoMutation.isPending}>
                                    {editingBoleto ? 'Salvar Alterações' : 'Criar Boleto(s)'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            <style jsx>{`
                .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1.5rem; border-top: 1px solid #f1f5f9; }
                .pagination button { padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer; }
                .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
                .vencido-row { background-color: #fff1f2; }
                .status-badge { padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
                .status-badge.pago { background: #d1fae5; color: #065f46; }
                .status-badge.pendente { background: #fffbeb; color: #92400e; }
                .status-badge.vencido { background: #fee2e2; color: #b91c1c; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .static-val { padding: 0.6rem; background: white; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 700; color: #0ea5e9; }
            `}</style>
        </div>
    );
}
