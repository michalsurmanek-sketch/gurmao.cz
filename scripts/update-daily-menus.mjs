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
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/li>|<\/tr>|<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ndash;|&#8211;/gi, '–')
    .replace(/&mdash;|&#8212;/gi, '—')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function selectMenuSection(text) {
  const lines = text.split('\n').map(value => value.trim()).filter(Boolean);
  const patterns = [
    /denn[ií]\s+menu/i,
    /poledn[ií]\s+menu/i,
    /ob[eě]dov[eé]\s+menu/i,
    /menu\s+dne/i,
    /t[yý]denn[ií]\s+menu/i,
    /dne[sš]n[ií]\s+nab[ií]dka/i
  ];
  const start = lines.findIndex(line => patterns.some(pattern => pattern.test(line)));
  if (start < 0) return '';

  const selected = lines.slice(start, start + 70);
  return selected.join('\n').slice(0, 12000);
}

function parsePrice(line) {
  const match = line.match(/(?:^|\s)(\d{2,4}(?:[,.]\d{1,2})?)\s*(?:Kč|,-|CZK)\s*$/i);
  if (!match) return { name: line.trim(), price: '' };
  return {
    name: line.slice(0, match.index).replace(/[.\-–—\s]+$/, '').trim(),
    price: `${match[1].replace('.', ',')} Kč`
  };
}

function parseMenu(text) {
  const lines = text.split('\n').map(value => value.trim()).filter(Boolean);
  let soup = '';
  const mains = [];
  const desserts = [];
  const drinks = [];

  for (const originalLine of lines) {
    const line = originalLine.replace(/^[-•●▪*]+\s*/, '').trim();
    if (!line || line.length < 3) continue;
    if (/denn[ií]\s+menu|poledn[ií]\s+menu|menu\s+dne|ob[eě]dov[eé]\s+menu/i.test(line)) continue;
    if (/pond[eě]l[ií]|[uú]ter[yý]|st[rř]eda|[cč]tvrtek|p[aá]tek|sobota|ned[eě]le/i.test(line) && line.length < 35) continue;

    const item = parsePrice(line.replace(/^\d+[.)]\s*/, ''));
    if (!item.name) continue;

    if (/pol[eé]vka/i.test(line) && !soup) {
      soup = item.name.replace(/^pol[eé]vka\s*[:\-–—]?\s*/i, '').trim() || item.name;
      if (item.price) soup += ` · ${item.price}`;
      continue;
    }
    if (/dezert|mou[cč]n[ií]k|z[aá]kusek/i.test(line)) {
      desserts.push(item);
      continue;
    }
    if (/n[aá]poj|limon[aá]da|k[aá]va|pivo|v[ií]no/i.test(line) && item.price) {
      drinks.push(item);
      continue;
    }
    if (item.price || /^\d+[.)]/.test(originalLine) || line.length > 18) mains.push(item);
  }

  return {
    soup: soup.slice(0, 500),
    mains: mains.slice(0, 30),
    desserts: desserts.slice(0, 10),
    drinks: drinks.slice(0, 10)
  };
}

function getRestaurantUrl(row) {
  const candidates = [row.menu_url, row.website_url, row.web_url, row.website, row.url];
  return candidates.find(value => /^https?:\/\//i.test(String(value || '').trim())) || '';
}

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${text}`);
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Supabase vrátil neplatný JSON (${response.status}): ${error.message}`);
  }
}

async function loadRestaurants() {
  const select = 'id,name,menu_url,website,menu_auto_enabled';
  return supabase(`restaurants?select=${select}&menu_auto_enabled=eq.true&order=id.asc&limit=${LIMIT}`);
}

async function fetchMenu(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GURMAO-menu-bot/1.1; +https://gurmao.cz)',
        Accept: 'text/html,text/plain;q=0.9,*/*;q=0.2'
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html') && !type.includes('text/plain')) {
      throw new Error(`Nepodporovaný typ: ${type || 'neznámý'}`);
    }
    const text = cleanText(await response.text());
    return selectMenuSection(text);
  } finally {
    clearTimeout(timeout);
  }
}

async function saveMenu(row, sourceUrl, menuText) {
  const parsed = parseMenu(menuText);
  const body = {
    restaurant_id: row.id,
    menu_date: todayPrague(),
    source_url: sourceUrl,
    source_type: 'website',
    soup: parsed.soup || null,
    mains: parsed.mains,
    desserts: parsed.desserts,
    drinks: parsed.drinks,
    raw_text: menuText,
    ai_summary: null,
    imported_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  await supabase('daily_menus?on_conflict=restaurant_id,menu_date', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(body)
  });
}

async function updateRestaurantChecked(id) {
  await supabase(`restaurants?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ menu_last_checked: new Date().toISOString() })
  });
}

async function updateQueue(id, status, lastError = null) {
  try {
    const payload = {
      status,
      finished_at: ['done', 'failed'].includes(status) ? new Date().toISOString() : null,
      last_error: lastError,
      scheduled_for: status === 'done' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined
    };
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
    await supabase(`menu_import_queue?restaurant_id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.warn(`Frontu se nepodařilo aktualizovat: ${error.message}`);
  }
}

const restaurants = await loadRestaurants();
let checked = 0;
let updated = 0;
let skipped = 0;
let failed = 0;

for (const restaurant of restaurants) {
  const url = getRestaurantUrl(restaurant);
  if (!url) {
    skipped++;
    await updateQueue(restaurant.id, 'failed', 'Chybí menu_url nebo website');
    continue;
  }

  checked++;
  await updateQueue(restaurant.id, 'processing');
  try {
    const menu = await fetchMenu(url);
    await updateRestaurantChecked(restaurant.id);
    if (!menu || menu.length < 40) {
      skipped++;
      await updateQueue(restaurant.id, 'failed', 'Denní menu nebylo na stránce rozpoznáno');
      continue;
    }
    await saveMenu(restaurant, url, menu);
    await updateQueue(restaurant.id, 'done');
    updated++;
    console.log(`✓ ${restaurant.name || restaurant.id}`);
  } catch (error) {
    failed++;
    await updateRestaurantChecked(restaurant.id).catch(() => {});
    await updateQueue(restaurant.id, 'failed', error.message);
    console.warn(`✗ ${restaurant.name || restaurant.id}: ${error.message}`);
  }
}

console.log(JSON.stringify({
  date: todayPrague(),
  restaurants: restaurants.length,
  checked,
  updated,
  skipped,
  failed
}, null, 2));

if (failed > 0 && updated === 0) process.exitCode = 2;
