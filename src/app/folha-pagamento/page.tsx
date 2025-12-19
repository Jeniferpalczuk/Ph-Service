'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PagamentoFuncionario, PaymentMethod, PaymentStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';
import './folha.css';

export default function FolhaPagamentoPage() {
    const { user } = useAuth();
    const {
        folhaPagamento, funcionarios, vales,
        addPagamentoFuncionario, updatePagamentoFuncionario,
        deletePagamentoFuncionario, updateVale
    } = useApp();

    // UI State
    const [showModal, setShowModal] = useState(false);
    const [editingPagamento, setEditingPagamento] = useState<PagamentoFuncionario | null>(null);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Filter States
    const [filterPeriodo, setFilterPeriodo] = useState('all');
    const [filterFuncionario, setFilterFuncionario] = useState('');
    const [filterCargo, setFilterCargo] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const [formData, setFormData] = useState({
        funcionario: '',
        cargoFuncao: '',
        valor: '',
        formaPagamento: 'dinheiro' as PaymentMethod,
        statusPagamento: 'pendente' as PaymentStatus,
        dataPagamento: new Date().toISOString().split('T')[0],
        observacoes: '',
    });

    const [valesPendentes, setValesPendentes] = useState(0);

    const calculateVales = (funcNome: string) => {
        const total = vales
            .filter(v => v.funcionario === funcNome && v.status === 'aberto')
            .reduce((sum, v) => sum + v.valor, 0);
        setValesPendentes(total);
        return total;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const pagamentoData = {
            funcionario: formData.funcionario,
            cargoFuncao: formData.cargoFuncao,
            valor: parseFloat(formData.valor),
            formaPagamento: formData.formaPagamento,
            statusPagamento: formData.statusPagamento,
            dataPagamento: new Date(formData.dataPagamento),
            observacoes: formData.observacoes || undefined,
            descontos: valesPendentes > 0 ? valesPendentes : (editingPagamento?.descontos || 0)
        };

        if (editingPagamento) {
            updatePagamentoFuncionario(editingPagamento.id, pagamentoData);
        } else {
            addPagamentoFuncionario(pagamentoData);
        }

        if (formData.statusPagamento === 'pago' && valesPendentes > 0) {
            const valesDoFunc = vales.filter(v => v.funcionario === formData.funcionario && v.status === 'aberto');
            valesDoFunc.forEach(v => {
                updateVale(v.id, { status: 'quitado', observacoes: (v.observacoes || '') + ' [Baixa Automática Folha]' });
            });
        }

        resetForm();
    };

    const resetForm = () => {
        setFormData({
            funcionario: '',
            cargoFuncao: '',
            valor: '',
            formaPagamento: 'dinheiro',
            statusPagamento: 'pendente',
            dataPagamento: new Date().toISOString().split('T')[0],
            observacoes: '',
        });
        setValesPendentes(0);
        setEditingPagamento(null);
        setShowModal(false);
    };

    const handleEdit = (pagamento: PagamentoFuncionario) => {
        setEditingPagamento(pagamento);
        calculateVales(pagamento.funcionario);
        setFormData({
            funcionario: pagamento.funcionario,
            cargoFuncao: pagamento.cargoFuncao,
            valor: pagamento.valor.toString(),
            formaPagamento: pagamento.formaPagamento,
            statusPagamento: pagamento.statusPagamento,
            dataPagamento: new Date(pagamento.dataPagamento).toISOString().split('T')[0],
            observacoes: pagamento.observacoes || '',
        });
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este pagamento?')) {
            deletePagamentoFuncionario(id);
        }
    };

    // Filtered and Sorted Data
    const filteredFolha = useMemo(() => {
        return folhaPagamento
            .filter(item => {
                const matchesFunc = item.funcionario.toLowerCase().includes(filterFuncionario.toLowerCase());
                const matchesCargo = filterCargo === 'all' || item.cargoFuncao === filterCargo;
                const matchesStatus = filterStatus === 'all' || item.statusPagamento === filterStatus;

                let matchesPeriodo = true;
                if (filterPeriodo !== 'all') {
                    const [month, year] = filterPeriodo.split('/');
                    const itemDate = new Date(item.dataPagamento);
                    matchesPeriodo = itemDate.getMonth() === parseInt(month) && itemDate.getFullYear() === parseInt(year);
                }

                return matchesFunc && matchesCargo && matchesStatus && matchesPeriodo;
            })
            // Sort by Date Descending (Most recent first)
            .sort((a, b) => new Date(b.dataPagamento).getTime() - new Date(a.dataPagamento).getTime());
    }, [folhaPagamento, filterFuncionario, filterCargo, filterStatus, filterPeriodo]);

    const paginatedData = filteredFolha.slice((currentPage - 1) * perPage, currentPage * perPage);

    // Stats
    const statsTotal = filteredFolha.reduce((sum, p) => sum + p.valor, 0);
    const statsPagos = filteredFolha.filter(p => p.statusPagamento === 'pago').length;
    const statsPendentes = filteredFolha.filter(p => p.statusPagamento !== 'pago').length;
    const totalDescontos = filteredFolha.reduce((sum, p) => sum + (p.descontos || 0), 0);

    const cargos = Array.from(new Set(funcionarios.map(f => f.cargo))).filter(Boolean);

    // Periodos (Month/Year)
    const periodos = useMemo(() => {
        const p = new Set<string>();
        folhaPagamento.forEach(item => {
            const date = new Date(item.dataPagamento);
            const label = `${date.toLocaleString('pt-BR', { month: 'long' })}/${date.getFullYear()}`;
            const value = `${date.getMonth()}/${date.getFullYear()}`;
            p.add(JSON.stringify({ label, value }));
        });
        return Array.from(p).map(s => JSON.parse(s));
    }, [folhaPagamento]);

    return (
        <div className="folha-page">
            <div className="folha-header">
                <div className="folha-header-info">
                    <div className="folha-header-subtitle">
                        Total da Folha • {filterPeriodo === 'all' ? 'Geral' : periodos.find(p => p.value === filterPeriodo)?.label}
                    </div>
                    <div className="folha-header-title">
                        R$ {statsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="folha-header-badges">
                        <div className="folha-badge-summary pagos">
                            <span>✅</span> {statsPagos} pagos
                        </div>
                        <div className="folha-badge-summary pendentes">
                            <span>🕒</span> {statsPendentes} pendente
                        </div>
                        <div className="folha-badge-summary descontos">
                            <span>💳</span> R$ {totalDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} em descontos
                        </div>
                        {(filterFuncionario || filterCargo !== 'all' || filterStatus !== 'all' || filterPeriodo !== 'all') && (
                            <button className="folha-badge-summary" style={{ background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}
                                onClick={() => {
                                    setFilterFuncionario('');
                                    setFilterCargo('all');
                                    setFilterStatus('all');
                                    setFilterPeriodo('all');
                                }}>
                                🧹 Limpar Filtros
                            </button>
                        )}
                    </div>
                </div>
                <button className="btn-novo-pagamento" onClick={() => setShowModal(true)}>
                    <span>+</span> Novo Pagamento
                </button>
            </div>

            <div className="folha-filters-container">
                <div className="filter-group">
                    <label>📅 Período:</label>
                    <select value={filterPeriodo} onChange={e => setFilterPeriodo(e.target.value)}>
                        <option value="all">Todos os Períodos</option>
                        {periodos.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <label>👤 Funcionário:</label>
                    <input
                        type="text"
                        placeholder="Pesquisar funcionário..."
                        value={filterFuncionario}
                        onChange={e => setFilterFuncionario(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <label>💼 Cargo:</label>
                    <select value={filterCargo} onChange={e => setFilterCargo(e.target.value)}>
                        <option value="all">Todos os Cargos</option>
                        {cargos.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <label>🔄 Status:</label>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="all">Status: Todos</option>
                        <option value="pago">Pago</option>
                        <option value="pendente">Pendente</option>
                    </select>
                </div>
            </div>

            <div className="folha-table-container">
                <table className="folha-modern-table">
                    <thead>
                        <tr>
                            <th>DATA</th>
                            <th>FUNCIONÁRIO</th>
                            <th>CARGO</th>
                            <th>VALOR LÍQUIDO</th>
                            <th>DESCONTOS</th>
                            <th>STATUS</th>
                            <th className="text-right">AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Nenhum pagamento encontrado para os filtros selecionados.</td></tr>
                        ) : (
                            paginatedData.map((item) => (
                                <tr key={item.id}>
                                    <td>{new Date(item.dataPagamento).toLocaleDateString('pt-BR')}</td>
                                    <td className="col-funcionario">{item.funcionario}</td>
                                    <td>{item.cargoFuncao}</td>
                                    <td className="col-valor">R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td className="col-descontos">R$ {(item.descontos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td>
                                        <span className={`folha-status-badge ${item.statusPagamento}`}>
                                            {item.statusPagamento}
                                        </span>
                                    </td>
                                    <td className="text-right" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button className="btn-actions-trigger" onClick={() => handleEdit(item)} title="Editar">✏️</button>
                                        <button className="btn-actions-trigger" onClick={() => handleDelete(item.id)} title="Excluir">🗑️</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="folha-footer">
                    <div className="folha-footer-totals">
                        <div className="total-item">Total exibido: <b className="green">R$ {statsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></div>
                        <div className="total-item">Descontos: <b className="red">R$ {totalDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></div>
                    </div>
                    <div className="folha-pagination">
                        <div className="per-page-select">
                            <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} style={{ border: 'none', background: 'transparent', fontWeight: 700 }}>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            por página
                        </div>
                        <div className="pagination-controls">
                            <button className="btn-page" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>❮</button>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Página {currentPage}</span>
                            <button className="btn-page" onClick={() => setCurrentPage(prev => prev + 1)}>❯</button>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingPagamento ? 'Editar Pagamento' : 'Novo Pagamento'}</h2>
                            <button className="modal-close" onClick={resetForm}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Funcionário *</label>
                                {funcionarios.length > 0 ? (
                                    <select
                                        required
                                        value={formData.funcionario}
                                        onChange={(e) => {
                                            const funcName = e.target.value;
                                            const selected = funcionarios.find(f => f.nome === funcName);
                                            const valesTotal = calculateVales(funcName);
                                            const salarioBase = selected?.salarioBase || 0;
                                            const liquido = Math.max(0, salarioBase - valesTotal);

                                            setFormData({
                                                ...formData,
                                                funcionario: funcName,
                                                cargoFuncao: selected?.cargo || formData.cargoFuncao,
                                                valor: liquido.toFixed(2)
                                            });
                                        }}
                                    >
                                        <option value="">Selecione...</option>
                                        {funcionarios.filter(f => f.ativo).map(f => (
                                            <option key={f.id} value={f.nome}>{f.nome}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        required
                                        value={formData.funcionario}
                                        onChange={(e) => setFormData({ ...formData, funcionario: e.target.value })}
                                        placeholder="Nome do funcionário"
                                    />
                                )}
                            </div>

                            {valesPendentes > 0 && (
                                <div style={{ background: '#fff7ed', padding: '10px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #fdba74', color: '#c2410c', fontSize: '0.85rem' }}>
                                    ⚠️ Funcionário tem <b>R$ {valesPendentes.toFixed(2)}</b> em vales pendentes.<br />
                                    O valor líquido sugerido já aplica o desconto automaticamente.
                                </div>
                            )}

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Cargo</label>
                                    <input required value={formData.cargoFuncao} onChange={(e) => setFormData({ ...formData, cargoFuncao: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Valor Líquido (R$) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.valor}
                                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Data</label>
                                    <input type="date" required value={formData.dataPagamento} onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select required value={formData.statusPagamento} onChange={(e) => setFormData({ ...formData, statusPagamento: e.target.value as PaymentStatus })}>
                                        <option value="pendente">Pendente</option>
                                        <option value="pago">Pago (Baixa Automática de Vales)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">{editingPagamento ? 'Atualizar Pagamento' : 'Salvar Pagamento'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
