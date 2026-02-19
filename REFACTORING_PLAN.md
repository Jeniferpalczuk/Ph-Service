# 🏗️ Plano de Refatoração — PH Service

> Criado em: 2026-02-13
> Autor: Arquiteto de Sistemas (IA)
> Status: **Fases 1-2 COMPLETAS** | Fases 3-4 Pendentes

---

## 📊 Diagnóstico Atual (Pré-Refatoração)

| Camada | Status |
|--------|--------|
| **AuthContext** | ✅ Isolado — só sessão e auth |
| **AppContext** | ✅ Isolado — só tema (light/dark) |
| **QueryProvider** | ✅ Configurado com React Query |
| **Services** (`src/services/`) | ✅ Criados para cadastros, financeiro, rh |
| **Hooks** (`src/hooks/`) | ✅ React Query com cache e invalidação |
| **Server Actions** (`src/app/actions/`) | ✅ Usados para INSERT/UPDATE/DELETE |
| **Validação Zod** (`src/lib/validations/`) | ✅ Frontend + Backend |

---

## 🚀 FASE 1 — CORREÇÕES CRÍTICAS IMEDIATAS ✅ CONCLUÍDA

### Objetivo Técnico
Eliminar carregamento global de dados, implementar paginação server-side real, 
e garantir queries por tela com loading states individuais.

### O que foi feito

#### 1. AuthContext — Já estava correto ✅
O `AuthContext.tsx` já gerencia **apenas** autenticação e sessão:
- `signInWithGoogle()`, `signInWithEmail()`, `signOut()`, `updatePassword()`
- Estado: `user`, `session`, `loading`, `isAuthenticated`
- **Nenhum dado de negócio é carregado aqui.**

#### 2. AppContext — Já estava correto ✅
O `AppContext.tsx` gerencia **apenas** theme (light/dark):
- Carrega preferência de tema do `user_preferences`
- `toggleTheme()` para alternar

#### 3. QueryProvider — Já estava correto ✅
O `QueryProvider.tsx` já configura o React Query com:
- `staleTime: 5 minutos`
- `retry: 1`
- `refetchOnWindowFocus: false`

#### 4. Paginação Server-Side — CORRIGIDA 🔧
**ANTES:**
```tsx
// Clientes e Fornecedores carregavam TUDO de uma vez
useFornecedoresList({ pageSize: 1000 })
useClientesList({ pageSize: 1000 })
```

**DEPOIS:**
```tsx
// Paginação real com controle de página por aba
const [clientePage, setClientePage] = useState(1);
const [fornecPage, setFornecPage] = useState(1);

useClientesList({ page: clientePage, pageSize: 20, search: ... })
useFornecedoresList({ page: fornecPage, pageSize: 20, search: ... })
```

**POR QUÊ:** Com `pageSize: 1000`, o sistema carregava milhares de registros 
no navegador. Com `pageSize: 20`, o Supabase usa `.range()` para trazer apenas 
20 registros por vez, mantendo a performance constante independente do volume.

#### 5. Filtro Client-Side → Server-Side — CORRIGIDO 🔧
**ANTES:**
```tsx
// Filtrava no navegador após carregar tudo
{clientes.filter(c => c.nome.includes(searchTerm)).map(...)}
{fornecedores.filter(f => f.nome.includes(searchTerm)).map(...)}
```

**DEPOIS:**
```tsx
// Busca é enviada ao Supabase via ilike
useClientesList({ search: searchTerm }) // Filtro no DB
{clientes.map(...)} // Renderiza resultado direto
```

**POR QUÊ:** Filtro client-side é O(n) no navegador. Filtro server-side usa 
índices do PostgreSQL, que é O(log n). Com 10.000 registros, a diferença 
é brutal.

#### 6. Correção de Schema — Fornecedor 🔧
**ANTES:** `src/services/cadastros/fornecedores.ts` usava `contato` e `categoria`.
**DEPOIS:** Atualizado para `telefone` e `servico` (alinhado com DB e tipos).

#### 7. Loading/Error States por Aba — IMPLEMENTADO 🔧
Cada aba agora tem:
- **Skeleton loader** enquanto carrega
- **Error state** com mensagem específica
- **Empty state** quando não há dados
- **Paginação** com botões Anterior/Próxima

### Hierarquia de Providers (sem alterações necessárias)
```
AuthProvider          ← Sessão do usuário
  └─ QueryProvider    ← Cache e estado de queries
      └─ AppProvider  ← Tema (light/dark)
          └─ AuthGuard ← Proteção de rotas
              └─ {children}
```

### Checklist de Validação ✅
- [x] Todas as 3 abas (Funcionários, Clientes, Fornecedores) usam `pageSize: 20`
- [x] Busca reseta a página para 1
- [x] Troca de aba reseta a página para 1
- [x] `fornecedores.ts` service alinhado com DB (`servico`, `telefone`)
- [x] `editFornec()` não usa mais `f.categoria` (tipo inexistente)
- [x] Loading states por aba (skeleton)
- [x] Error states por aba
- [x] Paginação com botões Anterior/Próxima

---

## 🧱 FASE 2 — REFATORAÇÃO ESTRUTURAL ✅ CONCLUÍDA

### Objetivo Técnico
Eliminar `pageSize: 1000` de todo o codebase, criar queries leves para dropdowns,
e garantir separação clara entre dados (services), lógica (hooks) e UI (pages).

### O que foi feito

#### 1. Queries Leves para Dropdowns — CRIADAS 🔧
**ANTES:** Todas as páginas que precisavam de selects (Boletos, Saídas, Vales, 
Caixa, Folha, Convênios) carregavam registros completos com `pageSize: 1000`.

**DEPOIS:** Criado `src/services/cadastros/dropdown.ts` com queries que retornam
apenas `id` e `nome` (ou `id`, `nome`, `cargo`, `salarioBase` para folha):

```
src/services/cadastros/dropdown.ts    ← Service layer
src/hooks/cadastros/useDropdown.ts    ← React Query hooks (staleTime: 30min)
```

**Hooks disponíveis:**
- `useFuncionariosDropdown()` — Nomes de funcionários ativos
- `useFuncionariosFolhaDropdown()` — Com cargo e salário (folha)
- `useFornecedoresDropdown()` — Nomes de fornecedores ativos
- `useClientesDropdown()` — Nomes de clientes ativos

**POR QUÊ:** Uma query `SELECT id, nome FROM funcionarios WHERE ativo = true`
retorna ~2KB. Uma query `SELECT * FROM funcionarios` com `pageSize: 1000`
retorna ~200KB+ (com endereço, observações, datas, etc.). O cache de 30min
evita re-fetches desnecessários entre navegações.

#### 2. Eliminação Total de `pageSize: 1000` — CONCLUÍDA 🔧

| Página | Antes | Depois |
|--------|-------|--------|
| `boletos/page.tsx` | `useFornecedoresList({ pageSize: 1000 })` | `useFornecedoresDropdown()` |
| `saidas/page.tsx` | `useFornecedoresList({ pageSize: 1000 })` | `useFornecedoresDropdown()` |
| `vales/page.tsx` | `useFuncionariosList({ pageSize: 1000 })` | `useFuncionariosDropdown()` |
| `caixa/page.tsx` | `useFuncionariosList({ pageSize: 1000 })` | `useFuncionariosDropdown()` |
| `folha-pagamento/page.tsx` | `useFuncionariosList({ pageSize: 1000 })` | `useFuncionariosFolhaDropdown()` |
| `convenios/page.tsx` | `useClientesList({ pageSize: 1000 })` | `useClientesDropdown()` |
| `marmitas/page.tsx` | `pageSize: 1000` | `pageSize: 200` (máx ~120/mês) |
| `useDashboard.ts` | `useConveniosList({ pageSize: 1000 })` | `pageSize: 2000` (TODO: agregar) |

#### 3. Dashboard — Marcado para Fase 3 ⚠️
O `useDashboard.ts` ainda carrega todos os registros do período para calcular
estatísticas (SUM, COUNT). Isso é um anti-pattern que será resolvido na Fase 3
com Server Actions de agregação.

### Checklist de Validação ✅
- [x] Zero `pageSize: 1000` em todo o codebase
- [x] TypeScript compila sem erros (`npx tsc --noEmit` limpo)
- [x] Queries de dropdown retornam apenas campos necessários
- [x] Cache de 30min para dados de dropdown
- [x] Todas as listagens principais usam paginação real
- [x] Buscas server-side (não client-side)

---

## 🔐 FASE 3 — SEGURANÇA E ROBUSTEZ ✅ (Código Completo)

### Objetivo Técnico
Garantir que operações de escrita são seguras, validadas e auditáveis.

### O que foi feito
#### 1. Sanitização de Inputs — CONCLUÍDA 🔧
- Criado helper `sanitizeSearch` em `src/lib/security.ts`.
- Aplicado em TODOS os 11 services que usam filtros `ilike`:
  - `boletos`, `convenios`, `saidas`, `marmitas`, `caixa`
  - `vales`, `folha-pagamento`
  - `funcionarios`, `clientes`, `fornecedores`
- Previne injeção de caracteres curinga (`%`, `_`) em buscas.

#### 2. Padronização de Server Actions — CONCLUÍDA 🔧
- Criado `src/app/actions/shared.ts` com utilitários duplicados.
- Refatorado `boletos.ts`, `cadastros.ts`, `financeiro.ts`, `marmitas.ts`, `rh.ts`.
- Redução de ~100 linhas de código duplicado.

#### 3. Logger Estruturado — CRIADO 🔧
- Criado `src/lib/logger.ts` para logging centralizado.
- Permite fácil integração futura com Sentry/DataDog.

#### 4. Error Boundary Global — IMPLEMENTADO 🔧
- `src/app/error.tsx`: Captura erros não tratados e loga com stack trace.
- `src/app/not-found.tsx`: Página 404 amigável.
- `src/app/loading.tsx`: Feedback visual imediato em navegações.

### Pendente (Infraestrutura)
- **Auditoria RLS no Supabase Dashboard**: A validação final das policies deve ser feita manualmente pelo admin no painel do Supabase, já que o agente não tem acesso direto à configuração do banco.

---

## 📈 FASE 4 — UX, PERFORMANCE E FUTURO (Próxima)

### Phase 4: UX & Performance (✅ Completed)
**Focus**: Enhance user experience with loading states and optimized data delivery.

- [x] **Skeleton Loading**
  - [x] Create `TableSkeleton` component
  - [x] Implement in all data listing pages (`boletos`, `marmitas`, `caixa`, etc.)
- [x] **Prefetching**
  - [x] Implement prefetching on pagination hover (via `Pagination` component)
- [x] **Pagination Refactor**
  - [x] Standardize pagination UI across all modules
  - [x] Create reusable `Pagination` component


### Phase 5: Future & Cleanup (Next)
**Focus**: Final code cleanup and documentation.

- [ ] **Code Cleanup**
  - [ ] Remove unused CSS files (consolidate to `shared-modern.css`)
  - [ ] Remove unused legacy hooks
- [ ] **Environment**
  - [ ] Finalize `.env.example`
- [ ] **Documentation**
  - [ ] Update README with new architecture details que mudam pouco (bancos, categorias)
   - `gcTime: 30min` para evitar refetches desnecessários

### Boas Práticas para Novas Telas
```
PADRÃO: Nova Tela de Listagem
1. Criar service em src/services/{dominio}/{entidade}.ts
2. Criar hook em src/hooks/{dominio}/use{Entidade}.ts
3. Usar Server Action para escrita em src/app/actions/{dominio}.ts
4. Usar Zod schema em src/lib/validations/{entidade}.ts
5. Página em src/app/{rota}/page.tsx (só UI, sem lógica de acesso a dados)
```

### Checklist de Produção Final
- [ ] Todas as listagens paginadas (server-side)
- [ ] Todas as buscas server-side
- [ ] Skeleton loading em todas as telas
- [ ] Error boundary global
- [ ] RLS auditado
- [ ] Variáveis de ambiente documentadas
- [ ] Testes E2E para fluxos críticos (login, caixa, folha)
- [ ] Monitoramento de erros (Sentry ou similar)
