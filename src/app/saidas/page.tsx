'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Saida, ExpenseCategory, PaymentMethod } from '@/types';
import {
    useSaidasList,
    useCreateSaida,
    useUpdateSaida,
    useDeleteSaida,
    useSaidasTotal
} from '@/hooks/financeiro/useSaidas';
import { useFornecedoresList } from '@/hooks/cadastros/useFornecedores';
import { MoneyInput } from '@/components/MoneyInput';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'react-hot-toast';
import {
    LuPlus,
    LuTrendingDown,
    LuPencil,
    LuTrash2,
    LuX
} from 'react-icons/lu';
import '../shared-modern.css';

/**
 * SaidasPage - Fase 5 (Advanced Features)
 * 
 * Implementado CRUD completo via Server Actions + React Query.
 */
export default function SaidasPage() {
    const { user } = useAuth();

    // Hooks de Saídas
    const createSaidaMutation = useCreateSaida();
    const updateSaidaMutation = useUpdateSaida();
    const deleteSaidaMutation = useDeleteSaida();

    // Filter States
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);

    // Fetch Saidas via React Query
    const lastDay = new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]), 0).getDate().toString().padStart(2, '0');

    const { data: saidasData, isLoading: isLoadingSaidas } = useSaidasList({
        page,
        search: searchTerm,
        startDate: `${selectedMonth}-01`,
        endDate: `${selectedMonth}-${lastDay}`,
    });

    const saidas = saidasData?.data ?? [];
    const totalPages = saidasData?.totalPages ?? 1;

    // Fetch Totais
    const { data: totalSaidasVal } = useSaidasTotal(`${selectedMonth}-01`, `${selectedMonth}-${lastDay}`);

    // Fetch Fornecedores
    const { data: fornecedoresData } = useFornecedoresList({ pageSize: 1000 });
    const fornecedores = fornecedoresData?.data ?? [];

    const [showModal, setShowModal] = useState(false);
    const [editingSaida, setEditingSaida] = useState<Saida | null>(null);

    const [formData, setFormData] = useState({
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        categoria: 'outros' as ExpenseCategory,
        formaPagamento: 'dinheiro' as PaymentMethod,
        fornecedor: '',
        observacoes: '',
    });

    const CATEGORY_MAP: Record<string, ExpenseCategory> = {
        'Fornecedores': 'fornecedores',
        'Funcionários': 'funcionarios',
        'Aluguel': 'aluguel',
        'Energia': 'energia',
        'Água': 'agua',
        'Gás': 'gas',
        'Internet': 'internet',
        'Telefone': 'telefone',
        'Impostos': 'impostos',
        'Manutenção': 'manutencao',
        'Marketing': 'marketing',
        'Outros': 'outros'
    };

    const pagamentos: PaymentMethod[] = ['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia'];

    const resetForm = () => {
        setFormData({
            descricao: '',
            valor: '',
            data: new Date().toISOString().split('T')[0],
            categoria: 'outros',
            formaPagamento: 'dinheiro',
            fornecedor: '',
            observacoes: '',
        });
        setEditingSaida(null);
        setShowModal(false);
    };

    const handleEditOpen = (saida: Saida) => {
        setEditingSaida(saida);
        setFormData({
            descricao: saida.descricao,
            valor: saida.valor.toString(),
            data: new Date(saida.data).toISOString().split('T')[0],
            categoria: saida.categoria,
            formaPagamento: saida.formaPagamento,
            fornecedor: saida.fornecedor || '',
            observacoes: saida.observacoes || '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const [y, m, d] = formData.data.split('-').map(Number);
            const dataAjustada = new Date(y, m - 1, d, 12, 0, 0);

            const payload = {
                descricao: formData.descricao,
                valor: parseFloat(formData.valor),
                data: dataAjustada,
                categoria: formData.categoria,
                metodoPagamento: formData.formaPagamento,
                observacoes: formData.observacoes || null,
            };

            if (editingSaida) {
                await updateSaidaMutation.mutateAsync({ id: editingSaida.id, updates: payload });
                toast.success('Saída atualizada!');
            } else {
                await createSaidaMutation.mutateAsync(payload);
                toast.success('Saída registrada!');
            }
            resetForm();
        } catch (err) {
            toast.error('Erro ao processar solicitação.');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Excluir esta despesa?')) {
            try {
                await deleteSaidaMutation.mutateAsync(id);
                toast.success('Excluída com sucesso');
            } catch (err) {
                toast.error('Erro ao excluir');
            }
        }
    };

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
                    <div className="modern-header-subtitle">Financeiro</div>
                    <div className="modern-header-title">Controle de Saídas</div>
                    <div className="modern-header-badges">
                        <div className="modern-badge-summary danger">
                            <LuTrendingDown size={16} /> Total: {totalSaidasVal?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                        </div>
                    </div>
                </div>
                <button className="btn-modern-primary" onClick={() => setShowModal(true)}><LuPlus size={18} /> Nova Saída</button>
            </div>

            <div className="modern-filters-container">
                <div className="modern-filter-group" style={{ flex: 2 }}>
                    <label>Buscar:</label>
                    <input
                        type="text"
                        placeholder="Descrição ou fornecedor..."
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

            <div className="modern-table-container card" style={{ padding: '0' }}>
                {isLoadingSaidas ? (
                    <div style={{ padding: '2rem' }}>
                        <TableSkeleton rows={8} cols={6} />
                    </div>
                ) : (
                    <>
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>DATA</th>
                                    <th>DESCRIÇÃO / FORNECEDOR</th>
                                    <th>CATEGORIA</th>
                                    <th>FORMA</th>
                                    <th>VALOR</th>
                                    <th style={{ textAlign: 'right' }}>AÇÕES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {saidas.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>Nenhuma saída registrada.</td></tr>
                                ) : (
                                    saidas.map(saida => (
                                        <tr key={saida.id}>
                                            <td>{new Date(saida.data).toLocaleDateString('pt-BR')}</td>
                                            <td>
                                                <div className="col-highlight">{saida.descricao}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{saida.fornecedor || '-'}</div>
                                            </td>
                                            <td><span className="status-badge neutral">{saida.categoria}</span></td>
                                            <td style={{ textTransform: 'capitalize' }}>{saida.formaPagamento?.replace('_', ' ')}</td>
                                            <td className="col-money-negative">{saida.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <button className="btn-modern-icon" onClick={() => handleEditOpen(saida)} title="Editar"><LuPencil size={16} /></button>
                                                    <button className="btn-modern-icon" onClick={() => handleDelete(saida.id)} title="Excluir"><LuTrash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
                                <span>Página {page} de {totalPages}</span>
                                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Próxima</button>
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
                                <h2>{editingSaida ? 'Editar Saída' : 'Nova Saída'}</h2>
                            </div>
                            <button className="btn-close" onClick={resetForm}><LuX size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modern-form">
                            <div className="form-group"><label>Descrição *</label><input required value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} /></div>
                            <div className="grid-2">
                                <div className="form-group"><label>Valor *</label><MoneyInput required value={formData.valor} onChange={val => setFormData({ ...formData, valor: val.toString() })} /></div>
                                <div className="form-group"><label>Data *</label><input type="date" required value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} /></div>
                                <div className="form-group"><label>Categoria *</label>
                                    <select value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value as any })}>
                                        {Object.entries(CATEGORY_MAP).map(([l, v]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                </div>
                                <div className="form-group"><label>Pagamento *</label>
                                    <select value={formData.formaPagamento} onChange={e => setFormData({ ...formData, formaPagamento: e.target.value as any })}>
                                        {pagamentos.map(p => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions" style={{ marginTop: '2rem' }}>
                                <button type="button" className="btn-secondary" onClick={resetForm}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={createSaidaMutation.isPending || updateSaidaMutation.isPending}>
                                    {editingSaida ? 'Salvar Alterações' : 'Confirmar Saída'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <style jsx>{`
                .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1.5rem; border-top: 1px solid #f1f5f9; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .col-money-negative { color: #ef4444; font-weight: 700; text-align: right; }
                .status-badge { padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; background: #f1f5f9; color: #475569; }
            `}</style>
        </div>
    );
}
