'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    Convenio,
    Boleto,
    CaixaEntry,
    Saida,
    Vale,
    Marmita,
    PagamentoFuncionario,
    OutroServico,
    DashboardStats,
    Funcionario,
    Cliente,
    FechamentoCaixa,
    Fornecedor,
} from '@/types';

// ===========================
// CONTEXT TYPES
// ===========================

interface AppContextType {
    // Data
    convenios: Convenio[];
    boletos: Boleto[];
    caixaEntries: CaixaEntry[];
    saidas: Saida[];
    vales: Vale[];
    marmitas: Marmita[];
    folhaPagamento: PagamentoFuncionario[];
    outrosServicos: OutroServico[];
    funcionarios: Funcionario[];
    clientes: Cliente[];
    fechamentosCaixa: FechamentoCaixa[];
    fornecedores: Fornecedor[];

    // CRUD Operations - Convênios
    addConvenio: (convenio: Omit<Convenio, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateConvenio: (id: string, convenio: Partial<Convenio>) => void;
    deleteConvenio: (id: string) => void;

    // CRUD Operations - Boletos
    addBoleto: (boleto: Omit<Boleto, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateBoleto: (id: string, boleto: Partial<Boleto>) => void;
    deleteBoleto: (id: string) => void;

    // CRUD Operations - Caixa
    addCaixaEntry: (entry: Omit<CaixaEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateCaixaEntry: (id: string, entry: Partial<CaixaEntry>) => void;
    deleteCaixaEntry: (id: string) => void;

    // CRUD Operations - Saídas
    addSaida: (saida: Omit<Saida, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateSaida: (id: string, saida: Partial<Saida>) => void;
    deleteSaida: (id: string) => void;

    // CRUD Operations - Vales
    addVale: (vale: Omit<Vale, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateVale: (id: string, vale: Partial<Vale>) => void;
    deleteVale: (id: string) => void;

    // CRUD Operations - Marmitas
    addMarmita: (marmita: Omit<Marmita, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateMarmita: (id: string, marmita: Partial<Marmita>) => void;
    deleteMarmita: (id: string) => void;

    // CRUD Operations - Folha de Pagamento
    addPagamentoFuncionario: (pagamento: Omit<PagamentoFuncionario, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updatePagamentoFuncionario: (id: string, pagamento: Partial<PagamentoFuncionario>) => void;
    deletePagamentoFuncionario: (id: string) => void;

    // CRUD Operations - Outros Serviços
    addOutroServico: (servico: Omit<OutroServico, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateOutroServico: (id: string, servico: Partial<OutroServico>) => void;
    deleteOutroServico: (id: string) => void;

    // CRUD Operations - Funcionários
    addFuncionario: (funcionario: Omit<Funcionario, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateFuncionario: (id: string, funcionario: Partial<Funcionario>) => void;
    deleteFuncionario: (id: string) => void;

    // CRUD Operations - Clientes
    addCliente: (cliente: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateCliente: (id: string, cliente: Partial<Cliente>) => void;
    deleteCliente: (id: string) => void;

    // CRUD Operations - Fechamentos Caixa
    addFechamentoCaixa: (fechamento: Omit<FechamentoCaixa, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateFechamentoCaixa: (id: string, fechamento: Partial<FechamentoCaixa>) => void;
    deleteFechamentoCaixa: (id: string) => void;

    // CRUD Operations - Fornecedores
    addFornecedor: (fornecedor: Omit<Fornecedor, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateFornecedor: (id: string, fornecedor: Partial<Fornecedor>) => void;
    deleteFornecedor: (id: string) => void;

    // Analytics
    getDashboardStats: () => DashboardStats;

    // Theme
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

// ===========================
// CONTEXT CREATION
// ===========================

const AppContext = createContext<AppContextType | undefined>(undefined);

// ===========================
// PROVIDER COMPONENT
// ===========================

export function AppProvider({ children }: { children: ReactNode }) {
    // State
    const [convenios, setConvenios] = useState<Convenio[]>([]);
    const [boletos, setBoletos] = useState<Boleto[]>([]);
    const [caixaEntries, setCaixaEntries] = useState<CaixaEntry[]>([]);
    const [saidas, setSaidas] = useState<Saida[]>([]);
    const [vales, setVales] = useState<Vale[]>([]);
    const [marmitas, setMarmitas] = useState<Marmita[]>([]);
    const [folhaPagamento, setFolhaPagamento] = useState<PagamentoFuncionario[]>([]);
    const [outrosServicos, setOutrosServicos] = useState<OutroServico[]>([]);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [fechamentosCaixa, setFechamentosCaixa] = useState<FechamentoCaixa[]>([]);
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // Loading State
    const [isLoaded, setIsLoaded] = useState(false);

    // Load data from API (DB) on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await fetch('/api/database');
                if (!res.ok) throw new Error('Failed to fetch DB');
                const apiData = await res.json();

                // Helper para migrar se API vazio
                const getMigrated = (key: string, apiValue: any[]) => {
                    // Se a API tem dados, usa eles.
                    if (apiValue && apiValue.length > 0) return apiValue;

                    // Se não tem, tenta pegar do localStorage antigo para não perder nada.
                    if (typeof window !== 'undefined') {
                        const local = localStorage.getItem(key);
                        if (local) {
                            try {
                                const parsed = JSON.parse(local);
                                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                            } catch (e) { }
                        }
                    }
                    return apiValue || [];
                };

                setConvenios(getMigrated('convenios', apiData.convenios));
                setBoletos(getMigrated('boletos', apiData.boletos));
                setCaixaEntries(getMigrated('caixa', apiData.caixa));
                setSaidas(getMigrated('saidas', apiData.saidas));
                setVales(getMigrated('vales', apiData.vales));
                setMarmitas(getMigrated('marmitas', apiData.marmitas));
                setFolhaPagamento(getMigrated('folhaPagamento', apiData.folhaPagamento));
                setOutrosServicos(getMigrated('outrosServicos', apiData.outrosServicos));
                setFuncionarios(getMigrated('funcionarios', apiData.funcionarios));
                setClientes(getMigrated('clientes', apiData.clientes));
                setFechamentosCaixa(getMigrated('fechamentosCaixa', apiData.fechamentosCaixa));
                setFornecedores(getMigrated('fornecedores', apiData.fornecedores));

                // Theme Logic
                let themeToUse = apiData.theme || 'light';
                if (typeof window !== 'undefined') {
                    const localTheme = localStorage.getItem('theme');
                    if (localTheme && !apiData.theme) themeToUse = localTheme;
                }

                setTheme(themeToUse as 'light' | 'dark');
                document.documentElement.setAttribute('data-theme', themeToUse);

                setIsLoaded(true);
            } catch (error) {
                console.error('Error loading data from API:', error);
            }
        };

        loadData();
    }, []);

    // Sync Helper
    const sync = (payload: any) => {
        if (!isLoaded) return;
        fetch('/api/database', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.error('Sync failed', err));
    };

    // Save data whenever it changes (only if loaded)
    useEffect(() => { if (isLoaded) sync({ collection: 'convenios', data: convenios }); }, [convenios, isLoaded]);
    useEffect(() => { if (isLoaded) sync({ collection: 'boletos', data: boletos }); }, [boletos, isLoaded]);
    useEffect(() => { if (isLoaded) sync({ collection: 'caixa', data: caixaEntries }); }, [caixaEntries, isLoaded]);
    useEffect(() => { if (isLoaded) sync({ collection: 'saidas', data: saidas }); }, [saidas, isLoaded]);
    useEffect(() => { if (isLoaded) sync({ collection: 'vales', data: vales }); }, [vales, isLoaded]);
    useEffect(() => { if (isLoaded) sync({ collection: 'marmitas', data: marmitas }); }, [marmitas, isLoaded]);
    useEffect(() => { if (isLoaded) sync({ collection: 'folhaPagamento', data: folhaPagamento }); }, [folhaPagamento, isLoaded]);
    useEffect(() => { if (isLoaded) sync({ collection: 'outrosServicos', data: outrosServicos }); }, [outrosServicos, isLoaded]);
    useEffect(() => { if (isLoaded) sync({ collection: 'funcionarios', data: funcionarios }); }, [funcionarios, isLoaded]);
    useEffect(() => { if (isLoaded) sync({ collection: 'clientes', data: clientes }); }, [clientes, isLoaded]);
    useEffect(() => { if (isLoaded) sync({ collection: 'fechamentosCaixa', data: fechamentosCaixa }); }, [fechamentosCaixa, isLoaded]);
    useEffect(() => { if (isLoaded) sync({ collection: 'fornecedores', data: fornecedores }); }, [fornecedores, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            sync({ theme });
            document.documentElement.setAttribute('data-theme', theme);
        }
    }, [theme, isLoaded]);

    // Helper function to generate IDs
    const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // CRUD Operations - Convênios
    const addConvenio = (convenio: Omit<Convenio, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newConvenio: Convenio = { ...convenio, id: generateId(), createdAt: new Date(), updatedAt: new Date() };
        setConvenios(prev => [...prev, newConvenio]);
    };
    const updateConvenio = (id: string, updates: Partial<Convenio>) => {
        setConvenios(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c));
    };
    const deleteConvenio = (id: string) => { setConvenios(prev => prev.filter(c => c.id !== id)); };

    // CRUD Operations - Boletos
    const addBoleto = (boleto: Omit<Boleto, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newBoleto: Boleto = { ...boleto, id: generateId(), createdAt: new Date(), updatedAt: new Date() };
        setBoletos(prev => [...prev, newBoleto]);
    };
    const updateBoleto = (id: string, updates: Partial<Boleto>) => {
        setBoletos(prev => prev.map(b => b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b));
    };
    const deleteBoleto = (id: string) => { setBoletos(prev => prev.filter(b => b.id !== id)); };

    // CRUD Operations - Caixa
    const addCaixaEntry = (entry: Omit<CaixaEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newEntry: CaixaEntry = { ...entry, id: generateId(), createdAt: new Date(), updatedAt: new Date() };
        setCaixaEntries(prev => [...prev, newEntry]);
    };
    const updateCaixaEntry = (id: string, updates: Partial<CaixaEntry>) => {
        setCaixaEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e));
    };
    const deleteCaixaEntry = (id: string) => { setCaixaEntries(prev => prev.filter(e => e.id !== id)); };

    // CRUD Operations - Saídas
    const addSaida = (saida: Omit<Saida, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newSaida: Saida = { ...saida, id: generateId(), createdAt: new Date(), updatedAt: new Date() };
        setSaidas(prev => [...prev, newSaida]);
    };
    const updateSaida = (id: string, updates: Partial<Saida>) => {
        setSaidas(prev => prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s));
    };
    const deleteSaida = (id: string) => { setSaidas(prev => prev.filter(s => s.id !== id)); };

    // CRUD Operations - Vales
    const addVale = (vale: Omit<Vale, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newVale: Vale = { ...vale, id: generateId(), createdAt: new Date(), updatedAt: new Date() };
        setVales(prev => [...prev, newVale]);
    };
    const updateVale = (id: string, updates: Partial<Vale>) => {
        setVales(prev => prev.map(v => v.id === id ? { ...v, ...updates, updatedAt: new Date() } : v));
    };
    const deleteVale = (id: string) => { setVales(prev => prev.filter(v => v.id !== id)); };

    // CRUD Operations - Marmitas
    const addMarmita = (marmita: Omit<Marmita, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newMarmita: Marmita = { ...marmita, id: generateId(), createdAt: new Date(), updatedAt: new Date() };
        setMarmitas(prev => [...prev, newMarmita]);
    };
    const updateMarmita = (id: string, updates: Partial<Marmita>) => {
        setMarmitas(prev => prev.map(m => m.id === id ? { ...m, ...updates, updatedAt: new Date() } : m));
    };
    const deleteMarmita = (id: string) => { setMarmitas(prev => prev.filter(m => m.id !== id)); };

    // CRUD Operations - Folha de Pagamento
    const addPagamentoFuncionario = (pagamento: Omit<PagamentoFuncionario, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newPagamento: PagamentoFuncionario = { ...pagamento, id: generateId(), createdAt: new Date(), updatedAt: new Date() };
        setFolhaPagamento(prev => [...prev, newPagamento]);
    };
    const updatePagamentoFuncionario = (id: string, updates: Partial<PagamentoFuncionario>) => {
        setFolhaPagamento(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p));
    };
    const deletePagamentoFuncionario = (id: string) => { setFolhaPagamento(prev => prev.filter(p => p.id !== id)); };

    // CRUD Operations - Outros Serviços
    const addOutroServico = (servico: Omit<OutroServico, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newServico: OutroServico = { ...servico, id: generateId(), createdAt: new Date(), updatedAt: new Date() };
        setOutrosServicos(prev => [...prev, newServico]);
    };
    const updateOutroServico = (id: string, updates: Partial<OutroServico>) => {
        setOutrosServicos(prev => prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s));
    };
    const deleteOutroServico = (id: string) => { setOutrosServicos(prev => prev.filter(s => s.id !== id)); };

    // CRUD Operations - Funcionários
    const addFuncionario = (funcionario: Omit<Funcionario, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newFuncionario: Funcionario = { ...funcionario, id: generateId(), createdAt: new Date(), updatedAt: new Date() };
        setFuncionarios(prev => [...prev, newFuncionario]);
    };
    const updateFuncionario = (id: string, updates: Partial<Funcionario>) => {
        setFuncionarios(prev => prev.map(f => f.id === id ? { ...f, ...updates, updatedAt: new Date() } : f));
    }
    const deleteFuncionario = (id: string) => { setFuncionarios(prev => prev.filter(f => f.id !== id)); };

    // CRUD Operations - Clientes
    const addCliente = (cliente: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newCliente: Cliente = { ...cliente, id: generateId(), createdAt: new Date(), updatedAt: new Date() };
        setClientes(prev => [...prev, newCliente]);
    };
    const updateCliente = (id: string, updates: Partial<Cliente>) => {
        setClientes(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c));
    };
    const deleteCliente = (id: string) => { setClientes(prev => prev.filter(c => c.id !== id)); };

    // CRUD Operations - Fechamentos Caixa
    const addFechamentoCaixa = (fechamento: Omit<FechamentoCaixa, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newFechamento: FechamentoCaixa = { ...fechamento, id: generateId(), createdAt: new Date(), updatedAt: new Date() };
        setFechamentosCaixa(prev => [...prev, newFechamento]);
    };
    const updateFechamentoCaixa = (id: string, updates: Partial<FechamentoCaixa>) => {
        setFechamentosCaixa(prev => prev.map(f => f.id === id ? { ...f, ...updates, updatedAt: new Date() } : f));
    }
    const deleteFechamentoCaixa = (id: string) => { setFechamentosCaixa(prev => prev.filter(f => f.id !== id)); };

    // CRUD Operations - Fornecedores
    const addFornecedor = (fornecedor: Omit<Fornecedor, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newFornecedor: Fornecedor = { ...fornecedor, id: generateId(), createdAt: new Date(), updatedAt: new Date() };
        setFornecedores(prev => [...prev, newFornecedor]);
    };
    const updateFornecedor = (id: string, updates: Partial<Fornecedor>) => {
        setFornecedores(prev => prev.map(f => f.id === id ? { ...f, ...updates, updatedAt: new Date() } : f));
    }
    const deleteFornecedor = (id: string) => { setFornecedores(prev => prev.filter(f => f.id !== id)); };


    // Analytics
    const getDashboardStats = (): DashboardStats => {
        // 1. Receitas
        const entradasCaixaLegacy = caixaEntries.filter(e => e.tipo === 'entrada').reduce((sum, e) => sum + e.valor, 0);

        const entradasFechamento = fechamentosCaixa.reduce((sum, f) => {
            const total = (f.entradas.dinheiro || 0) +
                (f.entradas.pix || 0) +
                (f.entradas.credito || 0) +
                (f.entradas.debito || 0) +
                (f.entradas.alimentacao || 0);
            return sum + total;
        }, 0);

        const totalRecebido = entradasCaixaLegacy + entradasFechamento;

        // 2. Previsão de Recebimento
        const conveniosPendentes = convenios.filter(c => c.statusPagamento !== 'pago').reduce((sum, c) => sum + c.valorBoleto, 0);
        const boletosPendentes = boletos.filter(b => b.statusPagamento !== 'pago').reduce((sum, b) => sum + b.valor, 0);
        const marmitasPendentes = marmitas.filter(m => m.statusRecebimento !== 'pago').reduce((sum, m) => sum + m.valorTotal, 0);
        const servicosPendentes = outrosServicos.filter(s => s.statusPagamento !== 'pago').reduce((sum, s) => sum + s.valor, 0);

        const totalAReceber = conveniosPendentes + boletosPendentes + marmitasPendentes + servicosPendentes;

        // 3. Vencidos
        const hoje = new Date();
        const totalVencido = [
            ...convenios.filter(c => c.statusPagamento !== 'pago' && new Date(c.dataVencimento) < hoje),
            ...boletos.filter(b => b.statusPagamento !== 'pago' && new Date(b.dataVencimento) < hoje),
        ].reduce((sum, item) => sum + ('valorBoleto' in item ? item.valorBoleto : item.valor), 0);

        // 4. Saldo em Caixa (Apenas Dinheiro/Movimentação Imediata)
        const saidasCaixaLegacy = caixaEntries.filter(e => e.tipo === 'saida').reduce((sum, e) => sum + e.valor, 0);
        const saidasFechamento = fechamentosCaixa.reduce((sum, f) => sum + f.saidas, 0);

        const saldoCaixa = totalRecebido - (saidasCaixaLegacy + saidasFechamento);

        // 5. Total Despesas Globais
        const despesasModulo = saidas.reduce((sum, s) => sum + s.valor, 0);
        const totalFolha = folhaPagamento.reduce((sum, p) => sum + p.valor, 0);

        const totalDespesas = despesasModulo + saidasCaixaLegacy + saidasFechamento + totalFolha;

        const totalVales = vales.filter(v => v.status !== 'quitado').reduce((sum, v) => sum + (v.valor - (v.valorPago || 0)), 0);

        return { totalRecebido, totalAReceber, totalVencido, saldoCaixa, totalDespesas, totalVales, totalFolha };
    };

    // Theme
    const toggleTheme = () => { setTheme(prev => prev === 'light' ? 'dark' : 'light'); };

    const value: AppContextType = {
        convenios, boletos, caixaEntries, saidas, vales, marmitas, folhaPagamento, outrosServicos, funcionarios, clientes, fechamentosCaixa, fornecedores,
        addConvenio, updateConvenio, deleteConvenio,
        addBoleto, updateBoleto, deleteBoleto,
        addCaixaEntry, updateCaixaEntry, deleteCaixaEntry,
        addSaida, updateSaida, deleteSaida,
        addVale, updateVale, deleteVale,
        addMarmita, updateMarmita, deleteMarmita,
        addPagamentoFuncionario, updatePagamentoFuncionario, deletePagamentoFuncionario,
        addOutroServico, updateOutroServico, deleteOutroServico,
        addFuncionario, updateFuncionario, deleteFuncionario,
        addCliente, updateCliente, deleteCliente,
        addFechamentoCaixa, updateFechamentoCaixa, deleteFechamentoCaixa,
        addFornecedor, updateFornecedor, deleteFornecedor,
        getDashboardStats, theme, toggleTheme,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
