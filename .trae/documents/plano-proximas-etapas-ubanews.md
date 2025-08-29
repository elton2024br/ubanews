# Plano de Próximas Etapas - UbaNews

## 1. Status Atual do Projeto

### ✅ **Problemas Críticos Resolvidos**
- **Autenticação Real**: Sistema de login seguro com Supabase Auth implementado
- **Credenciais Hardcoded**: Removidas todas as credenciais expostas
- **Conexão com Dados Reais**: Dashboard, Users e NewsManagement conectados ao Supabase
- **Funcionalidades Administrativas**: Sistema CRUD operacional para usuários e notícias

### 🎯 **Estado Atual da Aplicação**
- Sistema administrativo funcional e seguro
- Autenticação robusta implementada
- Interface administrativa responsiva
- Conexão estável com Supabase
- Aplicação rodando em desenvolvimento (http://localhost:5173/)

---

## 2. Análise de Prioridades

### 🔴 **FASE 1 - Funcionalidades Críticas (1-2 semanas)**

#### 2.1 Sistema de Aprovações de Notícias
**Prioridade**: ALTA
**Impacto**: Workflow editorial essencial

**Implementação**:
- Criar tabela `news_approvals` no Supabase
- Implementar estados: `draft`, `pending`, `approved`, `rejected`
- Interface para aprovação/rejeição com comentários
- Notificações para editores e autores

**Arquivos a criar/modificar**:
```
src/admin/pages/NewsApprovals.tsx
src/admin/components/ApprovalWorkflow.tsx
supabase/migrations/016_create_news_approvals.sql
```

#### 2.2 Sistema de Logs de Auditoria
**Prioridade**: ALTA
**Impacto**: Segurança e compliance

**Implementação**:
- Tabela `audit_logs` para rastreamento de ações
- Hook `useAuditLog` para registro automático
- Interface de visualização de logs
- Filtros por usuário, ação e período

**Arquivos a criar/modificar**:
```
src/admin/pages/AuditLogs.tsx
src/admin/hooks/useAuditLog.ts
supabase/migrations/017_create_audit_logs.sql
```

#### 2.3 Editor de Conteúdo Avançado
**Prioridade**: ALTA
**Impacto**: Qualidade do conteúdo

**Implementação**:
- Integrar editor WYSIWYG (TinyMCE ou Quill)
- Upload de imagens com otimização
- Preview em tempo real
- Salvamento automático (draft)

**Dependências**:
```bash
npm install @tinymce/tinymce-react
# ou
npm install react-quill
```

### 🟠 **FASE 2 - Funcionalidades Importantes (2-3 semanas)**

#### 2.4 Sistema de Notificações em Tempo Real
**Prioridade**: MÉDIA-ALTA
**Impacto**: Comunicação eficiente

**Implementação**:
- Usar Supabase Realtime para notificações
- Componente `NotificationCenter`
- Tipos: aprovações, comentários, menções
- Persistência de notificações não lidas

#### 2.5 Analytics e Métricas Avançadas
**Prioridade**: MÉDIA-ALTA
**Impacto**: Tomada de decisões baseada em dados

**Implementação**:
- Dashboard com gráficos (Recharts)
- Métricas: visualizações, engajamento, performance
- Relatórios exportáveis (PDF/Excel)
- Integração com Google Analytics 4

#### 2.6 Sistema de Comentários
**Prioridade**: MÉDIA
**Impacto**: Engajamento dos leitores

**Implementação**:
- Tabela `comments` com moderação
- Interface de moderação para admins
- Sistema de aprovação automática/manual
- Notificações para autores

### 🟡 **FASE 3 - Melhorias e Otimizações (3-4 semanas)**

#### 2.7 Otimizações de Performance
**Prioridade**: MÉDIA
**Impacto**: Experiência do usuário

**Implementação**:
- Lazy loading de componentes
- Cache inteligente com React Query
- Otimização de imagens (WebP/AVIF)
- Service Worker para cache offline

#### 2.8 Sistema de Configurações
**Prioridade**: MÉDIA
**Impacto**: Flexibilidade administrativa

**Implementação**:
- Tabela `system_settings`
- Interface para configurações globais
- Temas personalizáveis
- Configurações de SEO

#### 2.9 Funcionalidades de SEO
**Prioridade**: MÉDIA
**Impacto**: Visibilidade online

**Implementação**:
- Meta tags dinâmicas
- Sitemap automático
- Schema.org markup
- Open Graph tags

---

## 3. Roadmap Detalhado

### **Semana 1-2: Funcionalidades Críticas**

#### Sprint 1 (Semana 1)
- [ ] Implementar sistema de aprovações de notícias
- [ ] Criar interface de workflow editorial
- [ ] Configurar notificações básicas
- [ ] Testes de integração

#### Sprint 2 (Semana 2)
- [ ] Sistema de logs de auditoria
- [ ] Interface de visualização de logs
- [ ] Editor de conteúdo avançado
- [ ] Upload e otimização de imagens

### **Semana 3-5: Funcionalidades Importantes**

#### Sprint 3 (Semana 3)
- [ ] Sistema de notificações em tempo real
- [ ] Centro de notificações
- [ ] Analytics básico no dashboard

#### Sprint 4 (Semana 4)
- [ ] Métricas avançadas e gráficos
- [ ] Relatórios exportáveis
- [ ] Sistema de comentários

#### Sprint 5 (Semana 5)
- [ ] Moderação de comentários
- [ ] Integração com Google Analytics
- [ ] Testes de performance

### **Semana 6-8: Melhorias e Otimizações**

#### Sprint 6 (Semana 6)
- [ ] Otimizações de performance
- [ ] Implementação de cache inteligente
- [ ] Service Worker

#### Sprint 7 (Semana 7)
- [ ] Sistema de configurações
- [ ] Temas personalizáveis
- [ ] Funcionalidades de SEO

#### Sprint 8 (Semana 8)
- [ ] Testes finais
- [ ] Documentação
- [ ] Preparação para produção

---

## 4. Especificações Técnicas das Próximas Funcionalidades

### 4.1 Sistema de Aprovações

#### Estrutura do Banco de Dados
```sql
CREATE TABLE news_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    news_id UUID REFERENCES admin_news(id),
    submitted_by UUID REFERENCES admin_users(id),
    reviewer_id UUID REFERENCES admin_users(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
    comments TEXT,
    submitted_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Interface React
```typescript
interface NewsApproval {
  id: string;
  news_id: string;
  submitted_by: string;
  reviewer_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  comments?: string;
  submitted_at: string;
  reviewed_at?: string;
}

const useNewsApprovals = () => {
  // Hook para gerenciar aprovações
};
```

### 4.2 Sistema de Logs de Auditoria

#### Estrutura do Banco
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Hook de Auditoria
```typescript
const useAuditLog = () => {
  const logAction = async (action: string, resourceType: string, resourceId?: string, oldValues?: any, newValues?: any) => {
    // Registrar ação no log
  };
  
  return { logAction };
};
```

### 4.3 Editor Avançado

#### Componente Editor
```typescript
interface AdvancedEditorProps {
  content: string;
  onChange: (content: string) => void;
  onImageUpload: (file: File) => Promise<string>;
  autoSave?: boolean;
}

const AdvancedEditor: React.FC<AdvancedEditorProps> = ({ ... }) => {
  // Implementação do editor WYSIWYG
};
```

---

## 5. Recursos Necessários

### 5.1 Dependências Adicionais
```json
{
  "@tinymce/tinymce-react": "^4.3.0",
  "recharts": "^2.8.0",
  "jspdf": "^2.5.1",
  "xlsx": "^0.18.5",
  "react-hot-toast": "^2.4.1",
  "date-fns": "^2.30.0",
  "react-intersection-observer": "^9.5.2"
}
```

### 5.2 Configurações do Supabase
- Habilitar Realtime para notificações
- Configurar Storage para upload de imagens
- Implementar RLS policies para novas tabelas
- Configurar webhooks para integrações externas

### 5.3 Ferramentas de Desenvolvimento
- Storybook para documentação de componentes
- Jest para testes unitários
- Cypress para testes E2E
- GitHub Actions para CI/CD

---

## 6. Critérios de Sucesso

### 6.1 Métricas de Performance
- [ ] Tempo de carregamento < 2s
- [ ] Core Web Vitals dentro dos padrões
- [ ] 99.5% de uptime
- [ ] Suporte a 1000+ usuários simultâneos

### 6.2 Funcionalidades
- [ ] Sistema de aprovações 100% funcional
- [ ] Logs de auditoria completos
- [ ] Editor avançado operacional
- [ ] Notificações em tempo real
- [ ] Analytics precisos

### 6.3 Segurança
- [ ] Autenticação 2FA implementada
- [ ] RLS policies configuradas
- [ ] Logs de segurança ativos
- [ ] Backup automático funcionando

---

## 7. Próximos Passos Imediatos

### 🚀 **Ação Imediata (Próximas 24h)**
1. **Criar migração para sistema de aprovações**
   ```bash
   # Executar no Supabase SQL Editor
   -- Ver especificação na seção 4.1
   ```

2. **Implementar componente NewsApprovals**
   ```bash
   # Criar arquivo
   touch src/admin/pages/NewsApprovals.tsx
   ```

3. **Configurar rota de aprovações**
   ```typescript
   // Adicionar em App.tsx
   <Route path="/admin/approvals" element={<NewsApprovals />} />
   ```

### 📋 **Checklist da Próxima Sprint**
- [ ] Definir estrutura de aprovações no banco
- [ ] Criar interface de aprovação
- [ ] Implementar notificações básicas
- [ ] Configurar testes unitários
- [ ] Documentar API de aprovações

---

## 8. Considerações Finais

Com os problemas críticos resolvidos, o UbaNews está pronto para evoluir para um sistema completo e robusto. As próximas funcionalidades focarão em:

1. **Workflow Editorial**: Sistema de aprovações para garantir qualidade
2. **Transparência**: Logs de auditoria para compliance
3. **Produtividade**: Editor avançado para criação eficiente
4. **Comunicação**: Notificações em tempo real
5. **Inteligência**: Analytics para decisões baseadas em dados

O roadmap proposto é flexível e pode ser ajustado conforme as necessidades do negócio e feedback dos usuários.

**Status**: ✅ Pronto para iniciar Fase 1
**Próxima revisão**: Após conclusão do Sprint 1
**Responsável**: Equipe de desenvolvimento UbaNews