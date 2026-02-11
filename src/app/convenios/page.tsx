'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PaymentStatus, ClosingType, Convenio } from '@/types';
import {
    useConveniosList,
    useCreateConvenio,
    useUpdateConvenio,
    useDeleteConvenio
} from '@/hooks/financeiro/useConvenios';
import { useClientesList } from '@/hooks/cadastros/useClientes';
import { MoneyInput } from '@/components/MoneyInput';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'react-hot-toast';
import {
    LuPlus,
    LuSearch,
    LuCheck,
    LuClock,
    LuTriangleAlert,
    LuEraser,
    LuPencil,
    LuTrash2,
    LuX
} from 'react-icons/lu';
import '../shared-modern.css';

/**
 * ConveniosPage - Fase 5 (Full CRUD & React Query)
 */
export default function ConveniosPage() {
    const { user } = useAuth();

    // Hooks do Financeiro (Migrados)
    const createConvenioMutation = useCreateConvenio();
    const updateConvenioMutation = useUpdateConvenio();
    const deleteConvenioMutation = useDeleteConvenio();

    // Hooks de Cadastros
    const { data: clientesData } = useClientesList({ pageSize: 1000 });
    const clientes = clientesData?.data ?? [];

    const [showModal, setShowModal] = useState(false);
    const [editingConvenio, setEditingConvenio] = useState<Convenio | null>(null);

    // Filter States
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'todos'>('todos');
    const [page, setPage] = useState(1);

    // Fetch Convênios via React Query
    const { data: conveniosData, isLoading, isError, error } = useConveniosList({
        page,
        search: searchTerm,
        startDate: `${selectedMonth}-01`,
        endDate: `${selectedMonth}-${new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]), 0).getDate().toString().padStart(2, '0')}`,
        status: filterStatus === 'todos' ? 'all' : filterStatus
    });

    const convenios = conveniosData?.data ?? [];
    const totalPages = conveniosData?.totalPages ?? 1;

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const [yF, mF, dF] = formData.dataFechamento.split('-').map(Number);
            const dataFechAjustada = new Date(yF, mF - 1, dF, 12, 0, 0);

            const [yV, mV, dV] = formData.dataVencimento.split('-').map(Number);
            const dataVencAjustada = new Date(yV, mV - 1, dV, 12, 0, 0);

            let dataPagAjustada = null;
            if (formData.dataPagamento) {
                const [yP, mP, dP] = formData.dataPagamento.split('-').map(Number);
                dataPagAjustada = new Date(yP, mP - 1, dP, 12, 0, 0);
            }

            const payload = {
                empresa: formData.empresaCliente, // Action expects 'empresa'
                tipoFechamento: formData.tipoFechamento,
                periodoReferencia: formData.periodoReferencia,
                dataFechamento: dataFechAjustada,
                valor: parseFloat(formData.valorBoleto), // Action expects 'valor'
                banco: formData.banco,
                dataVencimento: dataVencAjustada,
                dataPagamento: dataPagAjustada,
                statusPagamento: formData.statusPagamento,
                observacoes: formData.observacoes || null,
            };

            if (editingConvenio) {
                await updateConvenioMutation.mutateAsync({ id: editingConvenio.id, updates: payload });
                toast.success('Convênio atualizado!');
            } else {
                await createConvenioMutation.mutateAsync(payload);
                toast.success('Convênio criado!');
            }
            resetForm();
        } catch (err) {
            toast.error('Erro ao salvar convênio.');
        }
    };

    const resetForm = () => {
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

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm('Tem certeza que deseja excluir este convênio?')) {
            try {
                await deleteConvenioMutation.mutateAsync(id);
                toast.success('Convênio excluído');
            } catch (err) {
                toast.error('Erro ao excluir convênio');
            }
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

    const totalValor = useMemo(() => convenios.reduce((sum, c) => sum + c.valorBoleto, 0), [convenios]);
    const totalPago = useMemo(() => convenios.filter(c => c.statusPagamento === 'pago').length, [convenios]);
    const totalPendente = useMemo(() => convenios.filter(c => c.statusPagamento === 'pendente').length, [convenios]);
    const totalVencido = useMemo(() => convenios.filter(c => c.statusPagamento === 'vencido').length, [convenios]);

    return (
        <div className="modern-page">
            <div className="modern-header">
                <div>
                    <div className="modern-header-subtitle">Gestão de Convênios</div>
                    <div className="modern-header-title">
                        {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="modern-header-badges">
                        <div className="modern-badge-summary success"><LuCheck size={16} /> {totalPago} pagos</div>
                        <div className="modern-badge-summary warning"><LuClock size={16} /> {totalPendente} pendentes</div>
                        {totalVencido > 0 && <div className="modern-badge-summary danger"><LuTriangleAlert size={16} /> {totalVencido} vencidos</div>}
                    </div>
                </div>
                <button className="btn-modern-primary" onClick={() => setShowModal(true)}><LuPlus size={18} /> Novo Convênio</button>
            </div>

            <div className="modern-filters-container">
                <div className="modern-filter-group" style={{ flex: 2 }}>
                    <label>Buscar:</label>
                    <input
                        type="text"
                        placeholder="Buscar por empresa ou período..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="modern-filter-group">
                    <label>Mês de Referência:</label>
                    <select value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); setPage(1); }}>
                        {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="modern-table-container card" style={{ padding: '0' }}>
                {isLoading ? (
                    <div style={{ padding: '2rem' }}>
                        <TableSkeleton rows={8} cols={8} />
                    </div>
                ) : isError ? (
                    <div className="error-state">
                        <p>Erro ao carregar convênios: {(error as Error).message}</p>
                    </div>
                ) : (
                    <>
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
                                {convenios.length === 0 ? (
                                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>Nenhum convênio encontrado.</td></tr>
                                ) : (
                                    convenios.map((convenio) => (
                                        <tr key={convenio.id}>
                                            <td className="col-highlight">{convenio.empresaCliente}</td>
                                            <td>{convenio.tipoFechamento}</td>
                                            <td>{convenio.periodoReferencia}</td>
                                            <td className="col-money">{convenio.valorBoleto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                            <td>{convenio.banco}</td>
                                            <td>{new Date(convenio.dataVencimento).toLocaleDateString('pt-BR')}</td>
                                            <td>
                                                <span className={`status-badge ${convenio.statusPagamento}`}>
                                                    {convenio.statusPagamento}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <button className="btn-modern-icon" onClick={() => handleEdit(convenio)}><LuPencil size={16} /></button>
                                                    <button className="btn-modern-icon" onClick={(e) => handleDelete(convenio.id, e)}><LuTrash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div className="pagination">
                                <button disabled={page === 1} onClick={() => setPage(prev => prev - 1)}>Anterior</button>
                                <span>Página {page} de {totalPages}</span>
                                <button disabled={page === totalPages} onClick={() => setPage(prev => prev + 1)}>Próxima</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal de Cadastro (Standardized) */}
            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content card" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '95%' }}>
                        <div className="modal-header">
                            <div>
                                <h2>{editingConvenio ? 'Editar Convênio' : 'Novo Convênio'}</h2>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Configure os dados do fechamento</p>
                            </div>
                            <button className="modal-close" onClick={resetForm}><LuX size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Empresa/Cliente *</label>
                                    <select required value={formData.empresaCliente} onChange={e => setFormData({ ...formData, empresaCliente: e.target.value })}>
                                        <option value="">Selecione...</option>
                                        {clientes.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                                    </select>
                                </div>

                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>Tipo de Fechamento *</label>
                                        <select required value={formData.tipoFechamento} onChange={e => setFormData({ ...formData, tipoFechamento: e.target.value as any })}>
                                            <option value="mensal">Mensal</option>
                                            <option value="quinzenal">Quinzenal</option>
                                            <option value="semanal">Semanal</option>
                                            <option value="personalizado">Personalizado</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Período *</label>
                                        <input required placeholder="Ex: Janeiro/2024" value={formData.periodoReferencia} onChange={e => setFormData({ ...formData, periodoReferencia: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>Data Fechamento *</label>
                                        <input type="date" required value={formData.dataFechamento} onChange={e => setFormData({ ...formData, dataFechamento: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Valor *</label>
                                        <MoneyInput required value={formData.valorBoleto} onChange={val => setFormData({ ...formData, valorBoleto: val.toString() })} />
                                    </div>
                                </div>

                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>Banco *</label>
                                        <input required value={formData.banco} onChange={e => setFormData({ ...formData, banco: e.target.value })} placeholder="Ex: Itaú" />
                                    </div>
                                    <div className="form-group">
                                        <label>Vencimento *</label>
                                        <input type="date" required value={formData.dataVencimento} onChange={e => setFormData({ ...formData, dataVencimento: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>Status *</label>
                                        <select value={formData.statusPagamento} onChange={e => setFormData({ ...formData, statusPagamento: e.target.value as any })}>
                                            <option value="pendente">Pendente</option>
                                            <option value="pago">Pago</option>
                                            <option value="vencido">Vencido</option>
                                            <option value="parcial">Parcial</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Data Pagamento</label>
                                        <input type="date" value={formData.dataPagamento} onChange={e => setFormData({ ...formData, dataPagamento: e.target.value })} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Observações</label>
                                    <textarea value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} rows={2} />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={resetForm}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={createConvenioMutation.isPending || updateConvenioMutation.isPending}>
                                    Salvar Convênio
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            <style jsx>{`
                .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1.5rem; border-top: 1px solid #f1f5f9; }
                .pagination button { padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer; }
                .status-badge { padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
                .status-badge.pago { background: #d1fae5; color: #065f46; }
                .status-badge.pendente { background: #fffbeb; color: #92400e; }
                .status-badge.vencido { background: #fee2e2; color: #b91c1c; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
            `}</style>
        </div>
    );
}
