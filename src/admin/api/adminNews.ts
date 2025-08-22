import { supabase } from '../../../supabase/config';

// Helper functions to call server-side edge function for admin news operations
export async function createNews(data: Record<string, unknown>) {
  return await supabase.functions.invoke('admin-news', {
    body: { action: 'create', data }
  });
}

export async function updateNews(id: string, data: Record<string, unknown>) {
  return await supabase.functions.invoke('admin-news', {
    body: { action: 'update', id, data }
  });
}

export async function deleteNews(id: string) {
  return await supabase.functions.invoke('admin-news', {
    body: { action: 'delete', id }
  });
}
