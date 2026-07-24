import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
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

function decodeHtml(value) {
  return String(value || '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ndash;|&#8211;/gi, '–')
    .replace(/&mdash;|&#8212;/gi, '—');
}

function cleanText(value) {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/li>|<\/tr>|<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function selectMenuSection(text) {
  const normalized = cleanText(text);
  const lines = normalized.split('\n').map(value => value.trim()).filter(Boolean);
  const patterns = [
    /denn[ií]\s+menu/i,
    /poledn[ií]\s+menu/i,
    /ob[eě]dov[eé]\s+menu/i,
    /menu\s+dne/i,
    /t[yý]denn[ií]\s+menu/i,
    /dne[sš]n[ií]\s+nab[ií]dka/i,
    /pond[eě]l[ií]|[uú]ter[yý]|st[rř]eda|[cč]tvrtek|p[aá]tek/i
  ];
  const start = lines.findIndex(line => patterns.some(pattern => pattern.test(line)));
  if (start < 0) return normalized.slice(0, 12000);
  return lines.slice(start, start + 100).join('\n').slice(0, 16000);
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

function findPdfUrl(html, pageUrl) {
  const candidates = [];
  const patterns = [
    /(?:href|src|data)\s*=\s*["']([^"']+\.pdf(?:\?[^"']*)?)["']/gi,
    /https?:\/\/[^\s"'<>]+\.pdf(?:\?[^\s"'<>]*)?/gi
  ];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const value = decodeHtml(match[1] || match[0]);
      try {
        const resolved = new URL(value, pageUrl).href;
        if (!candidates.includes(resolved)) candidates.push(resolved);
      } catch {}
    }
  }
  return candidates.find(url => /menu|jideln|poledn|ob[eě]d|tyden/i.test(url)) || candidates[0] || '';
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

async function fetchWithTimeout(url, accept) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GURMAO-menu-bot/1.2; +https://gurmao.cz)',
        Accept: accept || 'text/html,application/pdf,text/plain;q=0.9,*/*;q=0.2'
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function extractPdfText(buffer) {
  const folder = await mkdtemp(join(tmpdir(), 'gurmao-menu-'));
  const input = join(folder, 'menu.pdf');
  const output = join(folder, 'menu.txt');
  try {
    await writeFile(input, buffer);
    await execFileAsync('pdftotext', ['-layout', '-enc', 'UTF-8', input, output], { timeout: 30000 });
    return cleanText(await readFile(output, 'utf8'));
  } catch (error) {
    throw new Error(`PDF se nepodařilo přečíst: ${error.message}`);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
}

async function fetchMenu(url, depth = 0) {
  if (depth > 2) throw new Error('Příliš mnoho přesměrování mezi stránkou a PDF');
  const response = await fetchWithTimeout(url);
  const finalUrl = response.url || url;
  const type = (response.headers.get('content-type') || '').toLowerCase();
  const looksLikePdf = type.includes('application/pdf') || /\.pdf(?:$|\?)/i.test(finalUrl);

  if (looksLikePdf) {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 100) throw new Error('Stažené PDF je prázdné');
    const text = await extractPdfText(buffer);
    return { text: selectMenuSection(text), sourceUrl: finalUrl, sourceType: 'pdf' };
  }

  if (!type.includes('text/html') && !type.includes('text/plain') && type) {
    throw new Error(`Nepodporovaný typ: ${type}`);
  }

  const html = await response.text();
  const pdfUrl = findPdfUrl(html, finalUrl);
  if (pdfUrl) return fetchMenu(pdfUrl, depth + 1);
  return { text: selectMenuSection(html), sourceUrl: finalUrl, sourceType: 'website' };
}

async function saveMenu(row, result) {
  const parsed = parseMenu(result.text);
  const body = {
    restaurant_id: row.id,
    menu_date: todayPrague(),
    source_url: result.sourceUrl,
    source_type: result.sourceType,
    soup: parsed.soup || null,
    mains: parsed.mains,
    desserts: parsed.desserts,
    drinks: parsed.drinks,
    raw_text: result.text,
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
    const result = await fetchMenu(url);
    await updateRestaurantChecked(restaurant.id);
    if (!result.text || result.text.length < 40) {
      skipped++;
      await updateQueue(restaurant.id, 'failed', 'Denní menu nebylo na stránce ani v PDF rozpoznáno');
      continue;
    }
    await saveMenu(restaurant, result);
    await updateQueue(restaurant.id, 'done');
    updated++;
    console.log(`✓ ${restaurant.name || restaurant.id} (${result.sourceType})`);
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
