'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Cliente, Fornecedor } from '@/types';
import type { CreateClienteInput, UpdateClienteInput } from '@/lib/validations/clientes';
import type { CreateFornecedorInput, UpdateFornecedorInput } from '@/lib/validations/fornecedores';
import { isAdminUser } from '@/lib/admin';
import { APP_MODULES, type AppModuleKey } from '@/lib/modules';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import {
    useClientesList,
    useCreateCliente,
    useUpdateCliente,
    useDeleteCliente,
    useFornecedoresList,
    useCreateFornecedor,
    useUpdateFornecedor,
    useDeleteFornecedor,
} from '@/hooks/cadastros';
import { toast } from 'react-hot-toast';
import {
    LuBuilding2,
    LuTruck,
    LuSettings,
    LuHandshake,
    LuBarcode,
    LuCalculator,
    LuTrendingDown,
    LuDollarSign,
    LuUtensils,
    LuUsers,
    LuSearch,
    LuPlus,
    LuPencil,
    LuTrash2,
    LuX,
    LuArrowLeft,
    LuArrowRight,
    LuPhone,
    LuEye,
    LuEyeOff,
    LuRotateCcw,
    LuExternalLink,
    LuShieldCheck,
    LuPanelLeft
} from 'react-icons/lu';
import './cadastros.css';

type CadastrosTab = 'configuracoes' | 'clientes' | 'fornecedores';

const moduleIcons: Record<AppModuleKey, typeof LuHandshake> = {
    convenios: LuHandshake,
    boletos: LuBarcode,
    caixa: LuCalculator,
    saidas: LuTrendingDown,
    vales: LuDollarSign,
    marmitas: LuUtensils,
    pagamentos: LuUsers,
};


export default function CadastrosPage() {
    const { user } = useAuth();
    const {
        moduleVisibility,
        visibleModules,
        hiddenModuleCount,
        setModuleVisibility,
        resetModuleVisibility,
    } = useApp();
    const isAdmin = isAdminUser(user);
    const visibleModuleCount = visibleModules.length;

    // Inibindo o Contexto Legado (mantendo apenas para o que sobrar se houver)
    // const { ... } = useApp();

    // ========================================
    // UI State
    // ========================================
    const [activeTab, setActiveTab] = useState<CadastrosTab>('configuracoes');
    const [searchTerm, setSearchTerm] = useState('');

    // Estados dos Modais
    const [showClienteModal, setShowClienteModal] = useState(false);
    const [showFornecModal, setShowFornecModal] = useState(false);

    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
    const [editingFornec, setEditingFornec] = useState<Fornecedor | null>(null);

    // Formulários
    const [clienteData, setClienteData] = useState({ nome: '', tipo: 'empresa', telefone: '', endereco: '', ativo: true });
    const [fornecData, setFornecData] = useState({ nome: '', servico: '', telefone: '', ativo: true, observacoes: '' });

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

    // ========================================
    // Handlers Clientes (Usando Mutations)
    // ========================================
    const handleClienteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const cleanedCliente = {
                ...clienteData,
                telefone: clienteData.telefone?.trim() || null,
                endereco: clienteData.endereco?.trim() || null,
            };
            if (editingCliente) {
                await updateClienteMutation.mutateAsync({ id: editingCliente.id, updates: cleanedCliente as UpdateClienteInput });
                toast.success('Cliente atualizado com sucesso!');
            } else {
                await createClienteMutation.mutateAsync(cleanedCliente as CreateClienteInput);
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
                toast.error(err instanceof Error ? err.message : 'Erro ao excluir cliente.');
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
            const cleanedFornec = {
                nome: fornecData.nome,
                servico: fornecData.servico,
                telefone: fornecData.telefone?.trim() || null,
                ativo: fornecData.ativo,
            };
            if (editingFornec) {
                await updateFornecedorMutation.mutateAsync({ id: editingFornec.id, updates: cleanedFornec as UpdateFornecedorInput });
                toast.success('Fornecedor atualizado com sucesso!');
            } else {
                await createFornecedorMutation.mutateAsync(cleanedFornec as CreateFornecedorInput);
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
                toast.error(err instanceof Error ? err.message : 'Erro ao excluir fornecedor.');
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
    const renderCadastrosSkeleton = () => (
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
                <h2>Configurações</h2>
            </div>

            <div className="tabs-container">
                <button className={`tab-btn ${activeTab === 'configuracoes' ? 'active' : ''}`} onClick={() => { setActiveTab('configuracoes'); setSearchTerm(''); }}>
                    <LuSettings size={18} /> Sistema
                </button>
                <button className={`tab-btn ${activeTab === 'clientes' ? 'active' : ''}`} onClick={() => { setActiveTab('clientes'); setSearchTerm(''); setClientePage(1); }}>
                    <LuBuilding2 size={18} /> Clientes / Empresas
                </button>
                <button className={`tab-btn ${activeTab === 'fornecedores' ? 'active' : ''}`} onClick={() => { setActiveTab('fornecedores'); setSearchTerm(''); setFornecPage(1); }}>
                    <LuTruck size={18} /> Fornecedores
                </button>
            </div>

            {/* Barra de Pesquisa */}
            {activeTab !== 'configuracoes' && (
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}><LuSearch size={18} /></span>
                    <input
                        type="text"
                        placeholder={`Buscar ${activeTab === 'clientes' ? 'clientes' : 'fornecedores'}...`}
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value);
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
            )}

            <div className="tab-content card">
                {activeTab === 'configuracoes' && (
                    <div className="settings-panel">
                        {isAdmin ? (
                            <div className="settings-admin">
                                <div className="settings-admin-header">
                                    <div>
                                        <h3>Painel do Administrador</h3>
                                        <p className="settings-subtitle">Controle de módulos, cadastros e atalhos operacionais do sistema.</p>
                                    </div>
                                    <button type="button" className="settings-reset-btn" onClick={resetModuleVisibility}>
                                        <LuRotateCcw size={16} />
                                        Restaurar padrão
                                    </button>
                                </div>

                                <div className="settings-admin-layout">
                                    <aside className="settings-summary-panel">
                                        <div className="settings-summary-icon">
                                            <LuShieldCheck size={22} />
                                        </div>
                                        <div>
                                            <h4>Acesso liberado</h4>
                                            <p>Administrador</p>
                                        </div>
                                        <div className="settings-summary-list">
                                            <span><strong>{visibleModuleCount}</strong> visíveis no menu</span>
                                            <span><strong>{hiddenModuleCount}</strong> ocultos</span>
                                        </div>
                                    </aside>

                                    <div className="settings-module-table" aria-label="Visibilidade dos módulos">
                                        <div className="settings-module-table-head">
                                            <span>Módulo</span>
                                            <span>Menu lateral</span>
                                            <span>Acesso</span>
                                        </div>

                                        {APP_MODULES.map((module) => {
                                            const Icon = moduleIcons[module.key];
                                            const isVisible = moduleVisibility[module.key] !== false;

                                            return (
                                                <div key={module.key} className={`settings-module-row ${isVisible ? '' : 'is-hidden'}`}>
                                                    <div className="settings-module-main">
                                                        <span className="settings-module-icon"><Icon size={20} /></span>
                                                        <span className="settings-module-content">
                                                            <strong>{module.label}</strong>
                                                            <small>{module.description}</small>
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className={`settings-visibility-toggle ${isVisible ? 'is-on' : 'is-off'}`}
                                                        aria-pressed={isVisible}
                                                        onClick={() => setModuleVisibility(module.key, !isVisible)}
                                                    >
                                                        {isVisible ? <LuEye size={16} /> : <LuEyeOff size={16} />}
                                                        <span>{isVisible ? 'Visível' : 'Oculto'}</span>
                                                    </button>

                                                    <Link href={module.href} className="settings-open-link">
                                                        Abrir
                                                        <LuExternalLink size={15} />
                                                    </Link>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="settings-no-access">
                                <LuPanelLeft size={18} />
                                Seu usuário não está marcado como administrador.
                            </div>
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

                        {isLoadingClientes && renderCadastrosSkeleton()}

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
                                                    {isAdmin && (
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
                                        {isAdmin && (
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
                                        <select value={clienteData.tipo} onChange={e => setClienteData({ ...clienteData, tipo: e.target.value as Cliente['tipo'] })}>
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
