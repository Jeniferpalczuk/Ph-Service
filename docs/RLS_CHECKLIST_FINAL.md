# 🛡️ Guia de Implementação e Checklist: Supabase RLS

Este documento detalha os comandos SQL necessários para garantir que o banco de dados esteja protegido por **Row Level Security (RLS)**. Na Fase 3 do refactoring, a segurança é baseada na premissa de que o banco de dados é a última linha de defesa.

## 1. Habilitar RLS em todas as tabelas

Execute este script no **SQL Editor** do Supabase para garantir que nenhuma tabela esteja exposta.

```sql
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;
```

---

## 2. Scripts de Políticas (Template por Módulo)

Substitua `[NOME_DA_TABELA]` pelo nome real da tabela. O padrão para todas as tabelas do sistema deve ser:

### 📋 Módulo de Cadastros e RH
Tabelas: `funcionarios`, `clientes`, `fornecedores`, `vales`, `folha_pagamento`, `marmitas`, `outros_servicos`.

```sql
-- Habilitar acesso apenas ao dono dos dados (baseado no user_id)
CREATE POLICY "Acesso Total Individual" ON public.[NOME_DA_TABELA]
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

### 💰 Módulo Financeiro
Tabelas: `boletos`, `convenios`, `saidas`, `caixa_entries`, `fechamento_caixa`.

```sql
-- Segurança rigorosa para dados financeiros
CREATE POLICY "Financeiro Individual" ON public.[NOME_DA_TABELA]
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

---

## 3. Checklist de Auditoria (Fase 3)

### 🔒 Segurança de Gravação (Mutations)
- [ ] O `user_id` está sendo injetado via Server Action usando `auth.getUser()`?
- [ ] Existe validação Zod para todos os campos obrigatórios?
- [ ] Campos sensíveis (valores monetários) estão sendo validados contra valores negativos?

### 🔓 Segurança de Leitura (Queries)
- [ ] As queries usam filtros adicionais além do RLS (`.eq('user_id', user.id)`) para performance?
- [ ] Dados de outros usuários estão sendo vazados em logs?

### 🛠️ Configuração Supabase
- [ ] RLS está marcado como `Enabled` no dashboard para TODAS as tabelas utilizadas?
- [ ] A chave `service_role` NUNCA é usada no código client-side?

---

## 4. Query de Verificação de Status

Use esta query para ver quais tabelas **NÃO** têm RLS habilitado:

```sql
SELECT 
    relname as tabela,
    relrowsecurity as rls_habilitado
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
AND c.relkind = 'r'
AND relrowsecurity = false;
```

---

## 5. Próximos Passos Recomendados

1. **Testar com 2 Contas**: Crie dois usuários no sistema e tente acessar a URL do ID de um registro do Usuário A estando logado como Usuário B. Se o RLS estiver correto, o Supabase retornará vazio ou erro.
2. **Logs de Auditoria**: Considere habilitar o `Supabase Logs` para monitorar tentativas de acesso negadas por políticas de segurança.
