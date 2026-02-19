'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PagamentoFuncionario, PaymentMethod, PaymentStatus } from '@/types';
import {
    useFolhaPagamentoList,
    useCreatePagamento,
    useUpdatePagamento,
    useDeletePagamento,
    calcularValorLiquido
} from '@/hooks/rh/useFolhaPagamento';
import { useFuncionariosFolhaDropdown } from '@/hooks/cadastros/useDropdown';
import { useTotalValesPendentes, useQuitarValesFuncionario } from '@/hooks/rh/useVales';
import { MoneyInput } from '@/components/MoneyInput';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { toast } from 'react-hot-toast';
import {
    LuPlus,
    LuPencil,
    LuTrash2,
    LuX
} from 'react-icons/lu';
import '../shared-modern.css';
import './folha.css';

/**
 * FolhaPagamentoPage - Fase 5 (Advanced Features)
 * 
 * Migrada para CRUD completo e React Query.
 */
export default function FolhaPagamentoPage() {
    const { user } = useAuth();
    const createPagamentoMutation = useCreatePagamento();
    const updatePagamentoMutation = useUpdatePagamento();
    const deletePagamentoMutation = useDeletePagamento();

    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const { data: folhaData, isLoading: isLoadingFolha } = useFolhaPagamentoList({
        page,
        search: searchTerm,
        status: filterStatus as any
    });

    const folhaItems = folhaData?.data ?? [];
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
        status: 'pago' as 'pago' | 'pendente' | 'cancelado',
        faltas: '0',
        horasExtras: '0',
        vales: '0',
        marmitas: '0',
        outrosDescontos: '0',
        observacoes: ''
    });

    const { data: valesPendentes } = useTotalValesPendentes(formData.funcionario);
    const quittingValesMutation = useQuitarValesFuncionario();

    const resetForm = () => {
        setFormData({
            funcionario: '',
            cargo: '',
            salarioBase: '',
            dataPagamento: new Date().toISOString().split('T')[0],
            periodoReferencia: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
            status: 'pago',
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
            salarioBase: item.valor.toString(), // Simplified for now
            dataPagamento: new Date(item.dataPagamento).toISOString().split('T')[0],
            periodoReferencia: item.periodoReferencia || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
            status: (item.statusPagamento as any) === 'pago' ? 'pago' : 'pendente',
            faltas: (item.faltas || 0).toString(),
            horasExtras: '0',
            vales: (item.descontos || 0).toString(),
            marmitas: '0',
            outrosDescontos: '0',
            observacoes: item.observacoes || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const [y, m, d] = formData.dataPagamento.split('-').map(Number);
            const dataAjustada = new Date(y, m - 1, d, 12, 0, 0);

            const vLiquido = parseFloat(formData.salarioBase) - (parseFloat(formData.vales) + parseFloat(formData.marmitas) + parseFloat(formData.outrosDescontos));

            const payload: any = {
                funcionario: formData.funcionario,
                cargo: formData.cargo,
                salarioBase: parseFloat(formData.salarioBase),
                dataPagamento: dataAjustada,
                periodoReferencia: formData.periodoReferencia,
                status: formData.status,
                faltas: parseFloat(formData.faltas),
                valorLiquido: vLiquido,
                vales: parseFloat(formData.vales) || (valesPendentes || 0),
                marmitas: parseFloat(formData.marmitas),
                outrosDescontos: parseFloat(formData.outrosDescontos),
                observacoes: formData.observacoes || null
            };

            if (editingItem) {
                await updatePagamentoMutation.mutateAsync({ id: editingItem.id, updates: payload });
                toast.success('Folha atualizada!');
            } else {
                await createPagamentoMutation.mutateAsync(payload);
                if (formData.status === 'pago' && (valesPendentes || 0) > 0) {
                    await quittingValesMutation.mutateAsync({
                        funcionarioNome: formData.funcionario,
                        observacao: 'Liquidado via Folha'
                    });
                }
                toast.success('Folha registrada!');
            }
            resetForm();
        } catch (err) {
            toast.error('Erro ao processar folha.');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Excluir este pagamento?')) {
            try {
                await deletePagamentoMutation.mutateAsync(id);
                toast.success('Excluído');
            } catch (err) {
                toast.error('Erro ao excluir');
            }
        }
    };

    return (
        <div className="folha-page">
            <div className="folha-header">
                <div>
                    <div className="folha-header-subtitle">Gestão de RH</div>
                    <div className="folha-header-title">Folha de Pagamento</div>
                </div>
                <button className="btn-modern-primary" onClick={() => setShowModal(true)}><LuPlus size={18} /> Novo Pagamento</button>
            </div>

            <div className="folha-filters-container">
                <div className="filter-group" style={{ flex: 2 }}>
                    <label>Buscar:</label>
                    <input type="text" placeholder="Nome do colaborador..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="filter-group">
                    <label>Status:</label>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
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
                                    <th>DATA</th>
                                    <th>FUNCIONÁRIO</th>
                                    <th>PERÍODO</th>
                                    <th>LÍQUIDO</th>
                                    <th>STATUS</th>
                                    <th style={{ textAlign: 'right' }}>AÇÕES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {folhaItems.map(item => (
                                    <tr key={item.id}>
                                        <td>{new Date(item.dataPagamento).toLocaleDateString('pt-BR')}</td>
                                        <td className="col-funcionario">{item.funcionario}</td>
                                        <td>{item.periodoReferencia}</td>
                                        <td className="col-valor">R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td><span className={`status-badge ${item.statusPagamento}`}>{item.statusPagamento}</span></td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="btn-modern-icon" onClick={() => handleEditOpen(item)} title="Editar"><LuPencil size={16} /></button>
                                            <button className="btn-modern-icon" onClick={() => handleDelete(item.id)} title="Excluir"><LuTrash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
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

            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content card" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', width: '95%' }}>
                        <div className="modal-header">
                            <div><h2>{editingItem ? 'Editar Folha' : 'Novo Pagamento'}</h2></div>
                            <button className="btn-close" onClick={resetForm}><LuX size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modern-form">
                            <div className="form-group">
                                <label>Funcionário *</label>
                                <select required value={formData.funcionario} onChange={e => {
                                    const f = employees.find(x => x.nome === e.target.value);
                                    setFormData({ ...formData, funcionario: e.target.value, cargo: f?.cargo || '', salarioBase: (f?.salarioBase || 0).toString() });
                                }}>
                                    <option value="">Selecione...</option>
                                    {employees.filter(f => f.ativo).map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
                                </select>
                            </div>
                            <div className="grid-2">
                                <div className="form-group"><label>Salário Base *</label><MoneyInput value={formData.salarioBase} onChange={v => setFormData({ ...formData, salarioBase: v.toString() })} /></div>
                                <div className="form-group"><label>Período (YYYY-MM)</label><input type="month" value={formData.periodoReferencia} onChange={e => setFormData({ ...formData, periodoReferencia: e.target.value })} /></div>
                                <div className="form-group"><label>Faltas (Dias)</label><input type="number" value={formData.faltas} onChange={e => setFormData({ ...formData, faltas: e.target.value })} /></div>
                                <div className="form-group"><label>Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                                        <option value="pendente">Pendente</option>
                                        <option value="pago">Pago</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions" style={{ marginTop: '2rem' }}>
                                <button type="button" className="btn-secondary" onClick={resetForm}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={createPagamentoMutation.isPending || updatePagamentoMutation.isPending}>Confirmar Lançamento</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
