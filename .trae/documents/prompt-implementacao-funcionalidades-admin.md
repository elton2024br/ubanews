# Prompt Detalhado: Implementação das Funcionalidades Faltantes do Painel Administrativo UbaNews

## 1. OBJETIVO PRINCIPAL DA ATIVIDADE

Implementar as três funcionalidades faltantes no painel administrativo do UbaNews para completar o sistema de gestão:
- **Gerenciamento de Usuários** (`/admin/users`)
- **Logs de Auditoria** (`/admin/audit`) 
- **Configurações do Sistema** (`/admin/settings`)

O objetivo é criar páginas funcionais, seguras e integradas ao sistema existente, mantendo a consistência visual e arquitetural do projeto.

## 2. ETAPAS SEQUENCIAIS COM INSTRUÇÕES PRECISAS

### FASE 1: PREPARAÇÃO E ANÁLISE

#### Etapa 1.1: Análise da Arquitetura Existente
- Revisar a estrutura atual do painel administrativo em `src/admin/`
- Analisar os componentes existentes em `src/admin/pages/`
- Estudar o sistema de permissões em `src/admin/context/AdminProvider.tsx`
- Verificar as rotas configuradas em `src/App.tsx`

#### Etapa 1.2: Verificação do Banco de Dados
- Confirmar a existência das tabelas necessárias no Supabase:
  - `admin_users` (para gerenciamento de usuários)
  - `audit_logs` (para logs de auditoria)
  - `system_settings` (para configurações - criar se não existir)
- Verificar as políticas RLS (Row Level Security) existentes
- Analisar as funções SQL disponíveis para relatórios

### FASE 2: IMPLEMENTAÇÃO DA PÁGINA DE USUÁRIOS

#### Etapa 2.1: Criar Estrutura Base
- Criar arquivo `src/admin/pages/Users.tsx`
- Implementar interface `UserManagement` com:
  - Listagem de usuários com paginação
  - Filtros por role, status e data de criação
  - Busca por nome/email
  - Ações: criar, editar, ativar/desativar, resetar senha

#### Etapa 2.2: Implementar Funcionalidades Core
- **Listagem de Usuários:**
  ```typescript
  interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'editor' | 'columnist';
    is_active: boolean;
    last_login?: string;
    created_at: string;
    two_factor_enabled: boolean;
  }
  ```
- **Modal de Criação/Edição:**
  - Formulário com validação
  - Seleção de role com permissões
  - Configuração de 2FA
  - Geração de senha temporária

#### Etapa 2.3: Integração com Supabase
- Implementar funções CRUD para usuários
- Configurar políticas RLS adequadas
- Integrar com `auth.users` do Supabase
- Implementar logs de auditoria para ações de usuário

### FASE 3: IMPLEMENTAÇÃO DOS LOGS DE AUDITORIA

#### Etapa 3.1: Criar Interface de Logs
- Criar arquivo `src/admin/pages/AuditLogs.tsx`
- Implementar visualização de logs com:
  - Timeline de atividades
  - Filtros por usuário, ação, data e módulo
  - Detalhes expandíveis de cada log
  - Exportação de relatórios

#### Etapa 3.2: Sistema de Filtragem Avançada
- **Filtros Disponíveis:**
  - Por usuário (dropdown com todos os usuários)
  - Por ação (login, logout, create, update, delete, approve, reject)
  - Por módulo (users, news, approvals, settings)
  - Por período (hoje, última semana, último mês, personalizado)
  - Por IP/localização

#### Etapa 3.3: Funcionalidades de Exportação
- Exportar logs em formato CSV/PDF
- Relatórios automáticos por período
- Alertas para atividades suspeitas

### FASE 4: IMPLEMENTAÇÃO DAS CONFIGURAÇÕES

#### Etapa 4.1: Criar Página de Configurações
- Criar arquivo `src/admin/pages/Settings.tsx`
- Organizar em seções:
  - **Configurações Gerais:** nome do site, logo, descrição
  - **Configurações de Segurança:** políticas de senha, 2FA obrigatório
  - **Configurações de Notificações:** emails, webhooks
  - **Configurações de Integração:** APIs externas, Supabase
  - **Configurações de Performance:** cache, otimizações

#### Etapa 4.2: Sistema de Configurações Dinâmicas
- Criar tabela `system_settings` se não existir:
  ```sql
  CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

#### Etapa 4.3: Interface de Configuração
- Formulários dinâmicos baseados no tipo de configuração
- Validação em tempo real
- Preview de mudanças antes de salvar
- Histórico de alterações

### FASE 5: INTEGRAÇÃO E ROTAS

#### Etapa 5.1: Configurar Rotas
- Adicionar rotas no `src/App.tsx`:
  ```typescript
  const Users = lazy(() => import("./admin/pages/Users"));
  const AuditLogs = lazy(() => import("./admin/pages/AuditLogs"));
  const Settings = lazy(() => import("./admin/pages/Settings"));
  
  // Dentro das rotas admin:
  <Route path="/users" element={<Users />} />
  <Route path="/audit" element={<AuditLogs />} />
  <Route path="/settings" element={<Settings />} />
  ```

#### Etapa 5.2: Atualizar Sistema de Permissões
- Verificar permissões no `AdminLayout.tsx`
- Configurar acesso baseado em roles:
  - **Users:** apenas admin
  - **Audit:** admin e editor
  - **Settings:** apenas admin

### FASE 6: TESTES E VALIDAÇÃO

#### Etapa 6.1: Testes Unitários
- Criar testes para cada componente em `src/test/admin/`
- Testar funcionalidades CRUD
- Testar sistema de permissões
- Testar integração com Supabase

#### Etapa 6.2: Testes de Integração
- Testar fluxo completo de cada funcionalidade
- Verificar logs de auditoria sendo gerados
- Testar exportação de dados
- Validar responsividade mobile

## 3. REQUISITOS E MATERIAIS NECESSÁRIOS

### Requisitos Técnicos
- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **Componentes UI:** Shadcn/ui (já configurado)
- **Ícones:** Lucide React
- **Formulários:** React Hook Form + Zod
- **Gráficos:** Recharts (para logs e estatísticas)

### Dependências Adicionais
```json
{
  "react-hook-form": "^7.45.0",
  "@hookform/resolvers": "^3.1.0",
  "zod": "^3.21.0",
  "date-fns": "^2.30.0",
  "recharts": "^2.7.0"
}
```

### Estrutura de Arquivos
```
src/admin/pages/
├── Users.tsx
├── AuditLogs.tsx
├── Settings.tsx
└── components/
    ├── UserForm.tsx
    ├── UserTable.tsx
    ├── AuditLogItem.tsx
    ├── SettingsSection.tsx
    └── ExportDialog.tsx
```

### Configurações do Banco de Dados
- Tabelas existentes: `admin_users`, `audit_logs`
- Tabela a criar: `system_settings`
- Políticas RLS configuradas
- Índices para performance em consultas de logs

## 4. CRITÉRIOS DE QUALIDADE E PONTOS DE VERIFICAÇÃO

### Critérios de Qualidade

#### 4.1: Funcionalidade
- [ ] Todas as operações CRUD funcionam corretamente
- [ ] Sistema de permissões implementado e testado
- [ ] Filtros e busca funcionam adequadamente
- [ ] Exportação de dados funcional
- [ ] Logs de auditoria são gerados automaticamente

#### 4.2: Segurança
- [ ] Políticas RLS configuradas corretamente
- [ ] Validação de entrada em todos os formulários
- [ ] Sanitização de dados antes de salvar
- [ ] Controle de acesso baseado em roles
- [ ] Logs de segurança para ações sensíveis

#### 4.3: Performance
- [ ] Paginação implementada para listas grandes
- [ ] Lazy loading de componentes
- [ ] Otimização de consultas SQL
- [ ] Cache adequado para configurações
- [ ] Índices de banco de dados otimizados

#### 4.4: Usabilidade
- [ ] Interface intuitiva e consistente
- [ ] Feedback visual para todas as ações
- [ ] Mensagens de erro claras e úteis
- [ ] Responsividade mobile adequada
- [ ] Acessibilidade (ARIA labels, navegação por teclado)

#### 4.5: Manutenibilidade
- [ ] Código bem documentado
- [ ] Componentes reutilizáveis
- [ ] Tipagem TypeScript completa
- [ ] Testes unitários com cobertura > 80%
- [ ] Padrões de código consistentes

### Pontos de Verificação por Fase

#### Verificação Fase 1 (Preparação)
- [ ] Arquitetura atual analisada e documentada
- [ ] Banco de dados verificado e preparado
- [ ] Dependências instaladas
- [ ] Ambiente de desenvolvimento configurado

#### Verificação Fase 2 (Usuários)
- [ ] Página de usuários renderiza corretamente
- [ ] CRUD de usuários funcional
- [ ] Filtros e busca implementados
- [ ] Integração com Supabase Auth
- [ ] Permissões de acesso configuradas

#### Verificação Fase 3 (Logs)
- [ ] Logs são exibidos corretamente
- [ ] Filtros avançados funcionam
- [ ] Exportação de dados implementada
- [ ] Performance adequada com grandes volumes
- [ ] Timeline visual funcional

#### Verificação Fase 4 (Configurações)
- [ ] Interface de configurações completa
- [ ] Todas as seções implementadas
- [ ] Validação de configurações
- [ ] Preview de mudanças funcional
- [ ] Histórico de alterações

#### Verificação Fase 5 (Integração)
- [ ] Rotas configuradas e funcionais
- [ ] Menu lateral atualizado
- [ ] Permissões integradas
- [ ] Navegação fluida entre páginas
- [ ] Lazy loading funcionando

#### Verificação Fase 6 (Testes)
- [ ] Todos os testes passando
- [ ] Cobertura de testes adequada
- [ ] Testes de integração validados
- [ ] Performance testada
- [ ] Responsividade verificada

## 5. LINGUAGEM CLARA E DIRETA - CHECKLIST FINAL

### Antes de Considerar Concluído
- [ ] **Funcionalidade Completa:** Todas as 3 páginas implementadas e funcionais
- [ ] **Integração Perfeita:** Rotas, permissões e navegação integradas
- [ ] **Segurança Garantida:** RLS, validações e logs implementados
- [ ] **Performance Otimizada:** Consultas eficientes e interface responsiva
- [ ] **Testes Aprovados:** Cobertura adequada e todos os testes passando
- [ ] **Documentação Atualizada:** README e documentação técnica atualizados

### Critérios de Aceitação Final
1. **Usuário admin** pode gerenciar todos os usuários do sistema
2. **Logs de auditoria** registram todas as ações importantes
3. **Configurações** permitem personalizar o comportamento do sistema
4. **Interface** é consistente com o design existente
5. **Performance** mantém-se adequada mesmo com dados em produção

### Entrega
Após completar todas as fases e verificações, o sistema administrativo estará 100% funcional com todas as funcionalidades mostradas na imagem do menu lateral implementadas e operacionais.

---

**Tempo Estimado de Implementação:** 15-20 horas de desenvolvimento
**Complexidade:** Média-Alta
**Prioridade:** Alta (completar funcionalidades essenciais do admin)
**Dependências:** Supabase configurado, sistema de auth funcionando