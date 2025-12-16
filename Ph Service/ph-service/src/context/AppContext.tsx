'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';
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

    // Loading state
    isLoading: boolean;
}

// ===========================
// CONTEXT CREATION
// ===========================

const AppContext = createContext<AppContextType | undefined>(undefined);

// ===========================
// HELPER: Convert DB row to TypeScript type (snake_case -> camelCase)
// ===========================

function dbToConvenio(row: any): Convenio {
    return {
        id: row.id,
        empresaCliente: row.empresa_cliente,
        tipoFechamento: row.tipo_fechamento,
        periodoReferencia: row.periodo_referencia,
        dataFechamento: new Date(row.data_fechamento),
        valorBoleto: parseFloat(row.valor_boleto),
        banco: row.banco,
        dataVencimento: new Date(row.data_vencimento),
        dataPagamento: row.data_pagamento ? new Date(row.data_pagamento) : undefined,
        statusPagamento: row.status_pagamento,
        notaFiscal: row.nota_fiscal,
        enviadoPara: row.enviado_para,
        observacoes: row.observacoes,
        anexos: row.anexos || [],
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

function dbToBoleto(row: any): Boleto {
    return {
        id: row.id,
        cliente: row.cliente,
        valor: parseFloat(row.valor),
        banco: row.banco,
        dataVencimento: new Date(row.data_vencimento),
        dataPagamento: row.data_pagamento ? new Date(row.data_pagamento) : undefined,
        statusPagamento: row.status_pagamento,
        observacoes: row.observacoes,
        convenioId: row.convenio_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

function dbToCaixaEntry(row: any): CaixaEntry {
    return {
        id: row.id,
        tipo: row.tipo,
        descricao: row.descricao,
        valor: parseFloat(row.valor),
        formaPagamento: row.forma_pagamento,
        data: new Date(row.data),
        categoria: row.categoria,
        observacoes: row.observacoes,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

function dbToSaida(row: any): Saida {
    return {
        id: row.id,
        descricao: row.descricao,
        categoria: row.categoria,
        valor: parseFloat(row.valor),
        formaPagamento: row.forma_pagamento,
        data: new Date(row.data),
        fornecedor: row.fornecedor,
        observacoes: row.observacoes,
        anexos: row.anexos || [],
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

function dbToVale(row: any): Vale {
    return {
        id: row.id,
        funcionario: row.funcionario,
        valor: parseFloat(row.valor),
        data: new Date(row.data),
        motivo: row.motivo,
        status: row.status,
        valorPago: row.valor_pago ? parseFloat(row.valor_pago) : undefined,
        dataPagamento: row.data_pagamento ? new Date(row.data_pagamento) : undefined,
        observacoes: row.observacoes,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

function dbToMarmita(row: any): Marmita {
    return {
        id: row.id,
        cliente: row.cliente,
        tamanho: row.tamanho,
        quantidade: row.quantidade,
        valorUnitario: row.valor_unitario ? parseFloat(row.valor_unitario) : undefined,
        valorTotal: parseFloat(row.valor_total),
        dataEntrega: new Date(row.data_entrega),
        formaPagamento: row.forma_pagamento,
        statusRecebimento: row.status_recebimento,
        dataPagamento: row.data_pagamento ? new Date(row.data_pagamento) : undefined,
        observacoes: row.observacoes,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

function dbToPagamentoFuncionario(row: any): PagamentoFuncionario {
    return {
        id: row.id,
        funcionario: row.funcionario,
        cargoFuncao: row.cargo_funcao,
        valor: parseFloat(row.valor),
        descontos: row.descontos ? parseFloat(row.descontos) : undefined,
        formaPagamento: row.forma_pagamento,
        statusPagamento: row.status_pagamento,
        dataPagamento: new Date(row.data_pagamento),
        observacoes: row.observacoes,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

function dbToOutroServico(row: any): OutroServico {
    return {
        id: row.id,
        tipo: row.tipo,
        cliente: row.cliente,
        descricao: row.descricao,
        valor: parseFloat(row.valor),
        formaPagamento: row.forma_pagamento,
        data: new Date(row.data),
        statusPagamento: row.status_pagamento,
        dataPagamento: row.data_pagamento ? new Date(row.data_pagamento) : undefined,
        observacoes: row.observacoes,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

function dbToFuncionario(row: any): Funcionario {
    return {
        id: row.id,
        nome: row.nome,
        cargo: row.cargo,
        telefone: row.telefone,
        dataAdmissao: row.data_admissao ? new Date(row.data_admissao) : undefined,
        salarioBase: row.salario_base ? parseFloat(row.salario_base) : undefined,
        ativo: row.ativo,
        dataDemissao: row.data_demissao ? new Date(row.data_demissao) : undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

function dbToCliente(row: any): Cliente {
    return {
        id: row.id,
        nome: row.nome,
        tipo: row.tipo,
        telefone: row.telefone,
        endereco: row.endereco,
        ativo: row.ativo,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

function dbToFechamentoCaixa(row: any): FechamentoCaixa {
    return {
        id: row.id,
        data: new Date(row.data),
        funcionario: row.funcionario,
        turno: row.turno,
        entradas: {
            dinheiro: parseFloat(row.entradas_dinheiro) || 0,
            pix: parseFloat(row.entradas_pix) || 0,
            credito: parseFloat(row.entradas_credito) || 0,
            debito: parseFloat(row.entradas_debito) || 0,
            alimentacao: parseFloat(row.entradas_alimentacao) || 0,
        },
        saidas: parseFloat(row.saidas) || 0,
        observacoes: row.observacoes,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

function dbToFornecedor(row: any): Fornecedor {
    return {
        id: row.id,
        nome: row.nome,
        contato: row.contato,
        categoria: row.categoria,
        ativo: row.ativo,
        observacoes: row.observacoes,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

// Helper to format date for Supabase
function formatDate(date: Date | undefined): string | null {
    if (!date) return null;
    return date instanceof Date ? date.toISOString().split('T')[0] : date;
}

// ===========================
// PROVIDER COMPONENT
// ===========================

export function AppProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const supabase = createClient();

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
    const [isLoading, setIsLoading] = useState(true);

    // ===========================
    // LOAD DATA FROM SUPABASE
    // ===========================

    const loadAllData = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            // Load all tables in parallel
            const [
                convRes, bolRes, caixaRes, saidaRes, valeRes, marmitaRes,
                folhaRes, servicoRes, funcRes, clienteRes, fechRes, fornRes, prefRes
            ] = await Promise.all([
                supabase.from('convenios').select('*'),
                supabase.from('boletos').select('*'),
                supabase.from('caixa').select('*'),
                supabase.from('saidas').select('*'),
                supabase.from('vales').select('*'),
                supabase.from('marmitas').select('*'),
                supabase.from('folha_pagamento').select('*'),
                supabase.from('outros_servicos').select('*'),
                supabase.from('funcionarios').select('*'),
                supabase.from('clientes').select('*'),
                supabase.from('fechamentos_caixa').select('*'),
                supabase.from('fornecedores').select('*'),
                supabase.from('user_preferences').select('*').eq('id', user.id).single(),
            ]);

            setConvenios((convRes.data || []).map(dbToConvenio));
            setBoletos((bolRes.data || []).map(dbToBoleto));
            setCaixaEntries((caixaRes.data || []).map(dbToCaixaEntry));
            setSaidas((saidaRes.data || []).map(dbToSaida));
            setVales((valeRes.data || []).map(dbToVale));
            setMarmitas((marmitaRes.data || []).map(dbToMarmita));
            setFolhaPagamento((folhaRes.data || []).map(dbToPagamentoFuncionario));
            setOutrosServicos((servicoRes.data || []).map(dbToOutroServico));
            setFuncionarios((funcRes.data || []).map(dbToFuncionario));
            setClientes((clienteRes.data || []).map(dbToCliente));
            setFechamentosCaixa((fechRes.data || []).map(dbToFechamentoCaixa));
            setFornecedores((fornRes.data || []).map(dbToFornecedor));

            // Load theme preference
            if (prefRes.data?.theme) {
                setTheme(prefRes.data.theme as 'light' | 'dark');
                document.documentElement.setAttribute('data-theme', prefRes.data.theme);
            }

        } catch (error) {
            console.error('Error loading data from Supabase:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, supabase]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    // ===========================
    // CRUD OPERATIONS - CONVÊNIOS
    // ===========================

    const addConvenio = async (convenio: Omit<Convenio, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('convenios').insert({
            user_id: user.id,
            empresa_cliente: convenio.empresaCliente,
            tipo_fechamento: convenio.tipoFechamento,
            periodo_referencia: convenio.periodoReferencia,
            data_fechamento: formatDate(convenio.dataFechamento),
            valor_boleto: convenio.valorBoleto,
            banco: convenio.banco,
            data_vencimento: formatDate(convenio.dataVencimento),
            data_pagamento: formatDate(convenio.dataPagamento),
            status_pagamento: convenio.statusPagamento,
            nota_fiscal: convenio.notaFiscal,
            enviado_para: convenio.enviadoPara,
            observacoes: convenio.observacoes,
            anexos: convenio.anexos,
        }).select().single();

        if (!error && data) {
            setConvenios(prev => [...prev, dbToConvenio(data)]);
        }
    };

    const updateConvenio = async (id: string, updates: Partial<Convenio>) => {
        const updateData: any = {};
        if (updates.empresaCliente !== undefined) updateData.empresa_cliente = updates.empresaCliente;
        if (updates.tipoFechamento !== undefined) updateData.tipo_fechamento = updates.tipoFechamento;
        if (updates.periodoReferencia !== undefined) updateData.periodo_referencia = updates.periodoReferencia;
        if (updates.dataFechamento !== undefined) updateData.data_fechamento = formatDate(updates.dataFechamento);
        if (updates.valorBoleto !== undefined) updateData.valor_boleto = updates.valorBoleto;
        if (updates.banco !== undefined) updateData.banco = updates.banco;
        if (updates.dataVencimento !== undefined) updateData.data_vencimento = formatDate(updates.dataVencimento);
        if (updates.dataPagamento !== undefined) updateData.data_pagamento = formatDate(updates.dataPagamento);
        if (updates.statusPagamento !== undefined) updateData.status_pagamento = updates.statusPagamento;
        if (updates.notaFiscal !== undefined) updateData.nota_fiscal = updates.notaFiscal;
        if (updates.enviadoPara !== undefined) updateData.enviado_para = updates.enviadoPara;
        if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;
        if (updates.anexos !== undefined) updateData.anexos = updates.anexos;
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase.from('convenios').update(updateData).eq('id', id).select().single();
        if (!error && data) {
            setConvenios(prev => prev.map(c => c.id === id ? dbToConvenio(data) : c));
        }
    };

    const deleteConvenio = async (id: string) => {
        const { error } = await supabase.from('convenios').delete().eq('id', id);
        if (!error) {
            setConvenios(prev => prev.filter(c => c.id !== id));
        }
    };

    // ===========================
    // CRUD OPERATIONS - BOLETOS
    // ===========================

    const addBoleto = async (boleto: Omit<Boleto, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('boletos').insert({
            user_id: user.id,
            cliente: boleto.cliente,
            valor: boleto.valor,
            banco: boleto.banco,
            data_vencimento: formatDate(boleto.dataVencimento),
            data_pagamento: formatDate(boleto.dataPagamento),
            status_pagamento: boleto.statusPagamento,
            observacoes: boleto.observacoes,
            convenio_id: boleto.convenioId,
        }).select().single();

        if (!error && data) {
            setBoletos(prev => [...prev, dbToBoleto(data)]);
        }
    };

    const updateBoleto = async (id: string, updates: Partial<Boleto>) => {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (updates.cliente !== undefined) updateData.cliente = updates.cliente;
        if (updates.valor !== undefined) updateData.valor = updates.valor;
        if (updates.banco !== undefined) updateData.banco = updates.banco;
        if (updates.dataVencimento !== undefined) updateData.data_vencimento = formatDate(updates.dataVencimento);
        if (updates.dataPagamento !== undefined) updateData.data_pagamento = formatDate(updates.dataPagamento);
        if (updates.statusPagamento !== undefined) updateData.status_pagamento = updates.statusPagamento;
        if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;

        const { data, error } = await supabase.from('boletos').update(updateData).eq('id', id).select().single();
        if (!error && data) {
            setBoletos(prev => prev.map(b => b.id === id ? dbToBoleto(data) : b));
        }
    };

    const deleteBoleto = async (id: string) => {
        const { error } = await supabase.from('boletos').delete().eq('id', id);
        if (!error) {
            setBoletos(prev => prev.filter(b => b.id !== id));
        }
    };

    // ===========================
    // CRUD OPERATIONS - CAIXA
    // ===========================

    const addCaixaEntry = async (entry: Omit<CaixaEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('caixa').insert({
            user_id: user.id,
            tipo: entry.tipo,
            descricao: entry.descricao,
            valor: entry.valor,
            forma_pagamento: entry.formaPagamento,
            data: formatDate(entry.data),
            categoria: entry.categoria,
            observacoes: entry.observacoes,
        }).select().single();

        if (!error && data) {
            setCaixaEntries(prev => [...prev, dbToCaixaEntry(data)]);
        }
    };

    const updateCaixaEntry = async (id: string, updates: Partial<CaixaEntry>) => {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (updates.tipo !== undefined) updateData.tipo = updates.tipo;
        if (updates.descricao !== undefined) updateData.descricao = updates.descricao;
        if (updates.valor !== undefined) updateData.valor = updates.valor;
        if (updates.formaPagamento !== undefined) updateData.forma_pagamento = updates.formaPagamento;
        if (updates.data !== undefined) updateData.data = formatDate(updates.data);
        if (updates.categoria !== undefined) updateData.categoria = updates.categoria;
        if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;

        const { data, error } = await supabase.from('caixa').update(updateData).eq('id', id).select().single();
        if (!error && data) {
            setCaixaEntries(prev => prev.map(e => e.id === id ? dbToCaixaEntry(data) : e));
        }
    };

    const deleteCaixaEntry = async (id: string) => {
        const { error } = await supabase.from('caixa').delete().eq('id', id);
        if (!error) {
            setCaixaEntries(prev => prev.filter(e => e.id !== id));
        }
    };

    // ===========================
    // CRUD OPERATIONS - SAÍDAS
    // ===========================

    const addSaida = async (saida: Omit<Saida, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('saidas').insert({
            user_id: user.id,
            descricao: saida.descricao,
            categoria: saida.categoria,
            valor: saida.valor,
            forma_pagamento: saida.formaPagamento,
            data: formatDate(saida.data),
            fornecedor: saida.fornecedor,
            observacoes: saida.observacoes,
            anexos: saida.anexos,
        }).select().single();

        if (!error && data) {
            setSaidas(prev => [...prev, dbToSaida(data)]);
        }
    };

    const updateSaida = async (id: string, updates: Partial<Saida>) => {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (updates.descricao !== undefined) updateData.descricao = updates.descricao;
        if (updates.categoria !== undefined) updateData.categoria = updates.categoria;
        if (updates.valor !== undefined) updateData.valor = updates.valor;
        if (updates.formaPagamento !== undefined) updateData.forma_pagamento = updates.formaPagamento;
        if (updates.data !== undefined) updateData.data = formatDate(updates.data);
        if (updates.fornecedor !== undefined) updateData.fornecedor = updates.fornecedor;
        if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;
        if (updates.anexos !== undefined) updateData.anexos = updates.anexos;

        const { data, error } = await supabase.from('saidas').update(updateData).eq('id', id).select().single();
        if (!error && data) {
            setSaidas(prev => prev.map(s => s.id === id ? dbToSaida(data) : s));
        }
    };

    const deleteSaida = async (id: string) => {
        const { error } = await supabase.from('saidas').delete().eq('id', id);
        if (!error) {
            setSaidas(prev => prev.filter(s => s.id !== id));
        }
    };

    // ===========================
    // CRUD OPERATIONS - VALES
    // ===========================

    const addVale = async (vale: Omit<Vale, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('vales').insert({
            user_id: user.id,
            funcionario: vale.funcionario,
            valor: vale.valor,
            data: formatDate(vale.data),
            motivo: vale.motivo,
            status: vale.status,
            valor_pago: vale.valorPago,
            data_pagamento: formatDate(vale.dataPagamento),
            observacoes: vale.observacoes,
        }).select().single();

        if (!error && data) {
            setVales(prev => [...prev, dbToVale(data)]);
        }
    };

    const updateVale = async (id: string, updates: Partial<Vale>) => {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (updates.funcionario !== undefined) updateData.funcionario = updates.funcionario;
        if (updates.valor !== undefined) updateData.valor = updates.valor;
        if (updates.data !== undefined) updateData.data = formatDate(updates.data);
        if (updates.motivo !== undefined) updateData.motivo = updates.motivo;
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.valorPago !== undefined) updateData.valor_pago = updates.valorPago;
        if (updates.dataPagamento !== undefined) updateData.data_pagamento = formatDate(updates.dataPagamento);
        if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;

        const { data, error } = await supabase.from('vales').update(updateData).eq('id', id).select().single();
        if (!error && data) {
            setVales(prev => prev.map(v => v.id === id ? dbToVale(data) : v));
        }
    };

    const deleteVale = async (id: string) => {
        const { error } = await supabase.from('vales').delete().eq('id', id);
        if (!error) {
            setVales(prev => prev.filter(v => v.id !== id));
        }
    };

    // ===========================
    // CRUD OPERATIONS - MARMITAS
    // ===========================

    const addMarmita = async (marmita: Omit<Marmita, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('marmitas').insert({
            user_id: user.id,
            cliente: marmita.cliente,
            tamanho: marmita.tamanho,
            quantidade: marmita.quantidade,
            valor_unitario: marmita.valorUnitario,
            valor_total: marmita.valorTotal,
            data_entrega: formatDate(marmita.dataEntrega),
            forma_pagamento: marmita.formaPagamento,
            status_recebimento: marmita.statusRecebimento,
            data_pagamento: formatDate(marmita.dataPagamento),
            observacoes: marmita.observacoes,
        }).select().single();

        if (!error && data) {
            setMarmitas(prev => [...prev, dbToMarmita(data)]);
        }
    };

    const updateMarmita = async (id: string, updates: Partial<Marmita>) => {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (updates.cliente !== undefined) updateData.cliente = updates.cliente;
        if (updates.tamanho !== undefined) updateData.tamanho = updates.tamanho;
        if (updates.quantidade !== undefined) updateData.quantidade = updates.quantidade;
        if (updates.valorUnitario !== undefined) updateData.valor_unitario = updates.valorUnitario;
        if (updates.valorTotal !== undefined) updateData.valor_total = updates.valorTotal;
        if (updates.dataEntrega !== undefined) updateData.data_entrega = formatDate(updates.dataEntrega);
        if (updates.formaPagamento !== undefined) updateData.forma_pagamento = updates.formaPagamento;
        if (updates.statusRecebimento !== undefined) updateData.status_recebimento = updates.statusRecebimento;
        if (updates.dataPagamento !== undefined) updateData.data_pagamento = formatDate(updates.dataPagamento);
        if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;

        const { data, error } = await supabase.from('marmitas').update(updateData).eq('id', id).select().single();
        if (!error && data) {
            setMarmitas(prev => prev.map(m => m.id === id ? dbToMarmita(data) : m));
        }
    };

    const deleteMarmita = async (id: string) => {
        const { error } = await supabase.from('marmitas').delete().eq('id', id);
        if (!error) {
            setMarmitas(prev => prev.filter(m => m.id !== id));
        }
    };

    // ===========================
    // CRUD OPERATIONS - FOLHA PAGAMENTO
    // ===========================

    const addPagamentoFuncionario = async (pagamento: Omit<PagamentoFuncionario, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('folha_pagamento').insert({
            user_id: user.id,
            funcionario: pagamento.funcionario,
            cargo_funcao: pagamento.cargoFuncao,
            valor: pagamento.valor,
            descontos: pagamento.descontos,
            forma_pagamento: pagamento.formaPagamento,
            status_pagamento: pagamento.statusPagamento,
            data_pagamento: formatDate(pagamento.dataPagamento),
            observacoes: pagamento.observacoes,
        }).select().single();

        if (!error && data) {
            setFolhaPagamento(prev => [...prev, dbToPagamentoFuncionario(data)]);
        }
    };

    const updatePagamentoFuncionario = async (id: string, updates: Partial<PagamentoFuncionario>) => {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (updates.funcionario !== undefined) updateData.funcionario = updates.funcionario;
        if (updates.cargoFuncao !== undefined) updateData.cargo_funcao = updates.cargoFuncao;
        if (updates.valor !== undefined) updateData.valor = updates.valor;
        if (updates.descontos !== undefined) updateData.descontos = updates.descontos;
        if (updates.formaPagamento !== undefined) updateData.forma_pagamento = updates.formaPagamento;
        if (updates.statusPagamento !== undefined) updateData.status_pagamento = updates.statusPagamento;
        if (updates.dataPagamento !== undefined) updateData.data_pagamento = formatDate(updates.dataPagamento);
        if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;

        const { data, error } = await supabase.from('folha_pagamento').update(updateData).eq('id', id).select().single();
        if (!error && data) {
            setFolhaPagamento(prev => prev.map(p => p.id === id ? dbToPagamentoFuncionario(data) : p));
        }
    };

    const deletePagamentoFuncionario = async (id: string) => {
        const { error } = await supabase.from('folha_pagamento').delete().eq('id', id);
        if (!error) {
            setFolhaPagamento(prev => prev.filter(p => p.id !== id));
        }
    };

    // ===========================
    // CRUD OPERATIONS - OUTROS SERVIÇOS
    // ===========================

    const addOutroServico = async (servico: Omit<OutroServico, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('outros_servicos').insert({
            user_id: user.id,
            tipo: servico.tipo,
            cliente: servico.cliente,
            descricao: servico.descricao,
            valor: servico.valor,
            forma_pagamento: servico.formaPagamento,
            data: formatDate(servico.data),
            status_pagamento: servico.statusPagamento,
            data_pagamento: formatDate(servico.dataPagamento),
            observacoes: servico.observacoes,
        }).select().single();

        if (!error && data) {
            setOutrosServicos(prev => [...prev, dbToOutroServico(data)]);
        }
    };

    const updateOutroServico = async (id: string, updates: Partial<OutroServico>) => {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (updates.tipo !== undefined) updateData.tipo = updates.tipo;
        if (updates.cliente !== undefined) updateData.cliente = updates.cliente;
        if (updates.descricao !== undefined) updateData.descricao = updates.descricao;
        if (updates.valor !== undefined) updateData.valor = updates.valor;
        if (updates.formaPagamento !== undefined) updateData.forma_pagamento = updates.formaPagamento;
        if (updates.data !== undefined) updateData.data = formatDate(updates.data);
        if (updates.statusPagamento !== undefined) updateData.status_pagamento = updates.statusPagamento;
        if (updates.dataPagamento !== undefined) updateData.data_pagamento = formatDate(updates.dataPagamento);
        if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;

        const { data, error } = await supabase.from('outros_servicos').update(updateData).eq('id', id).select().single();
        if (!error && data) {
            setOutrosServicos(prev => prev.map(s => s.id === id ? dbToOutroServico(data) : s));
        }
    };

    const deleteOutroServico = async (id: string) => {
        const { error } = await supabase.from('outros_servicos').delete().eq('id', id);
        if (!error) {
            setOutrosServicos(prev => prev.filter(s => s.id !== id));
        }
    };

    // ===========================
    // CRUD OPERATIONS - FUNCIONÁRIOS
    // ===========================

    const addFuncionario = async (funcionario: Omit<Funcionario, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('funcionarios').insert({
            user_id: user.id,
            nome: funcionario.nome,
            cargo: funcionario.cargo,
            telefone: funcionario.telefone,
            data_admissao: formatDate(funcionario.dataAdmissao),
            salario_base: funcionario.salarioBase,
            ativo: funcionario.ativo,
            data_demissao: formatDate(funcionario.dataDemissao),
        }).select().single();

        if (!error && data) {
            setFuncionarios(prev => [...prev, dbToFuncionario(data)]);
        }
    };

    const updateFuncionario = async (id: string, updates: Partial<Funcionario>) => {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (updates.nome !== undefined) updateData.nome = updates.nome;
        if (updates.cargo !== undefined) updateData.cargo = updates.cargo;
        if (updates.telefone !== undefined) updateData.telefone = updates.telefone;
        if (updates.dataAdmissao !== undefined) updateData.data_admissao = formatDate(updates.dataAdmissao);
        if (updates.salarioBase !== undefined) updateData.salario_base = updates.salarioBase;
        if (updates.ativo !== undefined) updateData.ativo = updates.ativo;
        if (updates.dataDemissao !== undefined) updateData.data_demissao = formatDate(updates.dataDemissao);

        const { data, error } = await supabase.from('funcionarios').update(updateData).eq('id', id).select().single();
        if (!error && data) {
            setFuncionarios(prev => prev.map(f => f.id === id ? dbToFuncionario(data) : f));
        }
    };

    const deleteFuncionario = async (id: string) => {
        const { error } = await supabase.from('funcionarios').delete().eq('id', id);
        if (!error) {
            setFuncionarios(prev => prev.filter(f => f.id !== id));
        }
    };

    // ===========================
    // CRUD OPERATIONS - CLIENTES
    // ===========================

    const addCliente = async (cliente: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('clientes').insert({
            user_id: user.id,
            nome: cliente.nome,
            tipo: cliente.tipo,
            telefone: cliente.telefone,
            endereco: cliente.endereco,
            ativo: cliente.ativo,
        }).select().single();

        if (!error && data) {
            setClientes(prev => [...prev, dbToCliente(data)]);
        }
    };

    const updateCliente = async (id: string, updates: Partial<Cliente>) => {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (updates.nome !== undefined) updateData.nome = updates.nome;
        if (updates.tipo !== undefined) updateData.tipo = updates.tipo;
        if (updates.telefone !== undefined) updateData.telefone = updates.telefone;
        if (updates.endereco !== undefined) updateData.endereco = updates.endereco;
        if (updates.ativo !== undefined) updateData.ativo = updates.ativo;

        const { data, error } = await supabase.from('clientes').update(updateData).eq('id', id).select().single();
        if (!error && data) {
            setClientes(prev => prev.map(c => c.id === id ? dbToCliente(data) : c));
        }
    };

    const deleteCliente = async (id: string) => {
        const { error } = await supabase.from('clientes').delete().eq('id', id);
        if (!error) {
            setClientes(prev => prev.filter(c => c.id !== id));
        }
    };

    // ===========================
    // CRUD OPERATIONS - FECHAMENTOS CAIXA
    // ===========================

    const addFechamentoCaixa = async (fechamento: Omit<FechamentoCaixa, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('fechamentos_caixa').insert({
            user_id: user.id,
            data: formatDate(fechamento.data),
            funcionario: fechamento.funcionario,
            turno: fechamento.turno,
            entradas_dinheiro: fechamento.entradas.dinheiro,
            entradas_pix: fechamento.entradas.pix,
            entradas_credito: fechamento.entradas.credito,
            entradas_debito: fechamento.entradas.debito,
            entradas_alimentacao: fechamento.entradas.alimentacao,
            saidas: fechamento.saidas,
            observacoes: fechamento.observacoes,
        }).select().single();

        if (!error && data) {
            setFechamentosCaixa(prev => [...prev, dbToFechamentoCaixa(data)]);
        }
    };

    const updateFechamentoCaixa = async (id: string, updates: Partial<FechamentoCaixa>) => {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (updates.data !== undefined) updateData.data = formatDate(updates.data);
        if (updates.funcionario !== undefined) updateData.funcionario = updates.funcionario;
        if (updates.turno !== undefined) updateData.turno = updates.turno;
        if (updates.entradas?.dinheiro !== undefined) updateData.entradas_dinheiro = updates.entradas.dinheiro;
        if (updates.entradas?.pix !== undefined) updateData.entradas_pix = updates.entradas.pix;
        if (updates.entradas?.credito !== undefined) updateData.entradas_credito = updates.entradas.credito;
        if (updates.entradas?.debito !== undefined) updateData.entradas_debito = updates.entradas.debito;
        if (updates.entradas?.alimentacao !== undefined) updateData.entradas_alimentacao = updates.entradas.alimentacao;
        if (updates.saidas !== undefined) updateData.saidas = updates.saidas;
        if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;

        const { data, error } = await supabase.from('fechamentos_caixa').update(updateData).eq('id', id).select().single();
        if (!error && data) {
            setFechamentosCaixa(prev => prev.map(f => f.id === id ? dbToFechamentoCaixa(data) : f));
        }
    };

    const deleteFechamentoCaixa = async (id: string) => {
        const { error } = await supabase.from('fechamentos_caixa').delete().eq('id', id);
        if (!error) {
            setFechamentosCaixa(prev => prev.filter(f => f.id !== id));
        }
    };

    // ===========================
    // CRUD OPERATIONS - FORNECEDORES
    // ===========================

    const addFornecedor = async (fornecedor: Omit<Fornecedor, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('fornecedores').insert({
            user_id: user.id,
            nome: fornecedor.nome,
            contato: fornecedor.contato,
            categoria: fornecedor.categoria,
            ativo: fornecedor.ativo,
            observacoes: fornecedor.observacoes,
        }).select().single();

        if (!error && data) {
            setFornecedores(prev => [...prev, dbToFornecedor(data)]);
        }
    };

    const updateFornecedor = async (id: string, updates: Partial<Fornecedor>) => {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (updates.nome !== undefined) updateData.nome = updates.nome;
        if (updates.contato !== undefined) updateData.contato = updates.contato;
        if (updates.categoria !== undefined) updateData.categoria = updates.categoria;
        if (updates.ativo !== undefined) updateData.ativo = updates.ativo;
        if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;

        const { data, error } = await supabase.from('fornecedores').update(updateData).eq('id', id).select().single();
        if (!error && data) {
            setFornecedores(prev => prev.map(f => f.id === id ? dbToFornecedor(data) : f));
        }
    };

    const deleteFornecedor = async (id: string) => {
        const { error } = await supabase.from('fornecedores').delete().eq('id', id);
        if (!error) {
            setFornecedores(prev => prev.filter(f => f.id !== id));
        }
    };

    // ===========================
    // ANALYTICS
    // ===========================

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

        // 4. Saldo em Caixa
        const saidasCaixaLegacy = caixaEntries.filter(e => e.tipo === 'saida').reduce((sum, e) => sum + e.valor, 0);
        const saidasFechamento = fechamentosCaixa.reduce((sum, f) => sum + f.saidas, 0);

        const saldoCaixa = totalRecebido - (saidasCaixaLegacy + saidasFechamento);

        // 5. Total Despesas
        const despesasModulo = saidas.reduce((sum, s) => sum + s.valor, 0);
        const totalFolha = folhaPagamento.reduce((sum, p) => sum + p.valor, 0);

        const totalDespesas = despesasModulo + saidasCaixaLegacy + saidasFechamento + totalFolha;

        const totalVales = vales.filter(v => v.status !== 'quitado').reduce((sum, v) => sum + (v.valor - (v.valorPago || 0)), 0);

        return { totalRecebido, totalAReceber, totalVencido, saldoCaixa, totalDespesas, totalVales, totalFolha };
    };

    // ===========================
    // THEME
    // ===========================

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);

        if (user) {
            await supabase.from('user_preferences').upsert({
                id: user.id,
                theme: newTheme,
                updated_at: new Date().toISOString(),
            });
        }
    };

    // ===========================
    // CONTEXT VALUE
    // ===========================

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
        isLoading,
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
