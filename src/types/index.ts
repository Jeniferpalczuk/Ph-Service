// ===========================
// TIPOS DO SISTEMA PH SERVICE
// ===========================

// Status de Pagamento
export type PaymentStatus = 'pago' | 'pendente' | 'vencido' | 'parcial';

// Formas de Pagamento
export type PaymentMethod =
  | 'dinheiro'
  | 'pix'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'transferencia'
  | 'boleto'
  | 'vale';

// Tipo de Fechamento (Convênios)
export type ClosingType = 'mensal' | 'quinzenal' | 'semanal' | 'personalizado';

// Categorias de Despesas
export type ExpenseCategory =
  | 'fornecedores'
  | 'funcionarios'
  | 'aluguel'
  | 'energia'
  | 'agua'
  | 'gas'
  | 'internet'
  | 'telefone'
  | 'impostos'
  | 'manutencao'
  | 'marketing'
  | 'outros';

// Status de Vale
export type ValeStatus = 'aberto' | 'quitado' | 'parcial';



// ===========================
// INTERFACES
// ===========================

// Anexo (usado em vários módulos)
export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'cupom_fiscal' | 'nota_fiscal' | 'boleto' | 'comprovante' | 'outro';
  uploadedAt: Date;
}

// CONVÊNIOS
export interface Convenio {
  id: string;
  empresaCliente: string;
  tipoFechamento: ClosingType;
  periodoReferencia: string; // Ex: "Janeiro/2024" ou "01-15/Jan/2024"
  dataFechamento: Date;
  valorBoleto: number;
  banco: string;
  dataVencimento: Date;
  dataPagamento?: Date;
  statusPagamento: PaymentStatus;
  notaFiscal?: string;
  enviadoPara?: string;
  observacoes?: string;
  anexos: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

// BOLETOS
export interface Boleto {
  id: string;
  cliente: string;
  valor: number;
  banco: string;
  dataVencimento: Date;
  dataPagamento?: Date;
  statusPagamento: PaymentStatus;
  observacoes?: string;
  convenioId?: string; // Referência ao convênio, se aplicável
  createdAt: Date;
  updatedAt: Date;
}

// CAIXA
export interface CaixaEntry {
  id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  formaPagamento: PaymentMethod;
  data: Date;
  categoria?: string;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// SAÍDAS/DESPESAS
export interface Saida {
  id: string;
  descricao: string;
  categoria: ExpenseCategory;
  valor: number;
  formaPagamento: PaymentMethod;
  data: Date;
  fornecedor?: string;
  observacoes?: string;
  anexos: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

// VALES (Funcionários)
export interface Vale {
  id: string;
  funcionario: string;
  valor: number;
  data: Date;
  motivo: string;
  status: ValeStatus;
  valorPago?: number;
  dataPagamento?: Date;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// MARMITAS
export interface Marmita {
  id: string;
  cliente: string;
  tamanho: string; // 'P' | 'M' | 'G' | 'PF'
  quantidade?: number; // Opcional se usar lançamento unitário
  valorUnitario?: number;
  valorTotal: number;
  dataEntrega: Date; // Renomeado de data
  formaPagamento: PaymentMethod;
  statusRecebimento: PaymentStatus;
  dataPagamento?: Date;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// PAGAMENTO FUNCIONÁRIOS
// ... types existing ...

export interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  telefone?: string;
  dataAdmissao?: Date;
  salarioBase?: number;
  ativo: boolean;
  dataDemissao?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cliente {
  id: string;
  nome: string;
  tipo: 'empresa' | 'pessoa_fisica';
  telefone?: string;
  endereco?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Fornecedor {
  id: string;
  nome: string;
  contato: string;
  categoria: string;
  ativo: boolean;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PagamentoFuncionario {
  // ...
  id: string;
  funcionario: string;
  cargoFuncao: string;
  valor: number; // Valor Líquido (pago)
  descontos?: number; // Valor dos Vales descontados
  formaPagamento: PaymentMethod;
  statusPagamento: PaymentStatus;
  dataPagamento: Date;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// OUTROS SERVIÇOS
export interface OutroServico {
  id: string;
  tipo: string; // Ex: "Banho", "Evento", etc.
  cliente: string;
  descricao: string;
  valor: number;
  formaPagamento: PaymentMethod;
  data: Date;
  statusPagamento: PaymentStatus;
  dataPagamento?: Date;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// FECHAMENTO DE CAIXA (TURNOS)
export interface FechamentoCaixa {
  id: string;
  data: Date;
  funcionario: string; // ID ou Nome
  turno: 'manha' | 'tarde';
  entradas: {
    dinheiro: number; // Valor em espécie
    pix: number;
    credito: number;
    debito: number;
    alimentacao: number; // Vale Alimentação/Refeição
  };
  saidas: number; // Total de saídas no turno
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================
// DASHBOARD / ANALYTICS
// ===========================

export interface DashboardStats {
  totalRecebido: number;
  totalAReceber: number;
  totalVencido: number;
  saldoCaixa: number;
  totalDespesas: number;
  totalVales: number;
  totalFolha: number;
}

export interface MonthlyComparison {
  mes: string;
  receitas: number;
  despesas: number;
  lucro: number;
}

export interface CategoryExpense {
  categoria: ExpenseCategory;
  valor: number;
  percentual: number;
}

// ===========================
// FILTROS E PESQUISA
// ===========================

export interface DateRange {
  inicio: Date;
  fim: Date;
}

export interface FilterOptions {
  dataRange?: DateRange;
  status?: PaymentStatus | ValeStatus;
  formaPagamento?: PaymentMethod;
  categoria?: ExpenseCategory;
  searchTerm?: string;
}
