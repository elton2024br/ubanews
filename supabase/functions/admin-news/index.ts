import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Edge function handling administrative news operations
// Uses service role key stored in environment variables and verifies user role
serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Verify authenticated user
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role, is_active')
    .eq('id', authData.user.id)
    .single();

  if (!adminUser || !adminUser.is_active) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const body = await req.json();
  const { action, id, data } = body as { action: string; id?: string; data?: Record<string, unknown> };

  let result;
  switch (action) {
    case 'create':
      if (!['admin', 'editor'].includes(adminUser.role)) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }
      result = await supabase.from('admin_news').insert(data);
      break;
    case 'update':
      if (!id) {
        return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
      }
      if (!['admin', 'editor'].includes(adminUser.role)) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }
      result = await supabase.from('admin_news').update(data).eq('id', id);
      break;
    case 'delete':
      if (!id) {
        return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
      }
      if (adminUser.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }
      result = await supabase.from('admin_news').delete().eq('id', id);
      break;
    default:
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  }

  if (result.error) {
    return new Response(JSON.stringify({ error: result.error.message }), { status: 400 });
  }

  return new Response(JSON.stringify(result.data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});
