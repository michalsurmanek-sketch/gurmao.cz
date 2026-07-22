import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];

type Interval = { open: string; close: string };
type Hours = Record<string, Interval[]>;

function emptyHours(): Hours {
  return { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const value = error as Record<string, unknown>;
    const parts = [value.message, value.details, value.hint, value.code]
      .filter(Boolean)
      .map(String);
    if (parts.length) return parts.join(' | ');
    try { return JSON.stringify(error); } catch { return 'Neznámá objektová chyba'; }
  }
  return String(error || 'Neznámá chyba');
}

function timeValue(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as { hour?: number; minute?: number };
  if (!Number.isInteger(item.hour) || item.hour! < 0 || item.hour! > 23) return null;
  const minute = Number.isInteger(item.minute) ? item.minute! : 0;
  if (minute < 0 || minute > 59) return null;
  return `${String(item.hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function normalizePeriods(periods: unknown): Hours {
  const result = emptyHours();
  if (!Array.isArray(periods)) return result;
  for (const period of periods) {
    const openDay = Number(period?.open?.day);
    const open = timeValue(period?.open);
    const close = timeValue(period?.close);
    if (!Number.isInteger(openDay) || openDay < 0 || openDay > 6 || !open || !close) continue;
    result[DAYS[openDay]].push({ open, close });
  }
  return result;
}

async function googleJson(url: string, apiKey: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      detail = parsed?.error?.message || parsed?.message || text;
    } catch {}
    throw new Error(`Google Places ${response.status}: ${detail}`);
  }
  return response.json();
}

async function findPlace(restaurant: any, apiKey: string) {
  if (restaurant.google_place_id) return restaurant.google_place_id;
  const textQuery = [restaurant.name, restaurant.address, restaurant.city, 'Česko'].filter(Boolean).join(', ');
  const data = await googleJson('https://places.googleapis.com/v1/places:searchText', apiKey, {
    method: 'POST',
    headers: { 'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress' },
    body: JSON.stringify({ textQuery, languageCode: 'cs', regionCode: 'CZ', maxResultCount: 1 }),
  });
  return data?.places?.[0]?.id || null;
}

async function loadHours(placeId: string, apiKey: string) {
  return googleJson(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=cs`, apiKey, {
    headers: { 'X-Goog-FieldMask': 'id,regularOpeningHours,currentOpeningHours' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!googleKey) throw new Error('Chybí secret GOOGLE_PLACES_API_KEY.');

    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user || user.app_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Pouze administrátor.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body.limit) || 10, 1), 25);
    const restaurantId = body.restaurant_id ? String(body.restaurant_id) : null;
    const refreshAll = Boolean(body.refresh_all);
    const service = createClient(supabaseUrl, serviceKey);

    let query = service.from('restaurants').select('id,name,address,city,google_place_id,opening_hours_verified_at').order('opening_hours_verified_at', { ascending: true, nullsFirst: true }).limit(limit);
    if (restaurantId) query = query.eq('id', restaurantId);
    else if (!refreshAll) query = query.is('opening_hours_verified_at', null);
    const { data: restaurants, error } = await query;
    if (error) throw error;

    const results = [];
    for (const restaurant of restaurants || []) {
      try {
        const placeId = await findPlace(restaurant, googleKey);
        if (!placeId) {
          results.push({ id: restaurant.id, name: restaurant.name, status: 'not_found' });
          continue;
        }
        const place = await loadHours(placeId, googleKey);
        const periods = place?.regularOpeningHours?.periods || place?.currentOpeningHours?.periods || [];
        const openingHours = normalizePeriods(periods);
        const { error: updateError } = await service.from('restaurants').update({
          google_place_id: placeId,
          opening_hours: openingHours,
          opening_hours_source: 'google',
          opening_hours_verified_at: new Date().toISOString(),
        }).eq('id', restaurant.id);
        if (updateError) throw updateError;
        results.push({ id: restaurant.id, name: restaurant.name, status: periods.length ? 'updated' : 'no_hours', place_id: placeId });
      } catch (itemError) {
        results.push({ id: restaurant.id, name: restaurant.name, status: 'error', error: errorMessage(itemError) });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: errorMessage(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});