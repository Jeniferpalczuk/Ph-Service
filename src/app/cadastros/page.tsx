'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Funcionario, Cliente, Fornecedor } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { MoneyInput } from '@/components/MoneyInput';
import './cadastros.css';

export default function CadastrosPage() {
    const { user } = useAuth();
    const {
        funcionarios, addFuncionario, updateFuncionario, deleteFuncionario,
        clientes, addCliente, updateCliente, deleteCliente,
        fornecedores, addFornecedor, updateFornecedor, deleteFornecedor
    } = useApp();

    const [activeTab, setActiveTab] = useState<'funcionarios' | 'clientes' | 'fornecedores'>('funcionarios');
    const [searchTerm, setSearchTerm] = useState('');

    // Estados dos Modais
    const [showFuncModal, setShowFuncModal] = useState(false);
    const [showClienteModal, setShowClienteModal] = useState(false);
    const [showFornecModal, setShowFornecModal] = useState(false);

    const [editingFunc, setEditingFunc] = useState<Funcionario | null>(null);
    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
    const [editingFornec, setEditingFornec] = useState<Fornecedor | null>(null);

    // Formulários
    const [funcData, setFuncData] = useState({
        nome: '', cargo: '', telefone: '', salarioBase: '',
        dataAdmissao: '', dataDemissao: '', ativo: true
    });
    const [clienteData, setClienteData] = useState({ nome: '', tipo: 'empresa', telefone: '', endereco: '', ativo: true });
    const [fornecData, setFornecData] = useState({ nome: '', categoria: '', contato: '', ativo: true, observacoes: '' });

    // --- Handlers Funcionários ---
    const handleFuncSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let admissao = undefined;
        if (funcData.dataAdmissao) {
            const [yA, mA, dA] = funcData.dataAdmissao.split('-').map(Number);
            admissao = new Date(yA, mA - 1, dA, 12, 0, 0);
        }

        let demissao = undefined;
        if (funcData.dataDemissao) {
            const [yD, mD, dD] = funcData.dataDemissao.split('-').map(Number);
            demissao = new Date(yD, mD - 1, dD, 12, 0, 0);
        }

        // Se tem data de demissão, considera inativo
        const isAtivo = !funcData.dataDemissao;

        const payload = {
            nome: funcData.nome,
            cargo: funcData.cargo,
            telefone: funcData.telefone,
            salarioBase: parseFloat(funcData.salarioBase) || 0,
            dataAdmissao: admissao,
            dataDemissao: demissao,
            ativo: isAtivo
        };

        if (editingFunc) updateFuncionario(editingFunc.id, payload);
        else addFuncionario(payload as any); // Type assertion needed for optional fields handling if strict

        resetFuncForm();
    };

    const resetFuncForm = () => {
        setFuncData(prev => ({
            ...prev,
            nome: '', cargo: '', telefone: '', salarioBase: '', ativo: true
        }));
        setEditingFunc(null); setShowFuncModal(false);
    };

    const editFunc = (f: Funcionario) => {
        setEditingFunc(f);
        setFuncData({
            nome: f.nome, cargo: f.cargo, telefone: f.telefone || '',
            salarioBase: f.salarioBase ? f.salarioBase.toString() : '',
            dataAdmissao: f.dataAdmissao ? new Date(f.dataAdmissao).toISOString().split('T')[0] : '',
            dataDemissao: f.dataDemissao ? new Date(f.dataDemissao).toISOString().split('T')[0] : '',
            ativo: f.ativo
        });
        setShowFuncModal(true);
    };

    // --- Handlers Clientes ---
    const handleClienteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCliente) updateCliente(editingCliente.id, clienteData as any);
        else addCliente(clienteData as any);
        resetClienteForm();
    };
    const resetClienteForm = () => {
        setClienteData({ nome: '', tipo: 'empresa', telefone: '', endereco: '', ativo: true });
        setEditingCliente(null); setShowClienteModal(false);
    };
    const editCliente = (c: Cliente) => {
        setEditingCliente(c);
        setClienteData({ nome: c.nome, tipo: c.tipo, telefone: c.telefone || '', endereco: c.endereco || '', ativo: c.ativo });
        setShowClienteModal(true);
    };

    // --- Handlers Fornecedores ---
    const handleFornecSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingFornec) updateFornecedor(editingFornec.id, fornecData);
        else addFornecedor(fornecData);
        resetFornecForm();
    };
    const resetFornecForm = () => {
        setFornecData({ nome: '', categoria: '', contato: '', ativo: true, observacoes: '' });
        setEditingFornec(null); setShowFornecModal(false);
    };
    const editFornec = (f: Fornecedor) => {
        setEditingFornec(f);
        setFornecData({ nome: f.nome, categoria: f.categoria, contato: f.contato, ativo: f.ativo, observacoes: f.observacoes || '' });
        setShowFornecModal(true);
    };

    // Helper para deletar (agora com verificação)
    const handleDeleteFunc = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm('Excluir este funcionário permanentemente?\nO histórico financeiro pode ser afetado.')) deleteFuncionario(id);
    };

    return (
        <div className="cadastros-page">
            <div className="page-header">
                <h2>Cadastros Gerais</h2>
            </div>

            <div className="tabs-container">
                <button className={`tab-btn ${activeTab === 'funcionarios' ? 'active' : ''}`} onClick={() => setActiveTab('funcionarios')}>
                    👨‍🍳 Funcionários
                </button>
                <button className={`tab-btn ${activeTab === 'clientes' ? 'active' : ''}`} onClick={() => setActiveTab('clientes')}>
                    🏢 Clientes / Empresas
                </button>
                <button className={`tab-btn ${activeTab === 'fornecedores' ? 'active' : ''}`} onClick={() => setActiveTab('fornecedores')}>
                    🚚 Fornecedores
                </button>
            </div>

            {/* Barra de Pesquisa */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.1rem' }}>🔍</span>
                    <input
                        type="text"
                        placeholder={`Buscar ${activeTab === 'funcionarios' ? 'funcionários' : activeTab === 'clientes' ? 'clientes' : 'fornecedores'}...`}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 40px',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.95rem',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            <div className="tab-content card">
                {/* FUNCIONARIOS TAB */}
                {activeTab === 'funcionarios' && (
                    <div className="entity-list">
                        <div className="list-header">
                            <h3>Lista de Funcionários</h3>
                            <button className="btn btn-primary" onClick={() => setShowFuncModal(true)}>+ Novo Funcionário</button>
                        </div>
                        <div className="grid-list">
                            {funcionarios
                                .filter(f =>
                                (f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    f.cargo.toLowerCase().includes(searchTerm.toLowerCase()))
                                )
                                .sort((a, b) => {
                                    // Sort Active first, then by Name
                                    if (a.ativo === b.ativo) return a.nome.localeCompare(b.nome);
                                    return a.ativo ? -1 : 1;
                                })
                                .map(f => {
                                    const isDemitido = !!f.dataDemissao;
                                    return (
                                        <div key={f.id} className="entity-card" style={{ borderColor: isDemitido ? 'var(--danger-500)' : undefined, background: isDemitido ? '#fff5f5' : undefined }}>
                                            <div className="entity-info">
                                                <h4 style={{ color: isDemitido ? 'var(--danger-600)' : undefined }}>
                                                    {f.nome} {isDemitido && <span style={{ fontSize: '0.7rem', border: '1px solid currentColor', borderRadius: '4px', padding: '1px 4px' }}>DEMITIDO</span>}
                                                </h4>
                                                <p>{f.cargo}</p>
                                                <span style={{ fontWeight: 600 }}>R$ {f.salarioBase?.toFixed(2)}</span>
                                                {isDemitido && (
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--danger-600)', marginTop: '4px' }}>
                                                        Demissão: {new Date(f.dataDemissao!).toLocaleDateString('pt-BR')}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="entity-actions">
                                                <button type="button" onClick={() => editFunc(f)} style={{ cursor: 'pointer' }}>✏️</button>
                                                {user?.role === 'adm' && (
                                                    <button type="button" onClick={(e) => handleDeleteFunc(f.id, e)} className="btn-delete" style={{ cursor: 'pointer' }}>🗑️</button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {/* CLIENTES TAB */}
                {activeTab === 'clientes' && (
                    <div className="entity-list">
                        <div className="list-header">
                            <h3>Lista de Clientes / Empresas Parceiras</h3>
                            <button className="btn btn-primary" onClick={() => setShowClienteModal(true)}>+ Novo Cliente</button>
                        </div>
                        <div className="grid-list">
                            {clientes.filter(c =>
                                c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (c.telefone || '').toLowerCase().includes(searchTerm.toLowerCase())
                            ).map(c => (
                                <div key={c.id} className="entity-card">
                                    <div className="entity-info">
                                        <h4>{c.nome}</h4>
                                        <span className="badge badge-neutral">{c.tipo === 'empresa' ? 'Empresa' : 'Pessoa Física'}</span>
                                        <p>{c.telefone}</p>
                                    </div>
                                    <div className="entity-actions">
                                        <button type="button" onClick={() => editCliente(c)} style={{ cursor: 'pointer' }}>✏️</button>
                                        {user?.role === 'adm' && (
                                            <button type="button" onClick={(e) => { e.stopPropagation(); if (confirm('Excluir?')) deleteCliente(c.id) }} style={{ cursor: 'pointer' }}>🗑️</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* FORNECEDORES TAB */}
                {activeTab === 'fornecedores' && (
                    <div className="entity-list">
                        <div className="list-header">
                            <h3>Despesas Recorrentes & Fornecedores</h3>
                            <button className="btn btn-primary" onClick={() => setShowFornecModal(true)}>+ Novo Fornecedor</button>
                        </div>
                        <div className="grid-list">
                            {fornecedores.filter(f =>
                                f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                f.categoria.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map(f => (
                                <div key={f.id} className="entity-card supplier-card">
                                    <div className="entity-info">
                                        <h4>{f.nome}</h4>
                                        <span className="badge badge-warning">{f.categoria}</span>
                                        <p>📞 {f.contato}</p>
                                    </div>
                                    <div className="entity-actions">
                                        <button type="button" onClick={() => editFornec(f)} title="Editar">✏️</button>
                                        {user?.role === 'adm' && (
                                            <button type="button" className="btn-delete" onClick={(e) => { e.stopPropagation(); if (confirm('Excluir?')) deleteFornecedor(f.id) }} title="Excluir">🗑️</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL FUNCIONARIO */}
            {showFuncModal && (
                <div className="modal-overlay" onClick={resetFuncForm}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>{editingFunc ? 'Editar' : 'Novo'} Funcionário</h2>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>Gerencie as informações da sua equipe</p>
                            </div>
                            <button onClick={resetFuncForm} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleFuncSubmit}>
                                <div className="form-group">
                                    <label>Nome Completo *</label>
                                    <input required value={funcData.nome} onChange={e => setFuncData({ ...funcData, nome: e.target.value })} />
                                </div>
                                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label>Cargo / Função *</label>
                                        <input required value={funcData.cargo} onChange={e => setFuncData({ ...funcData, cargo: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Salário Base</label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#94a3b8' }}>R$</span>
                                            <MoneyInput
                                                value={funcData.salarioBase}
                                                onChange={(val) => setFuncData({ ...funcData, salarioBase: val.toString() })}
                                                style={{ paddingLeft: '2.5rem', color: '#10b981', fontWeight: 700 }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Telefone de Contato</label>
                                    <input value={funcData.telefone} onChange={e => setFuncData({ ...funcData, telefone: e.target.value })} />
                                </div>
                                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label>Data de Admissão</label>
                                        <input type="date" value={funcData.dataAdmissao} onChange={e => setFuncData({ ...funcData, dataAdmissao: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Data de Demissão</label>
                                        <input type="date" value={funcData.dataDemissao} onChange={e => setFuncData({ ...funcData, dataDemissao: e.target.value })} style={{ background: funcData.dataDemissao ? '#fef2f2' : undefined, borderColor: funcData.dataDemissao ? '#fecaca' : undefined }} />
                                        {funcData.dataDemissao && <small style={{ color: '#ef4444', display: 'block', marginTop: '0.5rem', fontWeight: 600 }}>⚠️ Inativar funcionário</small>}
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={resetFuncForm}>Cancelar</button>
                            <button type="button" className="btn-primary" onClick={handleFuncSubmit}>{editingFunc ? 'Salvar Alterações' : 'Cadastrar Funcionário'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CLIENTE */}
            {showClienteModal && (
                <div className="modal-overlay" onClick={resetClienteForm}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>{editingCliente ? 'Editar' : 'Novo'} Cliente</h2>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>Cadastre um novo cliente ou empresa parceira</p>
                            </div>
                            <button onClick={resetClienteForm} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleClienteSubmit}>
                                <div className="form-group">
                                    <label>Nome / Razão Social *</label>
                                    <input required value={clienteData.nome} onChange={e => setClienteData({ ...clienteData, nome: e.target.value })} />
                                </div>
                                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label>Tipo de Cliente *</label>
                                        <select value={clienteData.tipo} onChange={e => setClienteData({ ...clienteData, tipo: e.target.value } as any)}>
                                            <option value="empresa">Empresa</option>
                                            <option value="pessoa_fisica">Pessoa Física (PF)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Telefone</label>
                                        <input value={clienteData.telefone} onChange={e => setClienteData({ ...clienteData, telefone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Endereço Completo</label>
                                    <input value={clienteData.endereco} onChange={e => setClienteData({ ...clienteData, endereco: e.target.value })} placeholder="Rua, Número, Bairro, Cidade..." />
                                </div>
                            </form>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={resetClienteForm}>Cancelar</button>
                            <button type="button" className="btn-primary" onClick={handleClienteSubmit}>{editingCliente ? 'Salvar Alterações' : 'Cadastrar Cliente'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL FORNECEDOR */}
            {showFornecModal && (
                <div className="modal-overlay" onClick={resetFornecForm}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>{editingFornec ? 'Editar' : 'Novo'} Fornecedor</h2>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>Gerencie suas despesas recorrentes e fornecedores</p>
                            </div>
                            <button onClick={resetFornecForm} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleFornecSubmit}>
                                <div className="form-group">
                                    <label>Nome da Empresa / Fantasia *</label>
                                    <input required value={fornecData.nome} onChange={e => setFornecData({ ...fornecData, nome: e.target.value })} placeholder="Ex: Atacadão, Enel, Sabesp" />
                                </div>
                                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label>Categoria de Despesa *</label>
                                        <input required value={fornecData.categoria} onChange={e => setFornecData({ ...fornecData, categoria: e.target.value })} placeholder="Ex: Bebidas, Energia, Aluguel" />
                                    </div>
                                    <div className="form-group">
                                        <label>Contato / Referência</label>
                                        <input value={fornecData.contato} onChange={e => setFornecData({ ...fornecData, contato: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Observações Adicionais</label>
                                    <textarea rows={3} value={fornecData.observacoes} onChange={e => setFornecData({ ...fornecData, observacoes: e.target.value })} style={{ resize: 'vertical' }} />
                                </div>
                                {/* Move actions outside form if structure changed, but in CSS they are siblings. Wait, my CSS expects modal-content > modal-actions. 
                                    I should probably put form around everything or put matching structure. 
                                    In my CSS: modal-content is flex column. Content has header, body, actions.
                                    So I will close body here and put actions.
                                */}
                            </form>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={resetFornecForm}>Cancelar</button>
                            <button type="button" className="btn-primary" onClick={handleFornecSubmit}>{editingFornec ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
