import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createRateLimitedSupabaseClient } from '@/utils/rateLimiter';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logs para verificar se as variáveis estão sendo carregadas
console.log('[SupabaseClient] DEBUG - Verificando variáveis de ambiente:');
console.log('[SupabaseClient] VITE_SUPABASE_URL:', supabaseUrl ? 'DEFINIDA' : 'UNDEFINED');
console.log('[SupabaseClient] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'DEFINIDA (length: ' + supabaseAnonKey?.length + ')' : 'UNDEFINED');
console.log('[SupabaseClient] import.meta.env:', import.meta.env);

if (!supabaseUrl) {
  console.error('[SupabaseClient] ERRO: VITE_SUPABASE_URL não está definida!');
}
if (!supabaseAnonKey) {
  console.error('[SupabaseClient] ERRO: VITE_SUPABASE_ANON_KEY não está definida!');
}

let supabase: SupabaseClient<Database>;

// Função para criar cliente com configurações robustas
const createSupabaseClient = (url: string, key: string) => {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Configurações para melhor tratamento de erros de rede
      flowType: 'pkce',
      debug: import.meta.env.VITE_DEBUG_MODE === 'true'
    },
    global: {
      // Configurações de fetch com retry e timeout
      fetch: async (url, options = {}) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const fetchWithRetry = async (retries = 3): Promise<Response> => {
          try {
            const response = await fetch(url, {
              ...options,
              signal: controller.signal,
              headers: {
                ...options.headers,
                'Cache-Control': 'no-cache',
              },
            });
            
            clearTimeout(timeoutId);
            
            // Se a resposta não for ok e ainda temos tentativas, retry
            if (!response.ok && retries > 0) {
              console.warn(`[Supabase] Request failed, retrying... (${retries} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
              return fetchWithRetry(retries - 1);
            }
            
            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            
            // Se é erro de rede e ainda temos tentativas, retry
            if (retries > 0 && (error instanceof TypeError || error.name === 'AbortError')) {
              console.warn(`[Supabase] Network error, retrying... (${retries} attempts left):`, error.message);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
              return fetchWithRetry(retries - 1);
            }
            
            throw error;
          }
        };
        
        return fetchWithRetry();
      }
    }
  });
};

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[SupabaseClient] ERRO CRÍTICO: Variáveis de ambiente não encontradas!');
  console.error('[SupabaseClient] Verifique se o arquivo .env existe e contém:');
  console.error('[SupabaseClient] - VITE_SUPABASE_URL');
  console.error('[SupabaseClient] - VITE_SUPABASE_ANON_KEY');
  throw new Error('Supabase environment variables are required');
} else {
  console.log('[SupabaseClient] Criando cliente Supabase com variáveis válidas');
  const baseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  
  // Aplicar rate limiting ao cliente Supabase
  supabase = createRateLimitedSupabaseClient(baseClient);
  
  // Adicionar listener para erros de autenticação
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('[Supabase] Token refreshed successfully');
    } else if (event === 'SIGNED_OUT') {
      console.log('[Supabase] User signed out');
    }
  });
  
  console.log('[SupabaseClient] Cliente Supabase criado com sucesso com rate limiting');
}

export { supabase };

// Database types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'admin' | 'columnist' | 'editor';
          avatar: string | null;
          created_at: string;
          updated_at: string;
          last_login: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          role: 'admin' | 'columnist' | 'editor';
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: 'admin' | 'columnist' | 'editor';
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          is_active?: boolean;
        };
      };
      admin_news: {
        Row: {
          id: string;
          title: string;
          content: string;
          excerpt: string;
          author_id: string;
          category: string;
          tags: string[];
          image_src: string;
          image_alt: string;
          image_caption: string | null;
          status: 'draft' | 'pending' | 'published' | 'archived';
          featured: boolean;
          created_at: string;
          updated_at: string;
          published_at: string | null;
          read_time: number;
          views: number;
          likes: number;
          shares: number;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          excerpt: string;
          author_id: string;
          category: string;
          tags: string[];
          image_src: string;
          image_alt: string;
          image_caption?: string | null;
          status?: 'draft' | 'pending' | 'published' | 'archived';
          featured?: boolean;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          read_time?: number;
          views?: number;
          likes?: number;
          shares?: number;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          excerpt?: string;
          author_id?: string;
          category?: string;
          tags?: string[];
          image_src?: string;
          image_alt?: string;
          image_caption?: string | null;
          status?: 'draft' | 'pending' | 'published' | 'archived';
          featured?: boolean;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          read_time?: number;
          views?: number;
          likes?: number;
          shares?: number;
        };
      };
      permissions: {
        Row: {
          id: string;
          name: string;
          description: string;
          resource: string;
          action: 'create' | 'read' | 'update' | 'delete' | 'publish' | 'archive';
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          resource: string;
          action: 'create' | 'read' | 'update' | 'delete' | 'publish' | 'archive';
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          resource?: string;
          action?: 'create' | 'read' | 'update' | 'delete' | 'publish' | 'archive';
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          resource: string;
          resource_id: string;
          details: Record<string, unknown>;
          ip_address: string;
          user_agent: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          resource: string;
          resource_id: string;
          details: Record<string, unknown>;
          ip_address: string;
          user_agent: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          resource?: string;
          resource_id?: string;
          details?: Record<string, unknown>;
          ip_address?: string;
          user_agent?: string;
          created_at?: string;
        };
      };
      web_vitals: {
        Row: {
          id: string;
          name: string;
          value: number;
          rating: string;
          delta: number | null;
          url: string | null;
          navigation_type: string | null;
          user_agent: string | null;
          connection_type: string | null;
          is_mobile: boolean | null;
          screen_width: number | null;
          screen_height: number | null;
          device_pixel_ratio: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          value: number;
          rating: string;
          delta?: number | null;
          url?: string | null;
          navigation_type?: string | null;
          user_agent?: string | null;
          connection_type?: string | null;
          is_mobile?: boolean | null;
          screen_width?: number | null;
          screen_height?: number | null;
          device_pixel_ratio?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          value?: number;
          rating?: string;
          delta?: number | null;
          url?: string | null;
          navigation_type?: string | null;
          user_agent?: string | null;
          connection_type?: string | null;
          is_mobile?: boolean | null;
          screen_width?: number | null;
          screen_height?: number | null;
          device_pixel_ratio?: number | null;
          created_at?: string;
        };
      };
      web_vital_alerts: {
        Row: {
          id: number;
          vital_id: string;
          metric_name: string;
          metric_value: number;
          threshold: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          vital_id: string;
          metric_name: string;
          metric_value: number;
          threshold: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          vital_id?: string;
          metric_name?: string;
          metric_value?: number;
          threshold?: number;
          created_at?: string;
        };
      };
    };
  };
};