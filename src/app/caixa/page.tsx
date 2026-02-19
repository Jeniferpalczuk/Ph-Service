'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FechamentoCaixa } from '@/types';
import {
    useCaixaList,
    useCreateCaixa,
    useDeleteCaixa,
    useCaixaSummary
} from '@/hooks/financeiro/useCaixa';
import { useFuncionariosDropdown } from '@/hooks/cadastros/useDropdown';
import { MoneyInput } from '@/components/MoneyInput';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { toast } from 'react-hot-toast';
import {
    LuPlus,
    LuSun,
    LuMoon,
    LuPencil,
    LuTrash2,
    LuX
} from 'react-icons/lu';
import '../shared-modern.css';

/**
 * CaixaPage - Fase 4 (Performance & UX)
 * 
 * Migrada para React Query com Skeletons e Toast.
 */
export default function CaixaPage() {
    const { user } = useAuth();

    // Hooks do Caixa
    const createCaixaMutation = useCreateCaixa();
    const deleteCaixaMutation = useDeleteCaixa();

    // Filter States
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTurno, setFilterTurno] = useState<any>('all');
    const [page, setPage] = useState(1);

    // Fetch Caixa via React Query
    const lastDay = new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]), 0).getDate().toString().padStart(2, '0');

    const { data: caixaData, isLoading: isLoadingCaixa, isError: isErrorCaixa, error: errorCaixa } = useCaixaList({
        page,
        search: searchTerm,
        startDate: `${selectedMonth}-01`,
        endDate: `${selectedMonth}-${lastDay}`,
        turno: filterTurno
    });

    const entries = caixaData?.data ?? [];
    const totalPages = caixaData?.totalPages ?? 1;

    // Fetch Totais do período
    const { data: summary } = useCaixaSummary(`${selectedMonth}-01`, `${selectedMonth}-${lastDay}`);

    // Fetch Funcionários
    const { data: funcionariosDD } = useFuncionariosDropdown();
    const employees = funcionariosDD ?? [];

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<FechamentoCaixa | null>(null);

    const [formData, setFormData] = useState({
        data: new Date().toISOString().split('T')[0],
        funcionario: '',
        turno: 'manha' as 'manha' | 'tarde',
        saidas: '',
        dinheiro: '',
        pix: '',
        credito: '',
        debito: '',
        alimentacao: '',
        observacoes: ''
    });

    const resetForm = () => {
        setFormData({
            data: new Date().toISOString().split('T')[0],
            funcionario: '',
            turno: 'manha',
            saidas: '',
            dinheiro: '',
            pix: '',
            credito: '',
            debito: '',
            alimentacao: '',
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
                data: dataAjustada,
                funcionario: formData.funcionario,
                turno: formData.turno,
                entradas: {
                    dinheiro: Number(formData.dinheiro) || 0,
                    pix: Number(formData.pix) || 0,
                    credito: Number(formData.credito) || 0,
                    debito: Number(formData.debito) || 0,
                    alimentacao: Number(formData.alimentacao) || 0,
                },
                saidas: Number(formData.saidas) || 0,
                observacoes: formData.observacoes || null
            };

            if (editingItem) {
                toast.error('Edição em breve via Server Action');
            } else {
                await createCaixaMutation.mutateAsync(payload);
                toast.success('Caixa fechado com sucesso!');
            }
            resetForm();
        } catch (err) {
            console.error('Erro ao salvar fechamento:', err);
            toast.error(err instanceof Error ? err.message : 'Erro ao salvar fechamento.');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Excluir este fechamento?')) {
            try {
                await deleteCaixaMutation.mutateAsync(id);
                toast.success('Fechamento excluído');
            } catch (err) {
                toast.error('Erro ao excluir');
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

    const saldoLiquido = (summary?.entradas || 0) - (summary?.saidas || 0);

    return (
        <div className="modern-page">
            <div className="modern-header">
                <div>
                    <div className="modern-header-subtitle">Financeiro</div>
                    <div className="modern-header-title">Fechamento de Caixa</div>
                    <div className="modern-header-badges">
                        <div className="modern-badge-summary success">
                            Saldo: {saldoLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                    </div>
                </div>
                <button className="btn-modern-primary" onClick={() => setShowModal(true)}><LuPlus size={18} /> Novo Fechamento</button>
            </div>

            <div className="modern-filters-container">
                <div className="modern-filter-group" style={{ flex: 2 }}>
                    <label>Buscar:</label>
                    <input
                        type="text"
                        placeholder="Nome do funcionário..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="modern-filter-group">
                    <label>Turno:</label>
                    <select value={filterTurno} onChange={e => setFilterTurno(e.target.value)}>
                        <option value="all">Todos</option>
                        <option value="manha">Manhã</option>
                        <option value="tarde">Tarde</option>
                    </select>
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

            <div className="modern-table-container card" style={{ padding: '0' }}>
                {isLoadingCaixa ? (
                    <div style={{ padding: '2rem' }}>
                        <TableSkeleton rows={8} cols={7} />
                    </div>
                ) : (
                    <>
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>DATA</th>
                                    <th>TURNO</th>
                                    <th>FUNCIONÁRIO</th>
                                    <th>ENTRADAS</th>
                                    <th>SAÍDAS</th>
                                    <th>LÍQUIDO</th>
                                    <th style={{ textAlign: 'right' }}>AÇÕES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>Nenhum fechamento registrado no período.</td></tr>
                                ) : (
                                    entries.map(item => {
                                        const entradasTotal = Object.values(item.entradas).reduce((a, b) => a + b, 0);
                                        return (
                                            <tr key={item.id}>
                                                <td>{item.data.toLocaleDateString('pt-BR')}</td>
                                                <td>
                                                    <span className={`status-badge ${item.turno}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        {item.turno === 'manha' ? <><LuSun size={14} /> Manhã</> : <><LuMoon size={14} /> Tarde</>}
                                                    </span>
                                                </td>
                                                <td className="col-highlight">{item.funcionario}</td>
                                                <td className="col-money">R$ {entradasTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                <td className="col-money-negative">R$ {item.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                <td className="col-highlight">R$ {(entradasTotal - item.saidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        <button className="btn-modern-icon" onClick={() => setShowModal(true)} title="Editar"><LuPencil size={16} /></button>
                                                        <button className="btn-modern-icon" onClick={() => handleDelete(item.id)} title="Excluir"><LuTrash2 size={16} /></button>
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

            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%' }}>
                        <div className="modal-header">
                            <div>
                                <h2>{editingItem ? 'Editar Fechamento' : 'Novo Fechamento'}</h2>
                            </div>
                            <button className="btn-close" onClick={resetForm}><LuX size={18} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="modern-form">
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Data *</label>
                                    <input type="date" required value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Turno *</label>
                                    <select value={formData.turno} onChange={e => setFormData({ ...formData, turno: e.target.value as any })}>
                                        <option value="manha">Manhã</option>
                                        <option value="tarde">Tarde</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Funcionário *</label>
                                <select required value={formData.funcionario} onChange={e => setFormData({ ...formData, funcionario: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    {employees.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
                                </select>
                            </div>

                            <div style={{ marginBottom: '1rem', fontWeight: 700, fontSize: '0.8rem', color: '#64748b' }}>ENTRADAS</div>
                            <div className="grid-3">
                                <div className="form-group"><label>Dinheiro</label><MoneyInput value={formData.dinheiro} onChange={v => setFormData({ ...formData, dinheiro: v.toString() })} /></div>
                                <div className="form-group"><label>Pix</label><MoneyInput value={formData.pix} onChange={v => setFormData({ ...formData, pix: v.toString() })} /></div>
                                <div className="form-group"><label>Debito</label><MoneyInput value={formData.debito} onChange={v => setFormData({ ...formData, debito: v.toString() })} /></div>
                                <div className="form-group"><label>Credito</label><MoneyInput value={formData.credito} onChange={v => setFormData({ ...formData, credito: v.toString() })} /></div>
                                <div className="form-group"><label>Alimentação</label><MoneyInput value={formData.alimentacao} onChange={v => setFormData({ ...formData, alimentacao: v.toString() })} /></div>
                                <div className="form-group"><label>Saídas</label><MoneyInput value={formData.saidas} onChange={v => setFormData({ ...formData, saidas: v.toString() })} /></div>
                            </div>

                            <div className="modal-actions" style={{ marginTop: '2rem' }}>
                                <button type="button" className="btn-secondary" onClick={resetForm}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={createCaixaMutation.isPending}>
                                    Confirmar Fechamento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
                .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
                .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1.5rem; border-top: 1px solid #f1f5f9; }
                .status-badge { padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
                .status-badge.manha { background: #eff6ff; color: #1e40af; }
                .status-badge.tarde { background: #fffbeb; color: #92400e; }
            `}</style>
        </div>
    );
}
