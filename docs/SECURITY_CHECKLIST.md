# Checklist de Segurança - Supabase RLS

## O que é RLS (Row Level Security)?

RLS é um recurso do PostgreSQL que permite definir políticas de acesso a nível de linha. Cada tabela pode ter políticas que determinam quais linhas um usuário pode ver, inserir, atualizar ou deletar.

## Como Verificar RLS no Supabase

1. Acesse o painel do Supabase
2. Vá para **Database > Policies**
3. Verifique cada tabela listada

## Políticas Recomendadas por Tabela

### ✅ Tabela: `funcionarios`

```sql
-- Policy: Usuário só vê seus próprios registros
CREATE POLICY "Users can view own funcionarios"
ON funcionarios FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Usuário só insere com seu próprio user_id
CREATE POLICY "Users can insert own funcionarios"
ON funcionarios FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Usuário só atualiza seus próprios registros
CREATE POLICY "Users can update own funcionarios"
ON funcionarios FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Usuário só deleta seus próprios registros
CREATE POLICY "Users can delete own funcionarios"
ON funcionarios FOR DELETE
USING (auth.uid() = user_id);
```

### ✅ Tabela: `clientes`
(Mesma estrutura acima)

### ✅ Tabela: `fornecedores`
(Mesma estrutura acima)

### ✅ Tabela: `boletos`
(Mesma estrutura acima)

### ✅ Tabela: `convenios`
(Mesma estrutura acima)

### ✅ Tabela: `vales`
(Mesma estrutura acima)

### ✅ Tabela: `folha_pagamento`
(Mesma estrutura acima)

### ✅ Tabela: `saidas`
(Mesma estrutura acima)

### ✅ Tabela: `caixa_entries`
(Mesma estrutura acima)

### ✅ Tabela: `fechamento_caixa`
(Mesma estrutura acima)

### ✅ Tabela: `marmitas`
(Mesma estrutura acima)

### ✅ Tabela: `outros_servicos`
(Mesma estrutura acima)

## Verificação Manual

Execute no SQL Editor do Supabase:

```sql
-- Verificar se RLS está habilitado em todas as tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Listar todas as políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public';
```

## Garantia de Segurança Implementada

### ✅ Server Actions
- `user_id` é obtido do servidor via `supabase.auth.getUser()`
- Cliente NUNCA envia `user_id` diretamente
- Validação Zod antes de qualquer operação no DB

### ✅ Validação
- Todos os inputs são validados com Zod schemas
- Erros de validação retornam mensagens amigáveis
- Nenhum dado inválido chega ao banco

### ✅ Autenticação
- Todas as Server Actions verificam autenticação
- Usuários não autenticados recebem erro "Não autorizado"
- Sessions são gerenciadas pelo Supabase SSR

## Riscos Potenciais e Mitigações

| Risco | Status | Mitigação |
|-------|--------|-----------|
| Client-side user_id injection | ✅ Mitigado | Server Actions obtêm user_id do servidor |
| Dados inválidos no DB | ✅ Mitigado | Validação Zod em todas as actions |
| Acesso a dados de outros usuários | ⚠️ Verificar | Confirmar RLS policies no Supabase |
| SQL Injection | ✅ Mitigado | Supabase usa prepared statements |
| XSS | ✅ Mitigado | React escapa HTML por padrão |

## Action Items

- [ ] Verificar RLS habilitado em todas as tabelas
- [ ] Criar policies faltantes
- [ ] Testar acesso com diferentes usuários
- [ ] Documentar exceções (se houver tabelas sem user_id)
