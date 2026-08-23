import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = new Set(['https://gurmao.cz', 'https://www.gurmao.cz', 'http://localhost:3000', 'http://127.0.0.1:3000']);

function cors(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://gurmao.cz',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

Deno.serve(async req => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) });
  if (req.method !== 'POST') return json({ message: 'Method not allowed.' }, 405, origin);
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return json({ message: 'Požadavek nebyl přijat.' }, 403, origin);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = req.headers.get('authorization') || '';
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('delete-account: missing server configuration');
    return json({ message: 'Smazání účtu je dočasně nedostupné.' }, 503, origin);
  }
  if (!authorization.startsWith('Bearer ')) return json({ message: 'Je nutné se znovu přihlásit.' }, 401, origin);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json({ message: 'Relaci se nepodařilo ověřit. Přihlaste se znovu.' }, 401, origin);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}
  if (String(body.confirmation || '') !== 'DELETE') {
    return json({ message: 'Chybí potvrzení smazání účtu.' }, 400, origin);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const deletions: Array<[string, PromiseLike<{ error: { message?: string } | null }>]> = [
    ['saved_restaurants', admin.from('saved_restaurants').delete().eq('user_id', user.id)],
    ['ratings', admin.from('ratings').delete().eq('user_id', user.id)],
    ['reviews', admin.from('reviews').delete().eq('user_id', user.id)],
    ['profiles', admin.from('profiles').delete().eq('id', user.id)]
  ];

  if (user.email) deletions.push(['contact_messages', admin.from('contact_messages').delete().eq('email', user.email.toLowerCase())]);

  for (const [table, deletion] of deletions) {
    try {
      const { error } = await deletion;
      if (error) console.warn(`delete-account: ${table} cleanup failed`, error.message || error);
    } catch (error) {
      console.warn(`delete-account: ${table} cleanup threw`, error);
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('delete-account: auth deletion failed', deleteError.message);
    return json({ message: 'Účet se nepodařilo smazat. Zkuste to znovu.' }, 500, origin);
  }

  return json({ ok: true }, 200, origin);
});