'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Vale, ValeStatus } from '@/types';
import {
    useValesList,
    useCreateVale,
    useUpdateVale,
    useDeleteVale,
    useQuitarVale,
    useTotalValesPendentes
} from '@/hooks/rh/useVales';
import { useFuncionariosList } from '@/hooks/cadastros/useFuncionarios';
import { MoneyInput } from '@/components/MoneyInput';
import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'react-hot-toast';
import {
    LuPlus,
    LuClock,
    LuPencil,
    LuTrash2,
    LuX
} from 'react-icons/lu';
import '../shared-modern.css';

/**
 * ValesPage - Fase 4 (Performance & UX)
 * 
 * Migrada para React Query com Skeletons e Toast.
 */
export default function ValesPage() {
    const { user } = useAuth();

    // Hooks de Vales (Migrados)
    const createValeMutation = useCreateVale();
    const updateValeMutation = useUpdateVale();
    const deleteValeMutation = useDeleteVale();

    // Filter States
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);

    // Fetch Vales via React Query
    const { data: valesData, isLoading: isLoadingVales, isError: isErrorVales, error: errorVales } = useValesList({
        page,
        search: searchTerm,
        startDate: `${selectedMonth}-01`,
        endDate: `${selectedMonth}-${new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]), 0).getDate().toString().padStart(2, '0')}`,
    });

    const vales = valesData?.data ?? [];
    const totalPages = valesData?.totalPages ?? 1;

    // Fetch Funcionários
    const { data: funcionariosData } = useFuncionariosList({ pageSize: 1000 });
    const funcionariosList = funcionariosData?.data ?? [];

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Vale | null>(null);

    const [formData, setFormData] = useState({
        funcionario: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        motivo: '',
        status: 'aberto' as ValeStatus,
        observacoes: ''
    });

    // Agrupar vales por funcionário (dos dados carregados na página)
    const valesByEmployee = useMemo(() => {
        const map = new Map<string, { funcionario: string; total: number; count: number; status: 'aberto' | 'quitado' }>();

        vales.forEach(v => {
            if (!map.has(v.funcionario)) {
                map.set(v.funcionario, { funcionario: v.funcionario, total: 0, count: 0, status: 'quitado' });
            }
            const group = map.get(v.funcionario)!;
            group.total += v.valor;
            group.count += 1;
            if (v.status === 'aberto') group.status = 'aberto';
        });

        return Array.from(map.values()).sort((a, b) => b.total - a.total);
    }, [vales]);

    const resetForm = () => {
        setFormData({
            funcionario: '',
            valor: '',
            data: new Date().toISOString().split('T')[0],
            motivo: '',
            status: 'aberto',
            observacoes: ''
        });
        setEditingItem(null);
        setShowModal(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const [y, m, d] = formData.data.split('-').map(Number);
            const dataAjustada = new Date(y, m - 1, d, 12, 0, 0);

            const payload = {
                funcionario: formData.funcionario,
                valor: parseFloat(formData.valor),
                data: dataAjustada,
                motivo: formData.motivo,
                status: formData.status,
                observacoes: formData.observacoes || null
            };

            if (editingItem) {
                await updateValeMutation.mutateAsync({ id: editingItem.id, updates: payload });
                toast.success('Vale atualizado!');
            } else {
                await createValeMutation.mutateAsync(payload);
                toast.success('Vale registrado!');
            }
            resetForm();
        } catch (err) {
            console.error('Erro ao salvar vale:', err);
            toast.error(err instanceof Error ? err.message : 'Erro ao salvar vale.');
        }
    };

    const handleEdit = (item: Vale) => {
        setEditingItem(item);
        setFormData({
            funcionario: item.funcionario,
            valor: item.valor.toString(),
            data: new Date(item.data).toISOString().split('T')[0],
            motivo: item.motivo,
            status: item.status,
            observacoes: item.observacoes || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este vale?')) {
            try {
                await deleteValeMutation.mutateAsync(id);
                toast.success('Vale excluído');
            } catch (err) {
                toast.error('Erro ao excluir vale');
            }
        }
    };

    // Meses
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

    return (
        <div className="modern-page">
            <div className="modern-header">
                <div>
                    <div className="modern-header-subtitle">Recursos Humanos</div>
                    <div className="modern-header-title">Controle de Vales</div>
                    <div className="modern-header-badges">
                        <div className="modern-badge-summary warning">
                            <LuClock size={16} /> {vales.filter(v => v.status === 'aberto').length} vales pendentes
                        </div>
                    </div>
                </div>
                <button className="btn-modern-primary" onClick={() => setShowModal(true)}><LuPlus size={18} /> Novo Vale</button>
            </div>

            <div className="modern-filters-container">
                <div className="modern-filter-group" style={{ flex: 2 }}>
                    <label>Buscar:</label>
                    <input
                        type="text"
                        placeholder="Nome do funcionário ou motivo..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="modern-filter-group">
                    <label>Mês:</label>
                    <select value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); setPage(1); }}>
                        {monthOptions.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Cards de Resumo */}
            {valesByEmployee.length > 0 && (
                <div className="employee-summary-grid">
                    {valesByEmployee.slice(0, 4).map(emp => (
                        <div key={emp.funcionario} className="card-summary">
                            <div className="emp-name">{emp.funcionario}</div>
                            <div className="emp-val">{emp.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                            <div className={`emp-status ${emp.status}`}>{emp.status}</div>
                        </div>
                    ))}
                </div>
            )}

            <div className="modern-table-container card" style={{ padding: '0' }}>
                {isLoadingVales ? (
                    <div style={{ padding: '2rem' }}>
                        <TableSkeleton rows={8} cols={6} />
                    </div>
                ) : isErrorVales ? (
                    <div className="error-state">
                        <p>Erro ao carregar vales: {(errorVales as Error).message}</p>
                    </div>
                ) : (
                    <>
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>DATA</th>
                                    <th>FUNCIONÁRIO</th>
                                    <th>MOTIVO</th>
                                    <th>VALOR</th>
                                    <th>STATUS</th>
                                    <th style={{ textAlign: 'right' }}>AÇÕES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vales.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>Nenhum vale registrado no período.</td></tr>
                                ) : (
                                    vales.map(vale => (
                                        <tr key={vale.id}>
                                            <td>{new Date(vale.data).toLocaleDateString('pt-BR')}</td>
                                            <td className="col-highlight">{vale.funcionario}</td>
                                            <td>{vale.motivo}</td>
                                            <td className="col-money-negative">{vale.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                            <td>
                                                <span className={`status-badge ${vale.status}`}>
                                                    {vale.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <button className="btn-modern-icon" onClick={() => handleEdit(vale)} title="Editar"><LuPencil size={16} /></button>
                                                    <button className="btn-modern-icon" onClick={() => handleDelete(vale.id)} title="Excluir"><LuTrash2 size={16} /></button>
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

            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%' }}>
                        <div className="modal-header">
                            <div>
                                <h2>{editingItem ? 'Editar Vale' : 'Novo Vale'}</h2>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Registre o adiantamento</p>
                            </div>
                            <button className="modal-close" onClick={resetForm}><LuX size={18} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="modern-form">
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>Funcionário *</label>
                                <select required value={formData.funcionario} onChange={e => setFormData({ ...formData, funcionario: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    {funcionariosList.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
                                </select>
                            </div>

                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Valor *</label>
                                    <MoneyInput required value={formData.valor} onChange={val => setFormData({ ...formData, valor: val.toString() })} />
                                </div>
                                <div className="form-group">
                                    <label>Data *</label>
                                    <input type="date" required value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label>Motivo *</label>
                                <input required value={formData.motivo} onChange={e => setFormData({ ...formData, motivo: e.target.value })} placeholder="Ex: Adiantamento" />
                            </div>

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label>Status *</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                                    <option value="aberto">Aberto</option>
                                    <option value="quitado">Quitado</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={resetForm}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={createValeMutation.isPending || updateValeMutation.isPending}>
                                    Salvar Vale
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .employee-summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
                .card-summary { padding: 1rem; background: white; border-radius: 12px; border: 1px solid #e2e8f0; }
                .emp-name { font-weight: 700; color: #1e293b; margin-bottom: 4px; }
                .emp-val { font-size: 1.25rem; font-weight: 800; color: #ef4444; }
                .emp-status { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; margin-top: 8px; }
                .emp-status.aberto { color: #f59e0b; }
                .emp-status.quitado { color: #10b981; }
                .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1.5rem; border-top: 1px solid #f1f5f9; }
                .pagination button { padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer; }
                .status-badge { padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
                .status-badge.quitado { background: #d1fae5; color: #065f46; }
                .status-badge.aberto { background: #fffbeb; color: #92400e; }
                .col-money-negative { color: #ef4444; font-weight: 700; text-align: right; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
            `}</style>
        </div>
    );
}
