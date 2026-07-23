const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const LIMIT = Math.max(1, Number(process.env.RESTAURANT_DATA_UPDATE_LIMIT || 300));

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Chybí SUPABASE_URL nebo SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json'
};

const dayAliases = {
  monday: 'mon', pondeli: 'mon', pondělí: 'mon', mon: 'mon',
  tuesday: 'tue', utery: 'tue', úterý: 'tue', tue: 'tue',
  wednesday: 'wed', streda: 'wed', středa: 'wed', wed: 'wed',
  thursday: 'thu', ctvrtek: 'thu', čtvrtek: 'thu', thu: 'thu',
  friday: 'fri', patek: 'fri', pátek: 'fri', fri: 'fri',
  saturday: 'sat', sobota: 'sat', sat: 'sat',
  sunday: 'sun', nedele: 'sun', neděle: 'sun', sun: 'sun'
};

function cleanText(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDay(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function normalizeHours(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/closed|zavreno|zavřeno/i.test(text)) return 'closed';
  return text
    .replace(/\s*(?:to|až|az)\s*/gi, '-')
    .replace(/[–—]/g, '-')
    .replace(/(\d{1,2})\.(\d{2})/g, '$1:$2')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*-\s*/g, '-')
    .trim()
    .slice(0, 80);
}

function parseOpeningHoursSpecification(specification) {
  const result = {};
  const items = Array.isArray(specification) ? specification : [specification];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const opens = String(item.opens || '').trim();
    const closes = String(item.closes || '').trim();
    const days = Array.isArray(item.dayOfWeek) ? item.dayOfWeek : [item.dayOfWeek];
    const interval = opens && closes ? `${opens}-${closes}` : 'closed';
    for (const day of days) {
      const key = dayAliases[normalizeDay(String(day).split('/').pop())];
      if (!key) continue;
      result[key] = result[key] ? `${result[key]}, ${interval}` : interval;
    }
  }
  return result;
}

function parseOpeningHoursArray(value) {
  const result = {};
  const lines = Array.isArray(value) ? value : [value];
  for (const line of lines) {
    const match = String(line || '').match(/^\s*([^:]+):\s*(.+)$/);
    if (!match) continue;
    const key = dayAliases[normalizeDay(match[1])];
    if (key) result[key] = normalizeHours(match[2]);
  }
  return result;
}

function restaurantJsonLd(html) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const candidates = [];
  for (const match of scripts) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length) {
        const item = queue.shift();
        if (!item || typeof item !== 'object') continue;
        if (Array.isArray(item['@graph'])) queue.push(...item['@graph']);
        const type = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
        if (type.some(v => /Restaurant|FoodEstablishment|LocalBusiness/i.test(String(v)))) candidates.push(item);
      }
    } catch {}
  }
  return candidates[0] || null;
}

function extractData(html) {
  const json = restaurantJsonLd(html);
  if (!json) return null;
  let openingHours = {};
  if (json.openingHoursSpecification) openingHours = parseOpeningHoursSpecification(json.openingHoursSpecification);
  if (!Object.keys(openingHours).length && json.openingHours) openingHours = parseOpeningHoursArray(json.openingHours);
  const addressObject = json.address && typeof json.address === 'object' ? json.address : {};
  const address = [addressObject.streetAddress, addressObject.postalCode, addressObject.addressLocality]
    .map(v => String(v || '').trim()).filter(Boolean).join(', ');
  const imageValue = Array.isArray(json.image) ? json.image[0] : (json.image?.url || json.image);
  const aggregate = json.aggregateRating && typeof json.aggregateRating === 'object' ? json.aggregateRating : {};
  return {
    opening_hours: openingHours,
    phone: String(json.telephone || '').trim(),
    address,
    image_url: String(imageValue || '').trim(),
    google_rating: Number(aggregate.ratingValue || 0) || null,
    google_review_count: Number(aggregate.reviewCount || aggregate.ratingCount || 0) || null
  };
}

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${body}`);
  return body.trim() ? JSON.parse(body) : null;
}

async function loadRestaurants() {
  const fields = 'id,name,website,data_auto_enabled,opening_hours_source,phone,address,image_url,google_rating,google_review_count';
  return supabase(`restaurants?select=${fields}&data_auto_enabled=eq.true&website=not.is.null&order=data_last_checked.asc.nullsfirst&limit=${LIMIT}`);
}

async function fetchWebsite(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GURMAO-data-bot/1.0; +https://gurmao.cz)',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.2'
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html') && !type.includes('application/xhtml+xml')) throw new Error(`Nepodporovaný typ ${type}`);
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function shouldReplace(existing, incoming) {
  return !String(existing || '').trim() && String(incoming || '').trim();
}

async function saveRestaurant(row, data) {
  const now = new Date().toISOString();
  const payload = {
    data_last_checked: now,
    data_sync_error: null,
    data_source: 'jsonld',
    data_confidence: Object.keys(data.opening_hours || {}).length ? 0.92 : 0.75
  };
  let changed = false;
  if (Object.keys(data.opening_hours || {}).length && !['owner', 'admin'].includes(row.opening_hours_source)) {
    payload.opening_hours = data.opening_hours;
    payload.opening_hours_source = 'website';
    payload.opening_hours_verified_at = now;
    changed = true;
  }
  if (shouldReplace(row.phone, data.phone)) { payload.phone = data.phone; changed = true; }
  if (shouldReplace(row.address, data.address)) { payload.address = data.address; changed = true; }
  if (shouldReplace(row.image_url, data.image_url)) { payload.image_url = data.image_url; changed = true; }
  if (!row.google_rating && data.google_rating) { payload.google_rating = data.google_rating; changed = true; }
  if (!row.google_review_count && data.google_review_count) { payload.google_review_count = data.google_review_count; changed = true; }
  if (changed) payload.data_last_updated = now;
  await supabase(`restaurants?id=eq.${encodeURIComponent(row.id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(payload)
  });
  return changed;
}

async function saveError(id, message) {
  await supabase(`restaurants?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      data_last_checked: new Date().toISOString(),
      data_sync_error: String(message || '').slice(0, 500)
    })
  });
}

const restaurants = await loadRestaurants();
let checked = 0, updated = 0, skipped = 0, failed = 0;
for (const restaurant of restaurants || []) {
  checked++;
  try {
    const html = await fetchWebsite(restaurant.website);
    const data = extractData(html);
    if (!data) {
      skipped++;
      await saveError(restaurant.id, 'Na webu nebyla nalezena strukturovaná Restaurant data.');
      continue;
    }
    const changed = await saveRestaurant(restaurant, data);
    if (changed) updated++; else skipped++;
    console.log(`${changed ? '✓' : '–'} ${restaurant.name || restaurant.id}`);
  } catch (error) {
    failed++;
    await saveError(restaurant.id, error.message).catch(() => {});
    console.warn(`✗ ${restaurant.name || restaurant.id}: ${error.message}`);
  }
}

console.log(JSON.stringify({ restaurants: restaurants?.length || 0, checked, updated, skipped, failed }, null, 2));
if (failed > 0 && updated === 0) process.exitCode = 2;
