'use client';

import { useMemo, useState } from 'react';
import { PagamentoFuncionario, PaymentMethod, PaymentStatus } from '@/types';
import { CreateFolhaPagamentoInput } from '@/lib/validations/folha-pagamento';
import {
    useFolhaPagamentoList,
    useCreatePagamento,
    useUpdatePagamento,
    useDeletePagamento
} from '@/hooks/rh/useFolhaPagamento';
import { useFuncionariosFolhaDropdown } from '@/hooks/cadastros/useDropdown';
import { useTotalValesPendentes, useQuitarValesFuncionario } from '@/hooks/rh/useVales';
import { MoneyInput } from '@/components/MoneyInput';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { toast } from 'react-hot-toast';
import {
    LuCheck,
    LuPlus,
    LuPencil,
    LuTrash2,
    LuX
} from 'react-icons/lu';
import '../shared-modern.css';
import './folha.css';

const paymentMethods: PaymentMethod[] = ['pix', 'dinheiro', 'transferencia', 'cartao_debito', 'cartao_credito', 'boleto'];

function toDateInput(date: Date | string) {
    return new Date(date).toISOString().split('T')[0];
}

function parseLocalDate(date: string) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
}

function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function FolhaPagamentoPage() {
    const createPagamentoMutation = useCreatePagamento();
    const updatePagamentoMutation = useUpdatePagamento();
    const deletePagamentoMutation = useDeletePagamento();

    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all');

    const { data: folhaData, isLoading: isLoadingFolha } = useFolhaPagamentoList({
        page,
        search: searchTerm,
        status: filterStatus
    });

    const folhaItems = useMemo(() => folhaData?.data ?? [], [folhaData?.data]);
    const totalPages = folhaData?.totalPages ?? 1;

    const { data: funcionariosDD } = useFuncionariosFolhaDropdown();
    const employees = funcionariosDD ?? [];

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<PagamentoFuncionario | null>(null);

    const [formData, setFormData] = useState({
        funcionario: '',
        cargo: '',
        salarioBase: '',
        dataPagamento: new Date().toISOString().split('T')[0],
        periodoReferencia: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
        pago: false,
        formaPagamento: 'pix' as PaymentMethod,
        faltas: '0',
        horasExtras: '0',
        vales: '0',
        marmitas: '0',
        outrosDescontos: '0',
        observacoes: ''
    });

    const { data: valesPendentes } = useTotalValesPendentes(formData.funcionario);
    const quittingValesMutation = useQuitarValesFuncionario();

    const resumo = useMemo(() => {
        const pagos = folhaItems.filter(item => item.statusPagamento === 'pago');
        const pendentes = folhaItems.filter(item => item.statusPagamento !== 'pago');

        return {
            totalPago: pagos.reduce((sum, item) => sum + item.valor, 0),
            totalPendente: pendentes.reduce((sum, item) => sum + item.valor, 0),
            quantidadePendente: pendentes.length
        };
    }, [folhaItems]);

    const calculoFolha = useMemo(() => {
        const salarioBase = parseFloat(formData.salarioBase) || 0;
        const faltas = parseFloat(formData.faltas) || 0;
        const horasExtras = parseFloat(formData.horasExtras) || 0;
        const vales = parseFloat(formData.vales) || 0;
        const marmitas = parseFloat(formData.marmitas) || 0;
        const outrosDescontos = parseFloat(formData.outrosDescontos) || 0;
        const descontoFaltas = (salarioBase / 30) * faltas;
        const totalDescontos = vales + marmitas + outrosDescontos + descontoFaltas;
        const liquido = Math.max(0, salarioBase + horasExtras - totalDescontos);

        return {
            salarioBase,
            totalDescontos,
            liquido: Number(liquido.toFixed(2))
        };
    }, [formData]);

    const resetForm = () => {
        setFormData({
            funcionario: '',
            cargo: '',
            salarioBase: '',
            dataPagamento: new Date().toISOString().split('T')[0],
            periodoReferencia: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
            pago: false,
            formaPagamento: 'pix',
            faltas: '0',
            horasExtras: '0',
            vales: '0',
            marmitas: '0',
            outrosDescontos: '0',
            observacoes: ''
        });
        setEditingItem(null);
        setShowModal(false);
    };

    const handleEditOpen = (item: PagamentoFuncionario) => {
        setEditingItem(item);
        setFormData({
            funcionario: item.funcionario,
            cargo: item.cargoFuncao || '',
            salarioBase: item.valor.toString(),
            dataPagamento: toDateInput(item.dataPagamento),
            periodoReferencia: item.periodoReferencia || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
            pago: item.statusPagamento === 'pago',
            formaPagamento: item.formaPagamento || 'pix',
            faltas: (item.faltas || 0).toString(),
            horasExtras: '0',
            vales: (item.descontos || 0).toString(),
            marmitas: '0',
            outrosDescontos: '0',
            observacoes: item.observacoes || ''
        });
        setShowModal(true);
    };

    const handleFuncionarioChange = (funcionario: string) => {
        const employee = employees.find(item => item.nome === funcionario);

        setFormData({
            ...formData,
            funcionario,
            cargo: employee?.cargo || '',
            salarioBase: (employee?.salarioBase || 0).toString(),
            vales: '0'
        });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        try {
            const payload: CreateFolhaPagamentoInput = {
                funcionario: formData.funcionario,
                cargoFuncao: formData.cargo || null,
                valor: calculoFolha.liquido,
                descontos: calculoFolha.totalDescontos,
                faltas: parseFloat(formData.faltas) || 0,
                formaPagamento: formData.formaPagamento,
                statusPagamento: formData.pago ? 'pago' : 'pendente',
                dataPagamento: parseLocalDate(formData.dataPagamento),
                periodoReferencia: formData.periodoReferencia,
                observacoes: formData.observacoes || null,
            };

            if (editingItem) {
                await updatePagamentoMutation.mutateAsync({ id: editingItem.id, updates: payload });
                toast.success(formData.pago ? 'Folha atualizada e despesa sincronizada.' : 'Folha atualizada como pendente.');
            } else {
                await createPagamentoMutation.mutateAsync(payload);
                if (formData.pago && (parseFloat(formData.vales) || 0) > 0) {
                    await quittingValesMutation.mutateAsync({
                        funcionarioNome: formData.funcionario,
                        observacao: 'Liquidado via folha de pagamento'
                    });
                }
                toast.success(formData.pago ? 'Pagamento registrado nas despesas.' : 'Folha salva como pendente.');
            }

            resetForm();
        } catch (err) {
            console.error('Erro ao processar folha:', err);
            toast.error(err instanceof Error ? err.message : 'Erro ao processar folha.');
        }
    };

    const handleTogglePaid = async (item: PagamentoFuncionario) => {
        const nextPaid = item.statusPagamento !== 'pago';

        try {
            await updatePagamentoMutation.mutateAsync({
                id: item.id,
                updates: {
                    statusPagamento: nextPaid ? 'pago' : 'pendente',
                    dataPagamento: nextPaid ? new Date() : item.dataPagamento
                }
            });
            toast.success(nextPaid ? 'Pagamento enviado para despesas.' : 'Pagamento removido das despesas.');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao atualizar pagamento.');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Excluir este pagamento? A despesa vinculada também será removida.')) {
            try {
                await deletePagamentoMutation.mutateAsync(id);
                toast.success('Pagamento excluído.');
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Erro ao excluir pagamento.');
            }
        }
    };

    return (
        <div className="folha-page">
            <div className="folha-header">
                <div>
                    <div className="folha-header-subtitle">Gestão de RH</div>
                    <div className="folha-header-title">Folha de Pagamento</div>
                    <div className="folha-header-badges">
                        <div className="folha-badge-summary pagos">Pagos: {formatCurrency(resumo.totalPago)}</div>
                        <div className="folha-badge-summary pendentes">Pendentes: {formatCurrency(resumo.totalPendente)}</div>
                        <div className="folha-badge-summary descontos">{resumo.quantidadePendente} em aberto</div>
                    </div>
                </div>
                <button className="btn-modern-primary" onClick={() => setShowModal(true)}>
                    <LuPlus size={18} /> Novo lançamento
                </button>
            </div>

            <div className="folha-filters-container">
                <div className="filter-group" style={{ flex: 2 }}>
                    <label>Buscar</label>
                    <input type="text" placeholder="Nome do colaborador..." value={searchTerm} onChange={event => setSearchTerm(event.target.value)} />
                </div>
                <div className="filter-group">
                    <label>Status</label>
                    <select value={filterStatus} onChange={event => setFilterStatus(event.target.value as PaymentStatus | 'all')}>
                        <option value="all">Todos</option>
                        <option value="pago">Pagos</option>
                        <option value="pendente">Pendentes</option>
                    </select>
                </div>
            </div>

            <div className="folha-table-container card">
                {isLoadingFolha ? <TableSkeleton rows={10} cols={7} /> : (
                    <>
                        <table className="folha-modern-table">
                            <thead>
                                <tr>
                                    <th>Pago</th>
                                    <th>Data</th>
                                    <th>Funcionário</th>
                                    <th>Período</th>
                                    <th>Forma</th>
                                    <th>Líquido</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {folhaItems.length === 0 ? (
                                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>Nenhum pagamento registrado.</td></tr>
                                ) : folhaItems.map(item => {
                                    const isPaid = item.statusPagamento === 'pago';

                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <button
                                                    type="button"
                                                    className={`folha-check-button ${isPaid ? 'checked' : ''}`}
                                                    onClick={() => handleTogglePaid(item)}
                                                    title={isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
                                                >
                                                    {isPaid && <LuCheck size={16} />}
                                                </button>
                                            </td>
                                            <td>{new Date(item.dataPagamento).toLocaleDateString('pt-BR')}</td>
                                            <td>
                                                <div className="col-funcionario">{item.funcionario}</div>
                                                <div className="folha-row-subtitle">{item.cargoFuncao || 'Sem cargo informado'}</div>
                                            </td>
                                            <td>{item.periodoReferencia || '-'}</td>
                                            <td style={{ textTransform: 'capitalize' }}>{item.formaPagamento?.replace('_', ' ')}</td>
                                            <td className="col-valor">{formatCurrency(item.valor)}</td>
                                            <td><span className={`status-badge ${item.statusPagamento}`}>{item.statusPagamento}</span></td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn-modern-icon" onClick={() => handleEditOpen(item)} title="Editar"><LuPencil size={16} /></button>
                                                <button className="btn-modern-icon" onClick={() => handleDelete(item.id)} title="Excluir"><LuTrash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                    </>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content card folha-modal" onClick={event => event.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>{editingItem ? 'Editar folha' : 'Novo lançamento'}</h2>
                                <p className="folha-modal-subtitle">Marque como pago para lançar automaticamente em despesas mensais.</p>
                            </div>
                            <button className="btn-close" onClick={resetForm}><LuX size={18} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="modern-form">
                            <div className="folha-paycheck-card">
                                <div>
                                    <span>Líquido a pagar</span>
                                    <strong>{formatCurrency(calculoFolha.liquido)}</strong>
                                </div>
                                <label className="folha-paid-toggle">
                                    <input
                                        type="checkbox"
                                        checked={formData.pago}
                                        onChange={event => setFormData({ ...formData, pago: event.target.checked })}
                                    />
                                    <span>Pago</span>
                                </label>
                            </div>

                            <div className="form-group">
                                <label>Funcionário *</label>
                                <select required value={formData.funcionario} onChange={event => handleFuncionarioChange(event.target.value)}>
                                    <option value="">Selecione...</option>
                                    {employees.filter(employee => employee.ativo).map(employee => (
                                        <option key={employee.id} value={employee.nome}>{employee.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Cargo</label>
                                    <input value={formData.cargo} onChange={event => setFormData({ ...formData, cargo: event.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Período</label>
                                    <input type="month" value={formData.periodoReferencia} onChange={event => setFormData({ ...formData, periodoReferencia: event.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Salário base *</label>
                                    <MoneyInput required value={formData.salarioBase} onChange={value => setFormData({ ...formData, salarioBase: value.toString() })} />
                                </div>
                                <div className="form-group">
                                    <label>Data de pagamento</label>
                                    <input type="date" required value={formData.dataPagamento} onChange={event => setFormData({ ...formData, dataPagamento: event.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Forma de pagamento</label>
                                    <select value={formData.formaPagamento} onChange={event => setFormData({ ...formData, formaPagamento: event.target.value as PaymentMethod })}>
                                        {paymentMethods.map(method => <option key={method} value={method}>{method.replace('_', ' ')}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Faltas (dias)</label>
                                    <input type="number" min="0" step="0.5" value={formData.faltas} onChange={event => setFormData({ ...formData, faltas: event.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Horas extras / adicional</label>
                                    <MoneyInput value={formData.horasExtras} onChange={value => setFormData({ ...formData, horasExtras: value.toString() })} />
                                </div>
                                <div className="form-group">
                                    <label>Vales</label>
                                    <MoneyInput value={formData.vales} onChange={value => setFormData({ ...formData, vales: value.toString() })} />
                                    {(valesPendentes || 0) > 0 && (
                                        <button
                                            type="button"
                                            className="folha-inline-action"
                                            onClick={() => setFormData({ ...formData, vales: String(valesPendentes || 0) })}
                                        >
                                            Usar vales em aberto: {formatCurrency(valesPendentes || 0)}
                                        </button>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Marmitas</label>
                                    <MoneyInput value={formData.marmitas} onChange={value => setFormData({ ...formData, marmitas: value.toString() })} />
                                </div>
                                <div className="form-group">
                                    <label>Outros descontos</label>
                                    <MoneyInput value={formData.outrosDescontos} onChange={value => setFormData({ ...formData, outrosDescontos: value.toString() })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Observações</label>
                                <textarea value={formData.observacoes} onChange={event => setFormData({ ...formData, observacoes: event.target.value })} rows={3} />
                            </div>

                            <div className="folha-calculation-strip">
                                <span>Base: {formatCurrency(calculoFolha.salarioBase)}</span>
                                <span>Descontos: {formatCurrency(calculoFolha.totalDescontos)}</span>
                                <strong>Líquido: {formatCurrency(calculoFolha.liquido)}</strong>
                            </div>

                            <div className="modal-actions" style={{ marginTop: '2rem' }}>
                                <button type="button" className="btn-secondary" onClick={resetForm}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={createPagamentoMutation.isPending || updatePagamentoMutation.isPending}>
                                    {formData.pago ? 'Salvar e lançar despesa' : 'Salvar como pendente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
