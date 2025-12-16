'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PagamentoFuncionario, PaymentMethod, PaymentStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';
import '../convenios/convenios.css';

export default function FolhaPagamentoPage() {
    // Adicionado vales e updateVale
    const { user } = useAuth();
    const { folhaPagamento, funcionarios, vales, addPagamentoFuncionario, updatePagamentoFuncionario, deletePagamentoFuncionario, updateVale } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editingPagamento, setEditingPagamento] = useState<PagamentoFuncionario | null>(null);

    const [formData, setFormData] = useState({
        funcionario: '',
        cargoFuncao: '',
        valor: '',
        formaPagamento: 'dinheiro' as PaymentMethod,
        statusPagamento: 'pendente' as PaymentStatus,
        dataPagamento: new Date().toISOString().split('T')[0],
        observacoes: '',
    });

    // Novo estado para mostrar vales encontrados
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

        // Se pagou, baixar vales
        if (formData.statusPagamento === 'pago' && valesPendentes > 0) {
            const valesDoFunc = vales.filter(v => v.funcionario === formData.funcionario && v.status === 'aberto');
            valesDoFunc.forEach(v => {
                updateVale(v.id, { status: 'quitado', observacoes: (v.observacoes || '') + ' [Baixa Automática Folha]' });
            });
            alert(`${valesDoFunc.length} vales foram marcados como descontados.`);
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
        // Ao editar, recalcular vales apenas visualmente (talvez ja tenham sido pagos?)
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

    const handleDelete = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm('Tem certeza que deseja excluir este pagamento?')) {
            deletePagamentoFuncionario(id);
        }
    };

    const totalFolha = folhaPagamento.reduce((sum, p) => sum + p.valor, 0);
    const totalPago = folhaPagamento.filter(p => p.statusPagamento === 'pago').reduce((sum, p) => sum + p.valor, 0);
    const totalPendente = folhaPagamento.filter(p => p.statusPagamento !== 'pago').reduce((sum, p) => sum + p.valor, 0);

    return (
        <div className="convenios-page">
            <div className="page-header">
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-label">Total Folha</span>
                        <span className="stat-value">R$ {totalFolha.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    ➕ Novo Pagamento
                </button>
            </div>

            <div className="table-container card">
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Funcionário</th>
                            <th>Cargo</th>
                            <th>Valor Líquido</th>
                            <th>Descontos</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {folhaPagamento.length === 0 ? (
                            <tr><td colSpan={7} className="text-center">Nenhum pagamento registrado</td></tr>
                        ) : (
                            folhaPagamento.map((item) => (
                                <tr key={item.id}>
                                    <td>{new Date(item.dataPagamento).toLocaleDateString('pt-BR')}</td>
                                    <td className="font-semibold">{item.funcionario}</td>
                                    <td>{item.cargoFuncao}</td>
                                    <td className="font-semibold">R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td className="text-danger">
                                        {item.descontos ? `R$ ${item.descontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                    </td>
                                    <td><span className={`badge ${item.statusPagamento === 'pago' ? 'badge-success' : 'badge-warning'}`}>{item.statusPagamento}</span></td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-icon" onClick={() => handleEdit(item)}>✏️</button>
                                            {user?.role === 'adm' && (
                                                <button className="btn-icon" onClick={(e) => handleDelete(item.id, e)}>🗑️</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
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

                                            // Calcular vales e desconto
                                            const valesTotal = calculateVales(funcName);
                                            const salarioBase = selected?.salarioBase || 0;
                                            const liquido = Math.max(0, salarioBase - valesTotal);

                                            setFormData({
                                                ...formData,
                                                funcionario: funcName,
                                                cargoFuncao: selected?.cargo || formData.cargoFuncao,
                                                valor: liquido.toFixed(2) // Preenche liquido automatico
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

                            {/* EXIBIR VALES ENCONTRADOS */}
                            {valesPendentes > 0 && (
                                <div style={{ background: '#fff7ed', padding: '10px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #fdba74', color: '#c2410c' }}>
                                    ⚠️ Funcionário tem <b>R$ {valesPendentes.toFixed(2)}</b> em vales pendentes.<br />
                                    O valor sugerido abaixo já aplica o desconto.
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
                                        <option value="pago">Pago (Baixa Vales)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">{editingPagamento ? 'Atualizar' : 'Salvar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
