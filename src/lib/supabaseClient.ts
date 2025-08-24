import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient<Database>;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables; using mock client');
  supabase = createClient('https://localhost', 'anon-key');
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
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
      site_settings: {
        Row: {
          id: string;
          site_name: string;
          logo_url: string | null;
          feature_flags: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_name: string;
          logo_url?: string | null;
          feature_flags?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_name?: string;
          logo_url?: string | null;
          feature_flags?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
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