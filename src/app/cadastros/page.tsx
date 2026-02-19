'use client';

import { useState } from 'react';
import { Funcionario, Cliente, Fornecedor } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { MoneyInput } from '@/components/MoneyInput';
import {
    useFuncionariosList,
    useCreateFuncionario,
    useUpdateFuncionario,
    useDeleteFuncionario,
    useClientesList,
    useCreateCliente,
    useUpdateCliente,
    useDeleteCliente,
    useFornecedoresList,
    useCreateFornecedor,
    useUpdateFornecedor,
    useDeleteFornecedor,
} from '@/hooks/cadastros';
import { Skeleton, TableSkeleton, SkeletonStyles } from '@/components/ui/Skeleton';
import { toast } from 'react-hot-toast';
import {
    LuChefHat,
    LuBuilding2,
    LuTruck,
    LuSearch,
    LuPlus,
    LuPencil,
    LuTrash2,
    LuX,
    LuArrowLeft,
    LuArrowRight,
    LuPhone
} from 'react-icons/lu';
import './cadastros.css';


/**
 * - O hook `useFuncionariosList` busca apenas os dados necessários.
 * - Mudanças em `page` ou `search` disparam nova query automaticamente.
 */

export default function CadastrosPage() {
    const { user } = useAuth();

    // Inibindo o Contexto Legado (mantendo apenas para o que sobrar se houver)
    // const { ... } = useApp();

    // ========================================
    // UI State
    // ========================================
    const [activeTab, setActiveTab] = useState<'funcionarios' | 'clientes' | 'fornecedores'>('funcionarios');
    const [searchTerm, setSearchTerm] = useState('');

    // Paginação para Funcionários
    const [funcPage, setFuncPage] = useState(1);
    const pageSize = 20;

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
    const [fornecData, setFornecData] = useState({ nome: '', servico: '', telefone: '', ativo: true, observacoes: '' });

    // ========================================
    // REACT QUERY - Funcionários
    // ========================================
    const {
        data: funcionariosData,
        isLoading: isLoadingFuncionarios,
        isError: isErrorFuncionarios,
        error: errorFuncionarios,
    } = useFuncionariosList({
        page: funcPage,
        pageSize,
        search: activeTab === 'funcionarios' ? searchTerm : '', // Só aplica search se estiver na aba
    });

    const createFuncionarioMutation = useCreateFuncionario();
    const updateFuncionarioMutation = useUpdateFuncionario();
    const deleteFuncionarioMutation = useDeleteFuncionario();

    const funcionarios = funcionariosData?.data ?? [];
    const totalPages = funcionariosData?.totalPages ?? 1;
    const totalFuncionarios = funcionariosData?.count ?? 0;

    // ========================================
    // REACT QUERY - Clientes
    // ========================================
    const [clientePage, setClientePage] = useState(1);
    const {
        data: clientesData,
        isLoading: isLoadingClientes,
        isError: isErrorClientes,
        error: errorClientes,
    } = useClientesList({
        page: clientePage,
        pageSize: 20,
        search: activeTab === 'clientes' ? searchTerm : '',
    });

    const createClienteMutation = useCreateCliente();
    const updateClienteMutation = useUpdateCliente();
    const deleteClienteMutation = useDeleteCliente();

    const clientes = clientesData?.data ?? [];
    const totalClientePages = clientesData?.totalPages ?? 1;
    const totalClientesCount = clientesData?.count ?? 0;

    // ========================================
    // REACT QUERY - Fornecedores
    // ========================================
    const [fornecPage, setFornecPage] = useState(1);
    const {
        data: fornecedoresData,
        isLoading: isLoadingFornecedores,
        isError: isErrorFornecedores, // Adicionado estado de erro explícito
        error: errorFornecedores,
    } = useFornecedoresList({
        page: fornecPage, // Usa paginação server-side
        pageSize: 20, // Paginação real
        search: activeTab === 'fornecedores' ? searchTerm : '',
    });

    const createFornecedorMutation = useCreateFornecedor();
    const updateFornecedorMutation = useUpdateFornecedor();
    const deleteFornecedorMutation = useDeleteFornecedor();

    const fornecedores = fornecedoresData?.data ?? [];
    const totalFornecPages = fornecedoresData?.totalPages ?? 1; // Para controle da paginação
    const totalFornecedoresCount = fornecedoresData?.count ?? 0;

    // ========================================
    // Handlers Funcionários (Usando Mutations)
    // ========================================
    const handleFuncSubmit = async (e: React.FormEvent) => {
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

        try {
            if (editingFunc) {
                await updateFuncionarioMutation.mutateAsync({ id: editingFunc.id, updates: payload });
                toast.success('Funcionário atualizado com sucesso!');
            } else {
                await createFuncionarioMutation.mutateAsync(payload as Omit<Funcionario, 'id' | 'createdAt' | 'updatedAt'>);
                toast.success('Funcionário cadastrado com sucesso!');
            }
            resetFuncForm();
        } catch (err) {
            console.error('Erro ao salvar funcionário:', err);
            toast.error(err instanceof Error ? err.message : 'Erro ao salvar funcionário.');
        }
    };


    const resetFuncForm = () => {
        setFuncData(prev => ({
            ...prev,
            nome: '', cargo: '', telefone: '', salarioBase: '', dataAdmissao: '', dataDemissao: '', ativo: true
        }));
        setEditingFunc(null);
        setShowFuncModal(false);
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

    const handleDeleteFunc = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm('Excluir este funcionário permanentemente?\nO histórico financeiro pode ser afetado.')) {
            try {
                await deleteFuncionarioMutation.mutateAsync(id);
                toast.success('Funcionário excluído com sucesso!');
            } catch (err) {
                console.error('Erro ao deletar:', err);
                toast.error('Erro ao excluir funcionário.');
            }
        }
    };

    // ========================================
    // Handlers Clientes (Usando Mutations)
    // ========================================
    const handleClienteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCliente) {
                await updateClienteMutation.mutateAsync({ id: editingCliente.id, updates: clienteData as any });
                toast.success('Cliente atualizado com sucesso!');
            } else {
                await createClienteMutation.mutateAsync(clienteData as any);
                toast.success('Cliente cadastrado com sucesso!');
            }
            resetClienteForm();
        } catch (err) {
            console.error('Erro ao salvar cliente:', err);
            toast.error(err instanceof Error ? err.message : 'Erro ao salvar cliente.');
        }
    };

    const handleDeleteCliente = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm('Excluir este cliente permanentemente?')) {
            try {
                await deleteClienteMutation.mutateAsync(id);
                toast.success('Cliente excluído com sucesso!');
            } catch (err) {
                console.error('Erro ao excluir cliente:', err);
                toast.error('Erro ao excluir cliente.');
            }
        }
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

    // ========================================
    // Handlers Fornecedores (Usando Mutations)
    // ========================================
    const handleFornecSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingFornec) {
                await updateFornecedorMutation.mutateAsync({ id: editingFornec.id, updates: fornecData as any });
                toast.success('Fornecedor atualizado com sucesso!');
            } else {
                await createFornecedorMutation.mutateAsync(fornecData as any);
                toast.success('Fornecedor cadastrado com sucesso!');
            }
            resetFornecForm();
        } catch (err) {
            console.error('Erro ao salvar fornecedor:', err);
            toast.error(err instanceof Error ? err.message : 'Erro ao salvar fornecedor.');
        }
    };

    const handleDeleteFornec = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm('Excluir este fornecedor permanentemente?')) {
            try {
                await deleteFornecedorMutation.mutateAsync(id);
                toast.success('Fornecedor excluído com sucesso!');
            } catch (err) {
                console.error('Erro ao excluir fornecedor:', err);
                toast.error('Erro ao excluir fornecedor.');
            }
        }
    };

    const resetFornecForm = () => {
        setFornecData({ nome: '', servico: '', telefone: '', ativo: true, observacoes: '' });
        setEditingFornec(null); setShowFornecModal(false);
    };
    const editFornec = (f: Fornecedor) => {
        setEditingFornec(f);
        setFornecData({
            nome: f.nome,
            servico: f.servico || '',
            telefone: f.telefone || '',
            ativo: f.ativo,
            observacoes: f.observacoes || ''
        });
        setShowFornecModal(true);
    };

    // ========================================
    // Render Helper: Skeleton Loader
    // ========================================
    const renderFuncionariosSkeleton = () => (
        <div className="grid-list">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="entity-card skeleton" style={{
                    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                    height: '100px',
                    borderRadius: '12px'
                }}>
                    <style jsx>{`
                        @keyframes shimmer {
                            0% { background-position: 200% 0; }
                            100% { background-position: -200% 0; }
                        }
                    `}</style>
                </div>
            ))}
        </div>
    );

    return (
        <div className="cadastros-page">
            <div className="page-header">
                <h2>Cadastros Gerais</h2>
            </div>

            <div className="tabs-container">
                <button className={`tab-btn ${activeTab === 'funcionarios' ? 'active' : ''}`} onClick={() => { setActiveTab('funcionarios'); setSearchTerm(''); setFuncPage(1); }}>
                    <LuChefHat size={18} /> Funcionários
                </button>
                <button className={`tab-btn ${activeTab === 'clientes' ? 'active' : ''}`} onClick={() => { setActiveTab('clientes'); setSearchTerm(''); setClientePage(1); }}>
                    <LuBuilding2 size={18} /> Clientes / Empresas
                </button>
                <button className={`tab-btn ${activeTab === 'fornecedores' ? 'active' : ''}`} onClick={() => { setActiveTab('fornecedores'); setSearchTerm(''); setFornecPage(1); }}>
                    <LuTruck size={18} /> Fornecedores
                </button>
            </div>

            {/* Barra de Pesquisa */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}><LuSearch size={18} /></span>
                    <input
                        type="text"
                        placeholder={`Buscar ${activeTab === 'funcionarios' ? 'funcionários' : activeTab === 'clientes' ? 'clientes' : 'fornecedores'}...`}
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value);
                            if (activeTab === 'funcionarios') setFuncPage(1);
                            if (activeTab === 'clientes') setClientePage(1);
                            if (activeTab === 'fornecedores') setFornecPage(1);
                        }}
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
                {/* FUNCIONARIOS TAB - COM REACT QUERY */}
                {activeTab === 'funcionarios' && (
                    <div className="entity-list">
                        <div className="list-header">
                            <h3>
                                Lista de Funcionários
                                {totalFuncionarios > 0 && (
                                    <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#64748b', marginLeft: '8px' }}>
                                        ({totalFuncionarios} total)
                                    </span>
                                )}
                            </h3>
                            <button className="btn btn-primary" onClick={() => setShowFuncModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><LuPlus size={18} /> Novo Funcionário</button>
                        </div>

                        {/* Error State */}
                        {isErrorFuncionarios && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626', background: '#fef2f2', borderRadius: '12px' }}>
                                <p>⚠️ Erro ao carregar funcionários</p>
                                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{(errorFuncionarios as Error)?.message}</p>
                            </div>
                        )}

                        {/* Loading State - Skeleton */}
                        {isLoadingFuncionarios && renderFuncionariosSkeleton()}

                        {/* Data List */}
                        {!isLoadingFuncionarios && !isErrorFuncionarios && (
                            <>
                                <div className="grid-list">
                                    {funcionarios.length === 0 ? (
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                            Nenhum funcionário encontrado.
                                        </div>
                                    ) : (
                                        funcionarios.map(f => {
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
                                                        <button type="button" onClick={() => editFunc(f)} style={{ cursor: 'pointer' }} title="Editar"><LuPencil size={18} /></button>
                                                        {user?.role === 'adm' && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleDeleteFunc(f.id, e)}
                                                                className="btn-delete"
                                                                style={{ cursor: 'pointer' }}
                                                                disabled={deleteFuncionarioMutation.isPending}
                                                                title="Excluir"
                                                            >
                                                                {deleteFuncionarioMutation.isPending ? '...' : <LuTrash2 size={18} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Paginação */}
                                {totalPages > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                        <button
                                            onClick={() => setFuncPage(p => Math.max(1, p - 1))}
                                            disabled={funcPage === 1}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                background: funcPage === 1 ? '#f8fafc' : 'white',
                                                cursor: funcPage === 1 ? 'not-allowed' : 'pointer',
                                                fontWeight: 600
                                            }}
                                        >
                                            <LuArrowLeft size={16} /> Anterior
                                        </button>
                                        <span style={{ fontWeight: 600, color: '#475569' }}>
                                            Página {funcPage} de {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setFuncPage(p => Math.min(totalPages, p + 1))}
                                            disabled={funcPage === totalPages}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                background: funcPage === totalPages ? '#f8fafc' : 'white',
                                                cursor: funcPage === totalPages ? 'not-allowed' : 'pointer',
                                                fontWeight: 600
                                            }}
                                        >
                                            Próxima <LuArrowRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* CLIENTES TAB - LEGADO */}
                {activeTab === 'clientes' && (
                    <div className="entity-list">
                        <div className="list-header">
                            <h3>
                                Lista de Clientes / Empresas Parceiras
                                {totalClientesCount > 0 && (
                                    <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#64748b', marginLeft: '8px' }}>
                                        ({totalClientesCount} total)
                                    </span>
                                )}
                            </h3>
                            <button className="btn btn-primary" onClick={() => setShowClienteModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><LuPlus size={18} /> Novo Cliente</button>
                        </div>

                        {isLoadingClientes && renderFuncionariosSkeleton()}

                        {isErrorClientes && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626', background: '#fef2f2', borderRadius: '12px' }}>
                                <p>⚠️ Erro ao carregar clientes</p>
                                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{(errorClientes as Error)?.message}</p>
                            </div>
                        )}

                        {!isLoadingClientes && !isErrorClientes && (
                            <>
                                <div className="grid-list">
                                    {clientes.length === 0 ? (
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                            Nenhum cliente encontrado.
                                        </div>
                                    ) : (
                                        clientes.map(c => (
                                            <div key={c.id} className="entity-card">
                                                <div className="entity-info">
                                                    <h4>{c.nome}</h4>
                                                    <span className="badge badge-neutral">{c.tipo === 'empresa' ? 'Empresa' : 'Pessoa Física'}</span>
                                                    <p>{c.telefone}</p>
                                                </div>
                                                <div className="entity-actions">
                                                    <button type="button" onClick={() => editCliente(c)} style={{ cursor: 'pointer' }} title="Editar"><LuPencil size={18} /></button>
                                                    {user?.role === 'adm' && (
                                                        <button type="button" onClick={(e) => handleDeleteCliente(c.id, e)} style={{ cursor: 'pointer' }} title="Excluir"><LuTrash2 size={18} /></button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Paginação */}
                                {totalClientePages > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                        <button
                                            onClick={() => setClientePage(p => Math.max(1, p - 1))}
                                            disabled={clientePage === 1}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                background: clientePage === 1 ? '#f8fafc' : 'white',
                                                cursor: clientePage === 1 ? 'not-allowed' : 'pointer',
                                                fontWeight: 600
                                            }}
                                        >
                                            <LuArrowLeft size={16} /> Anterior
                                        </button>
                                        <span style={{ fontWeight: 600, color: '#475569' }}>
                                            Página {clientePage} de {totalClientePages}
                                        </span>
                                        <button
                                            onClick={() => setClientePage(p => Math.min(totalClientePages, p + 1))}
                                            disabled={clientePage === totalClientePages}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                background: clientePage === totalClientePages ? '#f8fafc' : 'white',
                                                cursor: clientePage === totalClientePages ? 'not-allowed' : 'pointer',
                                                fontWeight: 600
                                            }}
                                        >
                                            Próxima <LuArrowRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* FORNECEDORES TAB - LEGADO */}
                {activeTab === 'fornecedores' && (
                    <div className="entity-list">
                        <div className="list-header">
                            <h3>Despesas Recorrentes & Fornecedores</h3>
                            <button className="btn btn-primary" onClick={() => setShowFornecModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><LuPlus size={18} /> Novo Fornecedor</button>
                        </div>
                        <div className="grid-list">
                            {fornecedores.map(f => (
                                <div key={f.id} className="entity-card supplier-card">
                                    <div className="entity-info">
                                        <h4>{f.nome}</h4>
                                        <span className="badge badge-warning">{f.servico}</span>
                                        <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LuPhone size={14} /> {f.telefone}</p>
                                    </div>
                                    <div className="entity-actions">
                                        <button type="button" onClick={() => editFornec(f)} title="Editar"><LuPencil size={18} /></button>
                                        {user?.role === 'adm' && (
                                            <button type="button" className="btn-delete" onClick={(e) => handleDeleteFornec(f.id, e)} title="Excluir"><LuTrash2 size={18} /></button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Paginação do Fornecedor */}
                        {totalFornecPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                <button
                                    onClick={() => setFornecPage(p => Math.max(1, p - 1))}
                                    disabled={fornecPage === 1}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        background: fornecPage === 1 ? '#f8fafc' : 'white',
                                        cursor: fornecPage === 1 ? 'not-allowed' : 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    <LuArrowLeft size={16} /> Anterior
                                </button>
                                <span style={{ fontWeight: 600, color: '#475569' }}>
                                    Página {fornecPage} de {totalFornecPages}
                                </span>
                                <button
                                    onClick={() => setFornecPage(p => Math.min(totalFornecPages, p + 1))}
                                    disabled={fornecPage === totalFornecPages}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        background: fornecPage === totalFornecPages ? '#f8fafc' : 'white',
                                        cursor: fornecPage === totalFornecPages ? 'not-allowed' : 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    Próxima <LuArrowRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL FUNCIONARIO (Standardized) */}
            {showFuncModal && (
                <div className="modal-overlay" onClick={resetFuncForm}>
                    <div className="modal-content card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>{editingFunc ? 'Editar' : 'Novo'} Funcionário</h2>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>Gerencie as informações da sua equipe</p>
                            </div>
                            <button className="modal-close" onClick={resetFuncForm}><LuX size={18} /></button>
                        </div>

                        <form onSubmit={handleFuncSubmit}>
                            <div className="modal-body">
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
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={resetFuncForm}>Cancelar</button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={createFuncionarioMutation.isPending || updateFuncionarioMutation.isPending}
                                >
                                    {(createFuncionarioMutation.isPending || updateFuncionarioMutation.isPending)
                                        ? 'Salvando...'
                                        : (editingFunc ? 'Salvar Alterações' : 'Cadastrar Funcionário')
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* MODAL CLIENTE (Standardized) */}
            {showClienteModal && (
                <div className="modal-overlay" onClick={resetClienteForm}>
                    <div className="modal-content card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>{editingCliente ? 'Editar' : 'Novo'} Cliente</h2>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>Cadastre um novo cliente ou empresa parceira</p>
                            </div>
                            <button className="modal-close" onClick={resetClienteForm}><LuX size={18} /></button>
                        </div>

                        <form onSubmit={handleClienteSubmit}>
                            <div className="modal-body">
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
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={resetClienteForm}>Cancelar</button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={createClienteMutation.isPending || updateClienteMutation.isPending}
                                >
                                    {(createClienteMutation.isPending || updateClienteMutation.isPending) ? 'Salvando...' : (editingCliente ? 'Salvar Alterações' : 'Cadastrar Cliente')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* MODAL FORNECEDOR (Standardized) */}
            {showFornecModal && (
                <div className="modal-overlay" onClick={resetFornecForm}>
                    <div className="modal-content card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>{editingFornec ? 'Editar' : 'Novo'} Fornecedor</h2>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>Gerencie suas despesas recorrentes e fornecedores</p>
                            </div>
                            <button className="modal-close" onClick={resetFornecForm}><LuX size={18} /></button>
                        </div>

                        <form onSubmit={handleFornecSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Nome da Empresa / Fantasia *</label>
                                    <input required value={fornecData.nome} onChange={e => setFornecData({ ...fornecData, nome: e.target.value })} placeholder="Ex: Atacadão, Enel, Sabesp" />
                                </div>
                                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label>Serviço / Categoria *</label>
                                        <input required value={fornecData.servico} onChange={e => setFornecData({ ...fornecData, servico: e.target.value })} placeholder="Ex: Bebidas, Energia, Aluguel" />
                                    </div>
                                    <div className="form-group">
                                        <label>Contato / Telefone</label>
                                        <input value={fornecData.telefone} onChange={e => setFornecData({ ...fornecData, telefone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Observações Adicionais</label>
                                    <textarea rows={3} value={fornecData.observacoes} onChange={e => setFornecData({ ...fornecData, observacoes: e.target.value })} style={{ resize: 'vertical' }} />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={resetFornecForm}>Cancelar</button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={createFornecedorMutation.isPending || updateFornecedorMutation.isPending}
                                >
                                    {(createFornecedorMutation.isPending || updateFornecedorMutation.isPending) ? 'Salvando...' : (editingFornec ? 'Salvar Alterações' : 'Cadastrar Fornecedor')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
