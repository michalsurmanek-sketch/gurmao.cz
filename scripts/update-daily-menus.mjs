import crypto from 'node:crypto';

const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const LIMIT = Math.max(1, Number(process.env.MENU_UPDATE_LIMIT || 100));

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Chybí SUPABASE_URL nebo SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json'
};

function todayPrague() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

function cleanText(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function selectMenuSection(text) {
  const lines = text.split('\n').map(v => v.trim()).filter(Boolean);
  const start = lines.findIndex(line => /denn[ií]\s+menu|poledn[ií]\s+menu|menu\s+dne|ob[eě]dov[eé]\s+menu/i.test(line));
  if (start < 0) return '';
  return lines.slice(start, start + 45).join('\n').slice(0, 7000);
}

function getRestaurantUrl(row) {
  const candidates = [row.menu_url, row.daily_menu_url, row.website_url, row.web_url, row.website, row.url];
  return candidates.find(value => /^https?:\/\//i.test(String(value || '').trim())) || '';
}

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

async function loadRestaurants() {
  return supabase(`restaurants?select=*&order=id.asc&limit=${LIMIT}`);
}

async function fetchMenu(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'GURMAO-menu-bot/1.0 (+https://gurmao.cz)' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html') && !type.includes('text/plain')) return '';
    return selectMenuSection(cleanText(await response.text()));
  } finally {
    clearTimeout(timeout);
  }
}

async function saveMenu(row, sourceUrl, menuText) {
  const body = {
    restaurant_id: row.id,
    menu_date: todayPrague(),
    source_url: sourceUrl,
    source_type: 'website',
    menu_text: menuText,
    content_hash: crypto.createHash('sha256').update(menuText).digest('hex'),
    fetched_at: new Date().toISOString(),
    status: 'published'
  };

  await supabase('daily_menus?on_conflict=restaurant_id,menu_date', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(body)
  });
}

const restaurants = await loadRestaurants();
let checked = 0;
let updated = 0;
let skipped = 0;
let failed = 0;

for (const restaurant of restaurants) {
  const url = getRestaurantUrl(restaurant);
  if (!url) { skipped++; continue; }
  checked++;
  try {
    const menu = await fetchMenu(url);
    if (!menu || menu.length < 40) { skipped++; continue; }
    await saveMenu(restaurant, url, menu);
    updated++;
    console.log(`✓ ${restaurant.name || restaurant.id}`);
  } catch (error) {
    failed++;
    console.warn(`✗ ${restaurant.name || restaurant.id}: ${error.message}`);
  }
}

console.log(JSON.stringify({ date: todayPrague(), restaurants: restaurants.length, checked, updated, skipped, failed }, null, 2));
