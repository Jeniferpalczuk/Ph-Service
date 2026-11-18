# 🍽️ PH Service - Sistema de Gestão de Restaurante

Sistema completo de gestão financeira e operacional para restaurantes, desenvolvido em Next.js com TypeScript.

## 📋 Funcionalidades

### ✅ Implementadas

#### 📊 Dashboard
- Visão geral com estatísticas financeiras
- Gráfico de receitas vs despesas (últimos 6 meses)
- Alertas de vencimentos próximos
- Ações rápidas para principais módulos

#### 🤝 Convênios
- Cadastro completo de convênios empresariais
- Controle de fechamentos (mensal, quinzenal, semanal, personalizado)
- Gestão de boletos e notas fiscais
- Acompanhamento de status de pagamento
- Filtros e busca avançada

#### 🧾 Boletos
- Registro individual de boletos
- Controle de vencimentos
- Gestão de pagamentos
- Vinculação com convênios

#### 💰 Caixa
- Lançamento de entradas e saídas
- Cálculo automático de saldo
- Múltiplas formas de pagamento
- Categorização de movimentações

#### 🍱 Marmitas
- Controle de pedidos
- Cálculo automático de valores
- Gestão de recebimentos
- Histórico de vendas

#### 🚚 Entregas
- Acompanhamento de status de entrega
- Controle duplo: entrega + pagamento
- Registro de endereço e contato
- Horários de entrega

### 🚧 Em Desenvolvimento

- **Saídas/Despesas**: Controle detalhado de despesas por categoria
- **Vales**: Gestão de vales de funcionários
- **Outros Serviços**: Registro de serviços adicionais

## 🎨 Design

- **Design System moderno** com variáveis CSS
- **Modo claro e escuro** alternável
- **Glassmorphism** e efeitos premium
- **Animações suaves** e micro-interações
- **Responsivo** para desktop e mobile
- **Acessibilidade** com foco em UX

## 🛠️ Tecnologias

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: CSS puro (sem frameworks)
- **Estado**: React Context API
- **Persistência**: LocalStorage
- **Bundler**: Turbopack

## 🚀 Como Usar

### Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Acessar em
http://localhost:3000
```

### Build para Produção

```bash
# Criar build otimizado
npm run build

# Executar em produção
npm start
```

## 📁 Estrutura do Projeto

```
ph-service/
├── src/
│   ├── app/                    # Páginas e rotas
│   │   ├── convenios/         # Módulo de convênios
│   │   ├── boletos/           # Módulo de boletos
│   │   ├── caixa/             # Módulo de caixa
│   │   ├── marmitas/          # Módulo de marmitas
│   │   ├── entregas/          # Módulo de entregas
│   │   ├── saidas/            # Módulo de saídas
│   │   ├── vales/             # Módulo de vales
│   │   ├── servicos/          # Módulo de serviços
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Dashboard
│   │   └── globals.css        # Design system
│   ├── components/            # Componentes reutilizáveis
│   │   ├── Sidebar.tsx        # Navegação lateral
│   │   ├── Header.tsx         # Cabeçalho
│   │   └── StatCard.tsx       # Cards de estatísticas
│   ├── context/               # Gerenciamento de estado
│   │   └── AppContext.tsx     # Context principal
│   └── types/                 # Tipos TypeScript
│       └── index.ts           # Definições de tipos
└── public/                    # Arquivos estáticos
```

## 💾 Armazenamento de Dados

Os dados são armazenados localmente no navegador usando **LocalStorage**. Isso significa:

- ✅ Funciona offline
- ✅ Não requer backend
- ✅ Dados persistem entre sessões
- ⚠️ Dados são específicos do navegador
- ⚠️ Não há sincronização entre dispositivos

### Backup Manual

Para fazer backup dos dados:
1. Abra o Console do navegador (F12)
2. Execute: `localStorage`
3. Copie os dados desejados

## 🎯 Próximos Passos

### Funcionalidades Planejadas

1. **Implementar módulos pendentes**
   - Saídas/Despesas completo
   - Vales de funcionários
   - Outros serviços

2. **Melhorias**
   - Sistema de anexos (upload de arquivos)
   - Exportação para Excel/PDF
   - Relatórios personalizados
   - Gráficos mais avançados
   - Filtros por período

3. **Backend (Opcional)**
   - API REST ou GraphQL
   - Banco de dados (PostgreSQL/MongoDB)
   - Autenticação de usuários
   - Sincronização multi-dispositivo

## 📱 Responsividade

O sistema é totalmente responsivo:
- **Desktop**: Layout completo com sidebar
- **Tablet**: Layout adaptado
- **Mobile**: Sidebar colapsável, tabelas scrolláveis

## 🎨 Personalização

### Cores

Edite as variáveis CSS em `src/app/globals.css`:

```css
:root {
  --primary-500: #0ea5e9;  /* Cor principal */
  --success-500: #22c55e;  /* Cor de sucesso */
  --warning-500: #f59e0b;  /* Cor de aviso */
  --danger-500: #ef4444;   /* Cor de perigo */
}
```

### Tema Escuro

O tema escuro é ativado automaticamente pelo botão na sidebar e persiste entre sessões.

## 🐛 Troubleshooting

### Dados não estão salvando
- Verifique se o LocalStorage está habilitado no navegador
- Limpe o cache se necessário

### Página não carrega
- Verifique se o servidor está rodando (`npm run dev`)
- Verifique a porta 3000 está disponível

### Erros de compilação
- Delete a pasta `.next` e `node_modules`
- Execute `npm install` novamente

## 📄 Licença

Este projeto foi desenvolvido para uso interno do restaurante PH Service.

## 👨‍💻 Desenvolvimento

Desenvolvido com ❤️ usando Next.js e TypeScript.

---

**Versão**: 1.8  
**Última atualização**: Dezembro 2025
