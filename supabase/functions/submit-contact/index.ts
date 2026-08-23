import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = new Set([
  'https://gurmao.cz',
  'https://www.gurmao.cz',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);

const SUBJECTS = new Set(['obecne', 'restaurace', 'spoluprace', 'gdpr', 'jine']);
const burstWindow = new Map<string, number[]>();

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

function normalizedText(value: unknown, max: number) {
  return String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizedMessage(value: unknown) {
  return String(value ?? '').normalize('NFKC').replace(/\r\n/g, '\n').trim().slice(0, 5000);
}

function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function hash(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function clientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || 'unknown';
}

function isBursting(key: string) {
  const now = Date.now();
  const cutoff = now - 60_000;
  const recent = (burstWindow.get(key) || []).filter(timestamp => timestamp >= cutoff);
  if (recent.length >= 5) return true;
  recent.push(now);
  burstWindow.set(key, recent);
  if (burstWindow.size > 5000) {
    for (const [storedKey, times] of burstWindow) {
      if (!times.some(timestamp => timestamp >= cutoff)) burstWindow.delete(storedKey);
    }
  }
  return false;
}

Deno.serve(async req => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) });
  if (req.method !== 'POST') return json({ message: 'Method not allowed.' }, 405, origin);
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return json({ message: 'Požadavek nebyl přijat.' }, 403, origin);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const salt = Deno.env.get('CONTACT_RATE_LIMIT_SALT') || 'gurmao-contact-v1';
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('submit-contact: missing Supabase server configuration');
    return json({ message: 'Kontaktní formulář je dočasně nedostupný.' }, 503, origin);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ message: 'Neplatná data formuláře.' }, 400, origin);
  }

  const website = normalizedText(body.website, 200);
  if (website) return json({ ok: true }, 200, origin);

  const startedAt = Number(body.startedAt || 0);
  const elapsed = Date.now() - startedAt;
  if (!Number.isFinite(startedAt) || elapsed < 1800 || elapsed > 2 * 60 * 60 * 1000) {
    return json({ message: 'Formulář odešlete znovu.' }, 400, origin);
  }

  const name = normalizedText(body.name, 100);
  const email = normalizedText(body.email, 254).toLowerCase();
  const subject = normalizedText(body.subject, 40);
  const message = normalizedMessage(body.message);

  if (name.length < 2 || !validEmail(email) || !SUBJECTS.has(subject) || message.length < 10) {
    return json({ message: 'Zkontrolujte vyplněné údaje.' }, 400, origin);
  }

  const fingerprint = await hash(`${salt}:${clientIp(req)}`);
  if (isBursting(fingerprint)) return json({ message: 'Příliš mnoho pokusů. Zkuste to později.' }, 429, origin);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count, error: countError } = await admin
    .from('contact_messages')
    .select('id', { head: true, count: 'exact' })
    .eq('email', email)
    .gte('created_at', oneMinuteAgo);

  if (countError) {
    console.error('submit-contact rate check failed:', countError.message);
    return json({ message: 'Kontaktní formulář je dočasně nedostupný.' }, 503, origin);
  }
  if ((count || 0) >= 2) return json({ message: 'Příliš mnoho zpráv. Zkuste to za chvíli.' }, 429, origin);

  const { error } = await admin.from('contact_messages').insert({
    name,
    email,
    subject,
    message,
    status: 'new'
  });

  if (error) {
    console.error('submit-contact insert failed:', error.message);
    return json({ message: 'Zprávu se nepodařilo uložit.' }, 500, origin);
  }

  return json({ ok: true }, 200, origin);
});