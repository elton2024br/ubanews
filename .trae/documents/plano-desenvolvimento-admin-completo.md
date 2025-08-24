# Plano de Desenvolvimento - Sistema de Administração UbaNews

## 1. Visão Geral do Projeto

### 1.1 Objetivo

Desenvolver um sistema de administração completo e seguro para o portal de notícias UbaNews, com funcionalidades robustas de gerenciamento, monitoramento e controle.

### 1.2 Escopo

* Sistema de autenticação e autorização multi-nível

* Gerenciamento completo de usuários e permissões

* Painel de controle com dados e estatísticas em tempo real

* Sistema de configurações personalizáveis

* Registro de atividades e auditoria

* Funcionalidades específicas para gestão de notícias

## 2. Análise da Arquitetura Atual

### 2.1 Estado Atual

* ✅ Autenticação básica implementada (Supabase Auth)

* ✅ Estrutura de usuários admin criada

* ✅ Sistema de roles básico (admin, editor, colunista, reporter)

* ✅ Interface de login funcional

* ⚠️ Funcionalidades administrativas limitadas

* ⚠️ Sistema de permissões básico

* ❌ Painel de estatísticas inexistente

* ❌ Sistema de logs não implementado

### 2.2 Tecnologias Base

* **Frontend**: React 18 + TypeScript + Vite

* **Backend**: Supabase (PostgreSQL + Auth + Storage)

* **UI**: Tailwind CSS + shadcn/ui

* **Estado**: Context API + React Hooks

## 3. Arquitetura de Segurança

### 3.1 Autenticação e Controle de Acesso

#### 3.1.1 Sistema de Autenticação

```typescript
// Níveis de autenticação
interface AuthLevels {
  basic: 'email + password'
  enhanced: '2FA opcional'
  admin: '2FA obrigatório + IP whitelist'
}
```

#### 3.1.2 Sistema de Permissões (RBAC)

```typescript
interface Permission {
  id: string
  name: string
  resource: string
  action: 'create' | 'read' | 'update' | 'delete' | 'manage'
}

interface Role {
  id: string
  name: string
  permissions: Permission[]
  hierarchy_level: number
}
```

#### 3.1.3 Estrutura de Roles

* **Super Admin**: Acesso total ao sistema

* **Admin**: Gerenciamento de usuários e conteúdo

* **Editor**: Aprovação e edição de notícias

* **Colunista**: Criação de artigos e colunas

* **Reporter**: Criação de notícias básicas

### 3.2 Segurança de Dados

* **Criptografia**: Dados sensíveis criptografados

* **RLS**: Row Level Security no Supabase

* **Sanitização**: Input sanitization em todos os formulários

* **Rate Limiting**: Proteção contra ataques de força bruta

* **CORS**: Configuração restritiva de CORS

## 4. Estrutura do Banco de Dados

### 4.1 Tabelas Principais

#### 4.1.1 Sistema de Usuários

```sql
-- Extensão da tabela admin_users existente
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS:
  ip_whitelist TEXT[],
  session_timeout INTEGER DEFAULT 3600,
  force_password_change BOOLEAN DEFAULT FALSE,
  account_locked BOOLEAN DEFAULT FALSE,
  failed_login_attempts INTEGER DEFAULT 0,
  last_password_change TIMESTAMP,
  preferences JSONB DEFAULT '{}';
```

#### 4.1.2 Sistema de Permissões

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);
```

#### 4.1.3 Sistema de Auditoria

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES admin_users(id),
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.1.4 Sistema de Configurações

```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(category, key)
);
```

### 4.2 Índices e Performance

```sql
-- Índices para performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_system_settings_category ON system_settings(category);
```

## 5. Funcionalidades Detalhadas

### 5.1 Autenticação e Controle de Acesso

#### 5.1.1 Componentes

* `LoginForm`: Formulário de login aprimorado

* `TwoFactorAuth`: Componente de 2FA

* `PasswordReset`: Sistema de recuperação de senha

* `SessionManager`: Gerenciamento de sessões

#### 5.1.2 Hooks Customizados

```typescript
// useAuth - Gerenciamento de autenticação
const useAuth = () => {
  const login = async (credentials: LoginCredentials) => {}
  const logout = async () => {}
  const refreshToken = async () => {}
  const validateSession = async () => {}
  return { user, login, logout, isAuthenticated, permissions }
}

// usePermissions - Verificação de permissões
const usePermissions = () => {
  const hasPermission = (resource: string, action: string) => {}
  const hasRole = (role: string) => {}
  const canAccess = (route: string) => {}
  return { hasPermission, hasRole, canAccess }
}
```

### 5.2 Gerenciamento de Usuários

#### 5.2.1 Funcionalidades

* **CRUD Completo**: Criar, visualizar, editar, excluir usuários

* **Gerenciamento de Roles**: Atribuição e remoção de papéis

* **Controle de Status**: Ativar/desativar contas

* **Histórico de Atividades**: Visualizar ações do usuário

* **Importação/Exportação**: Bulk operations

#### 5.2.2 Componentes

```typescript
// UserManagement - Componente principal
interface UserManagementProps {
  users: AdminUser[]
  onUserCreate: (user: CreateUserData) => void
  onUserUpdate: (id: string, data: UpdateUserData) => void
  onUserDelete: (id: string) => void
}

// UserForm - Formulário de usuário
interface UserFormProps {
  user?: AdminUser
  roles: Role[]
  onSubmit: (data: UserFormData) => void
  mode: 'create' | 'edit'
}
```

### 5.3 Painel de Visualização de Dados

#### 5.3.1 Métricas Principais

* **Usuários**: Total, ativos, novos registros

* **Conteúdo**: Notícias publicadas, em revisão, rejeitadas

* **Engajamento**: Visualizações, comentários, compartilhamentos

* **Performance**: Tempo de carregamento, erros

* **Sistema**: Uso de recursos, logs de erro

#### 5.3.2 Componentes de Dashboard

```typescript
// Dashboard - Componente principal
const Dashboard = () => {
  return (
    <div className="dashboard-grid">
      <MetricsOverview />
      <RealtimeStats />
      <ActivityFeed />
      <PerformanceCharts />
      <SystemHealth />
    </div>
  )
}

// MetricCard - Card de métrica
interface MetricCardProps {
  title: string
  value: number | string
  change?: number
  trend?: 'up' | 'down' | 'stable'
  icon: React.ReactNode
}
```

#### 5.3.3 Gráficos e Visualizações

* **Biblioteca**: Recharts ou Chart.js

* **Tipos**: Linha, barra, pizza, área

* **Tempo Real**: WebSocket para atualizações

* **Exportação**: PDF, Excel, CSV

### 5.4 Configurações do Sistema

#### 5.4.1 Categorias de Configuração

* **Geral**: Nome do site, logo, descrição

* **Segurança**: Políticas de senha, 2FA, sessões

* **Notificações**: Email, push, SMS

* **Conteúdo**: Moderação, aprovação, categorias

* **Performance**: Cache, CDN, otimizações

* **Integrações**: APIs externas, webhooks

#### 5.4.2 Interface de Configurações

```typescript
// SettingsManager - Gerenciador principal
interface SettingsManagerProps {
  categories: SettingCategory[]
  onSave: (category: string, settings: Record<string, any>) => void
}

// SettingField - Campo de configuração
interface SettingFieldProps {
  setting: SystemSetting
  value: any
  onChange: (value: any) => void
  type: 'text' | 'number' | 'boolean' | 'select' | 'json'
}
```

### 5.5 Sistema de Logs e Auditoria

#### 5.5.1 Tipos de Logs

* **Autenticação**: Login, logout, falhas

* **Usuários**: CRUD operations

* **Conteúdo**: Criação, edição, publicação

* **Sistema**: Configurações, erros, performance

* **Segurança**: Tentativas de acesso, violações

#### 5.5.2 Componentes de Auditoria

```typescript
// AuditLogger - Hook para logging
const useAuditLogger = () => {
  const logAction = async (action: AuditAction) => {}
  const logError = async (error: Error, context?: any) => {}
  const logSecurity = async (event: SecurityEvent) => {}
  return { logAction, logError, logSecurity }
}

// AuditViewer - Visualizador de logs
interface AuditViewerProps {
  filters: AuditFilters
  onFilterChange: (filters: AuditFilters) => void
  logs: AuditLog[]
  pagination: PaginationProps
}
```

### 5.6 Funcionalidades Específicas do Negócio

#### 5.6.1 Gerenciamento de Notícias

* **Workflow de Aprovação**: Rascunho → Revisão → Publicado

* **Agendamento**: Publicação automática

* **Categorização**: Tags, categorias, prioridades

* **SEO**: Meta tags, URLs amigáveis

* **Mídia**: Upload e gerenciamento de imagens

#### 5.6.2 Sistema de Moderação

* **Comentários**: Aprovação, rejeição, spam

* **Denúncias**: Sistema de reports

* **Blacklist**: Palavras e usuários bloqueados

* **Automação**: Filtros automáticos

## 6. Estrutura de Componentes React

### 6.1 Organização de Pastas

```
src/admin/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── TwoFactorAuth.tsx
│   │   └── PasswordReset.tsx
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── MetricCard.tsx
│   │   ├── RealtimeStats.tsx
│   │   └── ActivityFeed.tsx
│   ├── users/
│   │   ├── UserManagement.tsx
│   │   ├── UserForm.tsx
│   │   ├── UserList.tsx
│   │   └── UserProfile.tsx
│   ├── settings/
│   │   ├── SettingsManager.tsx
│   │   ├── SettingField.tsx
│   │   └── SettingCategory.tsx
│   ├── audit/
│   │   ├── AuditViewer.tsx
│   │   ├── AuditFilters.tsx
│   │   └── AuditDetails.tsx
│   └── news/
│       ├── NewsManagement.tsx
│       ├── NewsEditor.tsx
│       ├── NewsApproval.tsx
│       └── NewsScheduler.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   ├── useAuditLogger.ts
│   ├── useDashboard.ts
│   └── useSettings.ts
├── services/
│   ├── authService.ts
│   ├── userService.ts
│   ├── auditService.ts
│   ├── settingsService.ts
│   └── newsService.ts
├── types/
│   ├── auth.ts
│   ├── user.ts
│   ├── audit.ts
│   ├── settings.ts
│   └── news.ts
└── utils/
    ├── permissions.ts
    ├── validation.ts
    ├── formatting.ts
    └── constants.ts
```

### 6.2 Hooks Customizados Principais

#### 6.2.1 useAuth

```typescript
interface UseAuthReturn {
  user: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  permissions: Permission[]
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  updateProfile: (data: ProfileData) => Promise<void>
}
```

#### 6.2.2 useDashboard

```typescript
interface UseDashboardReturn {
  metrics: DashboardMetrics
  isLoading: boolean
  error: Error | null
  refreshMetrics: () => Promise<void>
  subscribeToRealtime: () => () => void
}
```

## 7. APIs e Serviços

### 7.1 Estrutura de Serviços

#### 7.1.1 AuthService

```typescript
class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse>
  async logout(): Promise<void>
  async refreshToken(): Promise<string>
  async validateSession(): Promise<boolean>
  async enable2FA(secret: string): Promise<void>
  async verify2FA(token: string): Promise<boolean>
}
```

#### 7.1.2 UserService

```typescript
class UserService {
  async getUsers(filters?: UserFilters): Promise<AdminUser[]>
  async createUser(data: CreateUserData): Promise<AdminUser>
  async updateUser(id: string, data: UpdateUserData): Promise<AdminUser>
  async deleteUser(id: string): Promise<void>
  async getUserActivity(id: string): Promise<AuditLog[]>
}
```

### 7.2 Integração com Supabase

#### 7.2.1 Configuração RLS

```sql
-- Políticas de segurança
CREATE POLICY "Admin users can manage all users" ON admin_users
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view own profile" ON admin_users
  FOR SELECT USING (auth.uid() = id);
```

#### 7.2.2 Funções do Banco

```sql
-- Função para verificar permissões
CREATE OR REPLACE FUNCTION check_user_permission(
  user_id UUID,
  resource TEXT,
  action TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Lógica de verificação de permissão
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 8. Testes

### 8.1 Estratégia de Testes

* **Unitários**: Jest + React Testing Library

* **Integração**: Cypress ou Playwright

* **E2E**: Cenários completos de usuário

* **Performance**: Lighthouse CI

* **Segurança**: OWASP ZAP

### 8.2 Cobertura de Testes

```typescript
// Exemplo de teste unitário
describe('useAuth Hook', () => {
  it('should authenticate user successfully', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {
      await result.current.login({ email: 'test@test.com', password: 'password' })
    })
    expect(result.current.isAuthenticated).toBe(true)
  })
})

// Exemplo de teste E2E
describe('Admin Dashboard', () => {
  it('should display metrics correctly', () => {
    cy.login('admin@test.com', 'password')
    cy.visit('/admin/dashboard')
    cy.get('[data-testid="user-count"]').should('contain', '10')
  })
})
```

## 9. Cronograma de Implementação

### 9.1 Fase 1 - Fundação (Semanas 1-2)

* ✅ Análise da arquitetura atual

* 🔄 Aprimoramento do sistema de autenticação

* 🔄 Implementação do sistema de permissões

* 🔄 Criação das tabelas de auditoria

* 🔄 Setup dos testes básicos

### 9.2 Fase 2 - Core Features (Semanas 3-4)

* 📋 Gerenciamento de usuários completo

* 📋 Sistema de configurações

* 📋 Logging e auditoria básica

* 📋 Dashboard inicial

### 9.3 Fase 3 - Dashboard e Analytics (Semanas 5-6)

* 📋 Métricas em tempo real

* 📋 Gráficos e visualizações

* 📋 Sistema de notificações

* 📋 Exportação de dados

### 9.4 Fase 4 - Funcionalidades Avançadas (Semanas 7-8)

* 📋 Gerenciamento de notícias avançado

* 📋 Sistema de moderação

* 📋 Automações e workflows

* 📋 Integrações externas

### 9.5 Fase 5 - Polimento e Deploy (Semanas 9-10)

* 📋 Testes completos

* 📋 Otimizações de performance

* 📋 Documentação final

* 📋 Deploy e monitoramento

## 10. Documentação Técnica

### 10.1 Documentação de API

* **OpenAPI/Swagger**: Especificação completa

* **Postman Collection**: Coleção de endpoints

* **Exemplos**: Requests e responses

### 10.2 Documentação de Componentes

* **Storybook**: Catálogo de componentes

* **JSDoc**: Documentação inline

* **README**: Guias de uso

### 10.3 Guias de Desenvolvimento

* **Setup**: Configuração do ambiente

* **Contribuição**: Guidelines para desenvolvedores

* **Deployment**: Processo de deploy

* **Troubleshooting**: Solução de problemas

## 11. Monitoramento e Manutenção

### 11.1 Métricas de Sistema

* **Performance**: Tempo de resposta, throughput

* **Disponibilidade**: Uptime, SLA

* **Erros**: Taxa de erro, logs de exceção

* **Segurança**: Tentativas de invasão, vulnerabilidades

### 11.2 Alertas e Notificações

* **Críticos**: Sistema fora do ar, falhas de segurança

* **Avisos**: Performance degradada, erros frequentes

* **Informativos**: Atualizações, manutenções

## 12. Considerações de Segurança

### 12.1 OWASP Top 10

* **Injection**: Sanitização de inputs

* **Broken Authentication**: 2FA, sessões seguras

* **Sensitive Data Exposure**: Criptografia

* **XML External Entities**: Validação de XML

* **Broken Access Control**: RBAC rigoroso

* **Security Misconfiguration**: Configurações seguras

* **Cross-Site Scripting**: CSP, sanitização

* **Insecure Deserialization**: Validação de dados

* **Known Vulnerabilities**: Atualizações regulares

* **Insufficient Logging**: Auditoria completa

### 12.2 Compliance

* **LGPD**: Proteção de dados pessoais

* **GDPR**: Regulamentação europeia

* **ISO 27001**: Gestão de segurança

## 13. Conclusão

Este plano fornece uma roadmap completa para o desenvolvimento do sistema de administração do UbaNews, garantindo:

* **Segurança robusta** com múltiplas camadas de proteção

* **Interface intuitiva** com UX/UI moderno

* **Arquitetura escalável** para crescimento futuro

* **Código maintível** com boas práticas

* **Documentação completa** para facilitar manutenção

O cronograma de 10 semanas permite implementação gradual e testes adequados, garantindo qualidade e estabilidade do sistema final.

***

**Próximos Passos:**

1. Aprovação do plano pela equipe
2. Setup do ambiente de desenvolvimento
3. Início da Fase 1 - Fundação
4. Reviews semanais de progresso
5. Ajustes conforme necessário

