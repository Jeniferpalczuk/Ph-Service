/**
 * Services Index
 * 
 * Ponto de entrada central para todos os services do sistema.
 * Organize imports por domínio para melhor clareza.
 * 
 * Uso:
 * ```ts
 * import { getFuncionarios, getBoletos } from '@/services';
 * // ou por domínio:
 * import { getFuncionarios } from '@/services/cadastros';
 * import { getBoletos } from '@/services/financeiro';
 * ```
 */

// Tipos compartilhados
export * from './types';

// Domínio: Cadastros (Funcionários, Clientes, Fornecedores)
export * from './cadastros';

// Domínio: Financeiro (Boletos, Convênios, Saídas)
export * from './financeiro';

// Domínio: RH (Vales, Folha de Pagamento)
export * from './rh';
