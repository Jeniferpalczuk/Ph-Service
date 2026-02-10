/**
 * Hooks Index
 * 
 * Ponto de entrada central para todos os React Query hooks do sistema.
 * 
 * Uso:
 * ```ts
 * import { useFuncionariosList, useBoletosList } from '@/hooks';
 * // ou por domínio:
 * import { useFuncionariosList } from '@/hooks/cadastros';
 * import { useBoletosList } from '@/hooks/financeiro';
 * ```
 */

// Domínio: Cadastros
export * from './cadastros';

// Domínio: Financeiro
export * from './financeiro';

// Domínio: RH
export * from './rh';
