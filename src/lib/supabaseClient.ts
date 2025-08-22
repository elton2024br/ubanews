import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          name: string;
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
          name: string;
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
          name?: string;
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
          details: Record<string, any>;
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
          details: Record<string, any>;
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
          details?: Record<string, any>;
          ip_address?: string;
          user_agent?: string;
          created_at?: string;
        };
      };
    };
  };
};