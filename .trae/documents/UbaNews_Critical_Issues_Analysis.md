# Análise Crítica de Problemas - UbaNews

## 1. Visão Geral dos Problemas

Este documento apresenta uma análise detalhada dos 5 problemas críticos identificados no sistema UbaNews e fornece um plano de implementação completo para cada correção necessária.

### Problemas Identificados:
1. **Segurança Crítica**: Sistema de autenticação falso
2. **Funcionalidades Inoperantes**: Tabelas de banco ausentes
3. **Busca Pública Ineficaz**: Sistema de busca simulado
4. **Ferramentas de Conteúdo Limitadas**: Editor básico sem recursos avançados
5. **Problemas de Escalabilidade**: Carregamento ineficiente de dados

---

## 2. PROBLEMA 1: Segurança Crítica - Sistema de Autenticação

### 2.1 Análise do Problema
**Severidade**: CRÍTICA 🔴

**Situação Atual**:
- Login hardcoded com credenciais fixas (`admin123`)
- Credenciais expostas na interface de login
- Ausência de integração real com Supabase Auth
- Vulnerabilidade de segurança extrema

**Arquivos Afetados**:
- `src/admin/context/AdminProvider.tsx`
- `src/admin/auth/LoginPage.tsx`

### 2.2 Plano de Correção

#### Tarefa 1: Configurar Usuários no Supabase
```sql
-- Executar no SQL Editor do Supabase
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'admin@ubanews.com', crypt('senha_segura_admin', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'editor@ubanews.com', crypt('senha_segura_editor', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'colunista@ubanews.com', crypt('senha_segura_colunista', gen_salt('bf')), NOW(), NOW(), NOW());
```

#### Tarefa 2: Implementar Autenticação Real
**Arquivo**: `src/admin/context/AdminProvider.tsx`

```typescript
// Substituir a função login atual
const login = async (email: string, password: string): Promise<boolean> => {
  try {
    setLoading(true);
    
    // Autenticação real com Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Erro de autenticação:', error.message);
      return false;
    }
    
    if (data.user) {
      // Buscar dados do usuário admin
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();
      
      if (adminError || !adminUser) {
        await supabase.auth.signOut();
        return false;
      }
      
      // Atualizar último login
      await supabase
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', adminUser.id);
      
      setUser(adminUser);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erro no login:', error);
    return false;
  } finally {
    setLoading(false);
  }
};
```

#### Tarefa 3: Implementar Logout Seguro
```typescript
const logout = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
    setUser(null);
  } catch (error) {
    console.error('Erro no logout:', error);
  }
};
```

#### Tarefa 4: Limpar Interface de Login
**Arquivo**: `src/admin/auth/LoginPage.tsx`

```typescript
// Remover completamente este bloco:
{/* 
<div className="text-sm text-gray-600 mb-4">
  <p>Credenciais de teste:</p>
  <p>admin@ubanews.com / admin123</p>
  <p>editor@ubanews.com / admin123</p>
  <p>colunista@ubanews.com / admin123</p>
</div>
*/}
```

---

## 3. PROBLEMA 2: Tabelas de Banco Ausentes

### 3.1 Análise do Problema
**Severidade**: ALTA 🟠

**Funcionalidades Afetadas**:
- Sistema de aprovações de notícias
- Logs de auditoria
- Relatórios administrativos

### 3.2 Estrutura das Novas Tabelas

#### Migração 1: Tabela de Logs de Auditoria
**Arquivo**: `supabase/migrations/006_create_audit_logs.sql`

```sql
-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS Policy
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- Função para criar logs automaticamente
CREATE OR REPLACE FUNCTION create_audit_log(
    p_user_id UUID,
    p_action VARCHAR(100),
    p_resource_type VARCHAR(50),
    p_resource_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, 
        old_values, new_values
    ) VALUES (
        p_user_id, p_action, p_resource_type, p_resource_id,
        p_old_values, p_new_values
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT SELECT ON audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION create_audit_log TO authenticated;
```

#### Migração 2: Melhorias na Tabela de Aprovações
**Arquivo**: `supabase/migrations/007_enhance_approvals.sql`

```sql
-- Adicionar campos ausentes na tabela news_approvals
ALTER TABLE news_approvals ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
ALTER TABLE news_approvals ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE news_approvals ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Função para iniciar processo de aprovação
CREATE OR REPLACE FUNCTION start_approval_process(
    p_news_id UUID,
    p_priority VARCHAR(20) DEFAULT 'normal'
) RETURNS UUID AS $$
DECLARE
    approval_id UUID;
BEGIN
    INSERT INTO news_approvals (news_id, status, priority)
    VALUES (p_news_id, 'pending', p_priority)
    RETURNING id INTO approval_id;
    
    -- Criar log de auditoria
    PERFORM create_audit_log(
        auth.uid(),
        'APPROVAL_STARTED',
        'news_approval',
        approval_id,
        NULL,
        json_build_object('news_id', p_news_id, 'priority', p_priority)
    );
    
    RETURN approval_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION start_approval_process TO authenticated;
```

### 3.3 Comandos de Implementação
```bash
# Aplicar migrações
supabase db push

# Verificar se as tabelas foram criadas
supabase db diff
```

---

## 4. PROBLEMA 3: Sistema de Busca Ineficaz

### 4.1 Análise do Problema
**Severidade**: MÉDIA 🟡

**Situação Atual**:
- Busca simulada com dados mockados
- Ausência de integração com banco de dados
- Filtros não funcionais

### 4.2 Implementação de Busca Real

#### Função RPC no Supabase
**Arquivo**: `supabase/migrations/008_create_search_functions.sql`

```sql
-- Função de busca avançada
CREATE OR REPLACE FUNCTION search_news(
    search_term TEXT DEFAULT '',
    category_filter TEXT DEFAULT NULL,
    status_filter TEXT DEFAULT 'published',
    date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    title VARCHAR(500),
    excerpt TEXT,
    category VARCHAR(100),
    featured_image TEXT,
    publish_date TIMESTAMP WITH TIME ZONE,
    author_name VARCHAR(255),
    view_count INTEGER,
    relevance_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.excerpt,
        n.category,
        n.featured_image,
        n.publish_date,
        u.full_name as author_name,
        n.view_count,
        CASE 
            WHEN search_term = '' THEN 1.0
            ELSE ts_rank(to_tsvector('portuguese', n.title || ' ' || n.content), plainto_tsquery('portuguese', search_term))
        END as relevance_score
    FROM admin_news n
    JOIN admin_users u ON n.author_id = u.id
    WHERE 
        (status_filter IS NULL OR n.status = status_filter)
        AND (category_filter IS NULL OR n.category = category_filter)
        AND (date_from IS NULL OR n.publish_date >= date_from)
        AND (date_to IS NULL OR n.publish_date <= date_to)
        AND (
            search_term = '' OR 
            to_tsvector('portuguese', n.title || ' ' || n.content) @@ plainto_tsquery('portuguese', search_term)
        )
    ORDER BY 
        CASE WHEN search_term = '' THEN n.publish_date ELSE relevance_score END DESC,
        n.publish_date DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter categorias dinâmicas
CREATE OR REPLACE FUNCTION get_news_categories()
RETURNS TABLE (category VARCHAR(100), count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.category,
        COUNT(*) as count
    FROM admin_news n
    WHERE n.status = 'published'
    GROUP BY n.category
    ORDER BY count DESC, n.category ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION search_news TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_news_categories TO anon, authenticated;
```

#### Atualização do Hook de Busca
**Arquivo**: `src/hooks/useAdvancedSearch.ts`

```typescript
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface SearchFilters {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  featured_image?: string;
  publish_date: string;
  author_name: string;
  view_count: number;
  relevance_score: number;
}

export const useAdvancedSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  const performSearch = useCallback(async (
    query: string,
    filters: SearchFilters = {},
    page: number = 1,
    limit: number = 20
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const offset = (page - 1) * limit;
      
      const { data, error: searchError } = await supabase
        .rpc('search_news', {
          search_term: query,
          category_filter: filters.category || null,
          status_filter: filters.status || 'published',
          date_from: filters.dateFrom ? new Date(filters.dateFrom).toISOString() : null,
          date_to: filters.dateTo ? new Date(filters.dateTo).toISOString() : null,
          limit_count: limit,
          offset_count: offset
        });
      
      if (searchError) {
        throw searchError;
      }
      
      setResults(data || []);
      setTotalResults(data?.length || 0);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na busca');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_news_categories');
      
      if (error) throw error;
      
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
      return [];
    }
  }, []);

  return {
    results,
    loading,
    error,
    totalResults,
    performSearch,
    getCategories
  };
};
```

---

## 5. PROBLEMA 4: Ferramentas de Conteúdo Limitadas

### 5.1 Análise do Problema
**Severidade**: MÉDIA 🟡

**Limitações Atuais**:
- Editor de texto básico sem formatação
- Ausência de upload de imagens
- Falta de preview do conteúdo

### 5.2 Implementação de Editor Rico

#### Instalação de Dependências
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link
npm install dompurify @types/dompurify
```

#### Componente de Editor Rico
**Arquivo**: `src/components/RichTextEditor.tsx`

```typescript
import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Button } from './ui/button';
import { Bold, Italic, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Escreva o conteúdo da notícia...'
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  const addImage = () => {
    const url = window.prompt('URL da imagem:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('URL do link:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg">
      <div className="border-b p-2 flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-gray-200' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-gray-200' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLink}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addImage}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>
      
      <EditorContent 
        editor={editor} 
        className="min-h-[200px]"
      />
    </div>
  );
};
```

#### Sistema de Upload de Imagens
**Arquivo**: `src/hooks/useImageUpload.ts`

```typescript
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);
    
    try {
      // Validar arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Arquivo deve ser uma imagem');
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        throw new Error('Imagem deve ter menos de 5MB');
      }
      
      // Gerar nome único
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `news-images/${fileName}`;
      
      // Upload para Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
      
      return publicUrl;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro no upload';
      setError(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadImage,
    uploading,
    error
  };
};
```

---

## 6. PROBLEMA 5: Otimizações de Performance

### 6.1 Análise do Problema
**Severidade**: BAIXA 🟢

**Problemas Identificados**:
- Carregamento excessivo de dados
- Ausência de paginação
- Consultas ineficientes

### 6.2 Otimizações Implementadas

#### Hook de Categorias Dinâmicas
**Arquivo**: `src/hooks/useCategories.ts`

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Category {
  category: string;
  count: number;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase.rpc('get_news_categories');
        
        if (error) throw error;
        
        setCategories(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar categorias');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};
```

#### Função de Relatórios Otimizada
**Arquivo**: `supabase/migrations/009_create_reports_functions.sql`

```sql
-- Função para relatórios de performance
CREATE OR REPLACE FUNCTION get_news_analytics(
    date_from TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    date_to TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) RETURNS TABLE (
    total_news BIGINT,
    published_news BIGINT,
    draft_news BIGINT,
    pending_news BIGINT,
    total_views BIGINT,
    avg_views_per_news NUMERIC,
    top_categories JSONB,
    top_authors JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'published') as published,
            COUNT(*) FILTER (WHERE status = 'draft') as draft,
            COUNT(*) FILTER (WHERE status = 'pending') as pending,
            SUM(view_count) as total_views,
            AVG(view_count) as avg_views
        FROM admin_news
        WHERE created_at BETWEEN date_from AND date_to
    ),
    top_cats AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'category', category,
                'count', count,
                'views', total_views
            ) ORDER BY count DESC
        ) as categories
        FROM (
            SELECT 
                category,
                COUNT(*) as count,
                SUM(view_count) as total_views
            FROM admin_news
            WHERE created_at BETWEEN date_from AND date_to
            GROUP BY category
            LIMIT 10
        ) cat_stats
    ),
    top_auth AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'author', u.full_name,
                'count', count,
                'views', total_views
            ) ORDER BY count DESC
        ) as authors
        FROM (
            SELECT 
                n.author_id,
                COUNT(*) as count,
                SUM(n.view_count) as total_views
            FROM admin_news n
            WHERE n.created_at BETWEEN date_from AND date_to
            GROUP BY n.author_id
            LIMIT 10
        ) auth_stats
        JOIN admin_users u ON auth_stats.author_id = u.id
    )
    SELECT 
        s.total,
        s.published,
        s.draft,
        s.pending,
        s.total_views,
        s.avg_views,
        tc.categories,
        ta.authors
    FROM stats s, top_cats tc, top_auth ta;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_news_analytics TO authenticated;
```

---

## 7. Plano de Implementação

### 7.1 Cronograma Sugerido

| Fase | Duração | Prioridade | Tarefas |
|------|---------|------------|----------|
| **Fase 1** | 1-2 dias | CRÍTICA | Implementar autenticação real |
| **Fase 2** | 2-3 dias | ALTA | Criar tabelas ausentes e migrações |
| **Fase 3** | 3-4 dias | MÉDIA | Implementar busca funcional |
| **Fase 4** | 4-5 dias | MÉDIA | Adicionar editor rico e upload |
| **Fase 5** | 2-3 dias | BAIXA | Otimizações de performance |

### 7.2 Comandos de Implementação

```bash
# 1. Aplicar todas as migrações
supabase db push

# 2. Instalar dependências do editor
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link dompurify @types/dompurify

# 3. Configurar Storage no Supabase (via dashboard)
# - Criar bucket 'images'
# - Configurar políticas de acesso público

# 4. Testar funcionalidades
npm run test

# 5. Build de produção
npm run build
```

### 7.3 Configurações Necessárias no Supabase

1. **Storage Bucket**:
   - Nome: `images`
   - Público: `true`
   - Tamanho máximo: `5MB`

2. **Políticas RLS**:
   - Todas as políticas já estão definidas nas migrações

3. **Usuários Admin**:
   - Criar via SQL Editor ou Authentication panel

---

## 8. Testes e Validação

### 8.1 Checklist de Testes

- [ ] Login com credenciais reais funciona
- [ ] Logout limpa sessão corretamente
- [ ] Tabelas de auditoria registram ações
- [ ] Busca retorna resultados do banco
- [ ] Filtros de busca funcionam
- [ ] Editor rico formata texto
- [ ] Upload de imagens funciona
- [ ] Relatórios carregam dados otimizados
- [ ] Categorias são dinâmicas

### 8.2 Monitoramento

- Logs de auditoria para todas as ações administrativas
- Métricas de performance das consultas
- Monitoramento de uploads de imagem
- Análise de uso das funcionalidades de busca

---

## 9. Considerações de Segurança

### 9.1 Implementadas
- Row Level Security (RLS) em todas as tabelas
- Autenticação real via Supabase Auth
- Sanitização de HTML com DOMPurify
- Validação de uploads de imagem

### 9.2 Recomendações Adicionais
- Implementar rate limiting
- Adicionar 2FA para admins
- Logs de tentativas de login
- Backup automático do banco

---

## 10. Conclusão

Este plano de correção aborda todos os problemas críticos identificados no UbaNews, priorizando segurança e funcionalidade. A implementação seguindo este documento resultará em um sistema robusto, seguro e escalável.

**Próximos Passos**:
1. Revisar e aprovar o plano
2. Configurar ambiente de desenvolvimento
3. Implementar correções por fase
4. Testar cada funcionalidade
5. Deploy em produção

**Estimativa Total**: 12-17 dias de desenvolvimento
**Recursos Necessários**: 1 desenvolvedor full-stack experiente
**Impacto**: Transformação de MVP em sistema production-ready