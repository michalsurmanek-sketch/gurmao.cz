import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const LIMIT = Math.max(1, Number(process.env.MENU_UPDATE_LIMIT || 500));

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Chybí SUPABASE_URL nebo SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const apiHeaders = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json'
};

const DAYS = [
  { name: 'neděle', re: /ned[eě]le/i },
  { name: 'pondělí', re: /pond[eě]l[ií]/i },
  { name: 'úterý', re: /[uú]ter[yý]/i },
  { name: 'středa', re: /st[rř]eda/i },
  { name: 'čtvrtek', re: /[cč]tvrtek/i },
  { name: 'pátek', re: /p[aá]tek/i },
  { name: 'sobota', re: /sobota/i }
];

const NOISE_PATTERNS = [
  /^(?:alergeny?|allergens?|seznam\s+alergenů|list\s+of\s+allergens?)\b/i,
  /^(?:obiloviny|korýši|vejce|ryby|podzemnice|sójov[eé]\s+boby|ml[eé]ko|skoř[aá]pkov[eé]\s+plody|celer|hořčice|sezamov[aá]\s+semena|oxid\s+siřičit[yý]|vlčí\s+bob|měkk[yý]ši)\b/i,
  /^(?:cereals?\s+containing\s+gluten|crustaceans?|eggs?|fish|peanuts?|soybeans?|milk|nuts?|celery|mustard|sesame\s+seeds?|sulphur\s+dioxide|sulf(?:ur|ite)|lupines?|molluscs?)\b/i,
  /hmotnost\s+masa\s+v\s+syrov[eé]m\s+stavu/i,
  /gram[aá]ž\s+masa\s+je\s+uvedena/i,
  /zm[eě]na\s+j[ií]deln[ií]ho\s+l[ií]stku\s+vyhrazena/i,
  /telefon|rezervace|www\.|https?:|facebook|instagram|otev[ií]rac|kontakt|adresa|provozn[ií]\s+doba/i,
  /dobrou\s+chuť|přejeme\s+v[aá]m/i,
  /^(?:česk[eé]\s+speciality|czech\s+specialties|hlavn[ií]\s+j[ií]dla|main\s+courses?|hotov[aá]\s+j[ií]dla|speciality|nab[ií]dka)\s*$/i
];

const ENGLISH_TRANSLATION = /\b(?:sirloin|beef|pork|chicken|turkey|duck|goose|lamb|veal|fish|salmon|trout|tuna|goulash|soup|broth|dumplings?|potato|rice|pasta|noodles|salad|cheese|cream|sauce|grilled|fried|roasted|baked|bread|vegetables?|dessert|cake|pancake)\b/i;
const FOOD_WORDS = /\b(?:hov[eě]z[ií]|vepřov|kuřec|krůt|kachn|hus|jehn[eě][cč]|telec|ryb|losos|pstruh|tuň[aá]k|gul[aá]š|sv[ií][cč]kov|řízek|r[ií]zek|steak|burger|těstovin|špaget|rizoto|knedl[ií]k|brambor|r[yý]ž|om[aá][cč]k|sal[aá]t|smažen|pečen|grilovan|dušen|plněn|vývar|pol[eé]vk|kr[eé]m|dezert|kol[aá][cč]|buch|pala[cč]ink)\b/i;

function pragueDate() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

function pragueWeekday() {
  const value = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Prague', weekday: 'short' }).format(new Date());
  return ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 })[value] ?? new Date().getDay();
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
    .replace(/<\/(?:p|div|li|tr|h[1-6]|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function selectTodaySection(value) {
  const text = cleanText(value);
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  if (!lines.length) return '';

  const today = DAYS[pragueWeekday()];
  const dayStarts = [];
  for (let i = 0; i < lines.length; i++) {
    const found = DAYS.findIndex(day => day.re.test(lines[i]));
    if (found >= 0 && lines[i].length < 90) dayStarts.push({ index: i, day: found });
  }

  const todayStart = dayStarts.find(entry => entry.day === pragueWeekday());
  if (todayStart) {
    const next = dayStarts.find(entry => entry.index > todayStart.index);
    return lines.slice(todayStart.index, next?.index ?? Math.min(lines.length, todayStart.index + 60)).join('\n').slice(0, 14000);
  }

  const menuPatterns = [/denn[ií]\s+menu/i, /poledn[ií]\s+menu/i, /ob[eě]dov[eé]\s+menu/i, /menu\s+dne/i, /dne[sš]n[ií]\s+nab[ií]dka/i];
  const start = lines.findIndex(line => menuPatterns.some(pattern => pattern.test(line)));
  const selected = start >= 0 ? lines.slice(start, start + 100) : lines.slice(0, 100);
  return `${today.name}\n${selected.join('\n').slice(0, 14000)}`;
}

function stripAllergenCodes(value) {
  return String(value || '')
    .replace(/\s*[\/|]\s*\d{1,2}(?:\s*[,.;]\s*\d{1,2})*\s*[\/]?\s*$/g, '')
    .replace(/\s*\(\s*\d{1,2}(?:\s*[,.;]\s*\d{1,2})*\s*\)\s*$/g, '')
    .replace(/\s*[·•|]\s*$/g, '')
    .trim();
}

function parsePrice(line) {
  const match = line.match(/(?:^|\s|[·•|])(?:od\s*)?(\d{2,4}(?:[,.]\d{1,2})?)\s*(?:Kč|,-|CZK)\s*$/i);
  if (!match) return { name: stripAllergenCodes(line.trim()), price: '' };
  return {
    name: stripAllergenCodes(line.slice(0, match.index).replace(/[.\-–—·•|\s]+$/, '').trim()),
    price: `${match[1].replace('.', ',')} Kč`
  };
}

function normalizeItemName(value) {
  return stripAllergenCodes(String(value || '')
    .replace(/^\s*(?:menu|jídlo|jidlo|hlavní jídlo|hlavni jidlo)?\s*\d+\s*[.)\-:]\s*/i, '')
    .replace(/^[-•●▪*]+\s*/, '')
    .replace(/^\d{2,4}\s*g\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim());
}

function isNoise(line) {
  if (NOISE_PATTERNS.some(pattern => pattern.test(line))) return true;
  if (/^\d{1,2}(?:\s*[,.;]\s*\d{1,2}){1,12}$/.test(line)) return true;
  if (/^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ\s/]{3,80}$/.test(line) && !FOOD_WORDS.test(line)) return true;
  return false;
}

function looksEnglishTranslation(line) {
  if (!ENGLISH_TRANSLATION.test(line)) return false;
  if (/Kč|CZK|,-|\d{2,4}\s*g\b/i.test(line)) return false;
  const czechChars = (line.match(/[áčďéěíňóřšťúůýž]/gi) || []).length;
  return czechChars === 0;
}

function parseMenu(text) {
  const lines = text.split('\n').map(value => value.trim()).filter(Boolean);
  let soup = '';
  let expectSoup = false;
  const mains = [];
  const desserts = [];
  const drinks = [];
  const seen = new Set();

  for (const original of lines) {
    const line = normalizeItemName(original);
    if (!line || line.length < 4 || line.length > 350) continue;
    if (/denn[ií]\s+menu|poledn[ií]\s+menu|menu\s+dne|ob[eě]dov[eé]\s+menu/i.test(line)) continue;
    if (DAYS.some(day => day.re.test(line)) && line.length < 90) continue;
    if (isNoise(line) || looksEnglishTranslation(line)) continue;

    if (/^(?:pol[eé]vka|soup)\s*[:\-–—]?\s*$/i.test(line)) {
      expectSoup = true;
      continue;
    }

    const item = parsePrice(line);
    item.name = normalizeItemName(item.name);
    if (!item.name) continue;
    const key = item.name.toLocaleLowerCase('cs');
    if (seen.has(key)) continue;

    if (/^pol[eé]vka\b/i.test(line) || expectSoup) {
      const candidate = item.name.replace(/^pol[eé]vka\s*[:\-–—]?\s*/i, '').trim() || item.name;
      if (candidate.length >= 4 && !isNoise(candidate)) {
        soup = candidate + (item.price ? ` · ${item.price}` : '');
        seen.add(key);
      }
      expectSoup = false;
      continue;
    }

    const hasPrice = Boolean(item.price);
    const hasWeight = /\b\d{2,4}\s*g\b/i.test(line);
    const isNumbered = /^\s*(?:menu|j[ií]dlo)?\s*\d+\s*[.)\-:]/i.test(original);
    const looksLikeFood = FOOD_WORDS.test(item.name);

    if (/dezert|mou[cč]n[ií]k|z[aá]kusek|sladk[aá]|pala[cč]ink|dort/i.test(line)) desserts.push(item);
    else if (/n[aá]poj|limon[aá]da|k[aá]va|pivo|v[ií]no/i.test(line) && hasPrice) drinks.push(item);
    else if (hasPrice || hasWeight || isNumbered || looksLikeFood) mains.push(item);
    else continue;

    seen.add(key);
  }

  return {
    soup: soup.slice(0, 500),
    mains: mains.slice(0, 20),
    desserts: desserts.slice(0, 8),
    drinks: drinks.slice(0, 8)
  };
}

function menuQuality(parsed, rawText) {
  let score = 0;
  const pricedMains = parsed.mains.filter(item => item.price).length;
  if (parsed.soup) score += 2;
  score += Math.min(parsed.mains.length, 5) * 2;
  score += Math.min(pricedMains, 4);
  score += Math.min(parsed.desserts.length, 2);
  if (/Kč|CZK|,-/.test(rawText)) score += 2;
  if (/pol[eé]vka|menu|j[ií]dlo/i.test(rawText)) score += 1;
  if (parsed.mains.some(item => isNoise(item.name) || looksEnglishTranslation(item.name))) score -= 8;
  return score;
}

function findEmbeddedSource(html, pageUrl) {
  const candidates = [];
  const pattern = /(?:href|src|data)\s*=\s*["']([^"']+)["']/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      const url = new URL(decodeHtml(match[1]), pageUrl).href;
      const kind = /\.pdf(?:$|[?#])/i.test(url) ? 'pdf' : /\.(?:jpe?g|png|webp)(?:$|[?#])/i.test(url) ? 'image' : null;
      if (!kind) continue;
      let score = kind === 'pdf' ? 20 : 10;
      if (/menu|jideln|poledn|obed|tyden|lunch/i.test(url)) score += 40;
      candidates.push({ url, kind, score });
    } catch {}
  }
  return candidates.sort((a, b) => b.score - a.score)[0] || null;
}

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options, headers: { ...apiHeaders, ...(options.headers || {}) }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${text}`);
  return text.trim() ? JSON.parse(text) : null;
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      redirect: 'follow', signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GURMAO-menu-bot/2.1; +https://gurmao.cz)', Accept: 'text/html,application/pdf,image/*,text/plain;q=0.9,*/*;q=0.2' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } finally { clearTimeout(timeout); }
}

async function runTool(buffer, extension, command, argsBuilder, outputName) {
  const folder = await mkdtemp(join(tmpdir(), 'gurmao-menu-'));
  const input = join(folder, `input.${extension}`);
  const output = join(folder, outputName);
  try {
    await writeFile(input, buffer);
    await execFileAsync(command, argsBuilder(input, output), { timeout: 60000 });
    return cleanText(await readFile(output, 'utf8'));
  } finally { await rm(folder, { recursive: true, force: true }); }
}

async function extractPdf(buffer) {
  return runTool(buffer, 'pdf', 'pdftotext', (input, output) => ['-layout', '-enc', 'UTF-8', input, output], 'output.txt');
}

async function extractImage(buffer, extension = 'jpg') {
  return runTool(buffer, extension, 'tesseract', (input, output) => [input, output.replace(/\.txt$/, ''), '-l', 'ces+eng', '--psm', '6'], 'output.txt');
}

async function fetchMenu(url, depth = 0) {
  if (depth > 2) throw new Error('Příliš mnoho přesměrování mezi zdroji menu');
  const response = await fetchWithTimeout(url);
  const finalUrl = response.url || url;
  const type = (response.headers.get('content-type') || '').toLowerCase();
  const bytes = type.includes('text/') || type.includes('html') ? null : Buffer.from(await response.arrayBuffer());

  if (type.includes('application/pdf') || /\.pdf(?:$|[?#])/i.test(finalUrl)) {
    const raw = await extractPdf(bytes || Buffer.from(await response.arrayBuffer()));
    if (raw.length < 30) throw new Error('PDF neobsahuje čitelný text');
    return { text: selectTodaySection(raw), sourceUrl: finalUrl, sourceType: 'pdf' };
  }

  if (type.startsWith('image/') || /\.(?:jpe?g|png|webp)(?:$|[?#])/i.test(finalUrl)) {
    const extension = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
    const raw = await extractImage(bytes || Buffer.from(await response.arrayBuffer()), extension);
    if (raw.length < 30) throw new Error('Z obrázku se nepodařilo přečíst menu');
    return { text: selectTodaySection(raw), sourceUrl: finalUrl, sourceType: 'image' };
  }

  if (!type.includes('text/html') && !type.includes('text/plain') && type) throw new Error(`Nepodporovaný typ: ${type}`);
  const html = await response.text();
  const embedded = findEmbeddedSource(html, finalUrl);
  if (embedded) return fetchMenu(embedded.url, depth + 1);
  return { text: selectTodaySection(html), sourceUrl: finalUrl, sourceType: 'website' };
}

async function loadRestaurants() {
  return supabase(`restaurants?select=id,name,menu_url,website,menu_auto_enabled&menu_auto_enabled=eq.true&order=id.asc&limit=${LIMIT}`);
}

async function updateQueue(id, status, lastError = null) {
  const payload = {
    status, last_error: lastError,
    finished_at: ['done', 'failed'].includes(status) ? new Date().toISOString() : null,
    scheduled_for: status === 'done' ? new Date(Date.now() + 86400000).toISOString() : undefined
  };
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
  await supabase(`menu_import_queue?restaurant_id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(payload) }).catch(() => {});
}

async function saveMenu(restaurant, result, parsed) {
  const now = new Date().toISOString();
  await supabase('daily_menus?on_conflict=restaurant_id,menu_date', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      restaurant_id: restaurant.id, menu_date: pragueDate(), source_url: result.sourceUrl,
      source_type: result.sourceType, soup: parsed.soup || null, mains: parsed.mains,
      desserts: parsed.desserts, drinks: parsed.drinks, raw_text: result.text,
      ai_summary: null, imported_at: now, updated_at: now
    })
  });
  await supabase(`restaurants?id=eq.${encodeURIComponent(restaurant.id)}`, {
    method: 'PATCH', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ menu_last_checked: now, menu_source: result.sourceType })
  });
}

const restaurants = await loadRestaurants();
const stats = { date: pragueDate(), restaurants: restaurants.length, checked: 0, updated: 0, skipped: 0, failed: 0, sources: {} };

for (const restaurant of restaurants) {
  const url = [restaurant.menu_url, restaurant.website].find(value => /^https?:\/\//i.test(String(value || '')));
  if (!url) { stats.skipped++; await updateQueue(restaurant.id, 'failed', 'Chybí URL menu'); continue; }
  stats.checked++;
  await updateQueue(restaurant.id, 'processing');
  try {
    const result = await fetchMenu(url);
    const parsed = parseMenu(result.text);
    const quality = menuQuality(parsed, result.text);
    if (quality < 5 || parsed.mains.length === 0) throw new Error(`Menu nebylo dostatečně spolehlivě rozpoznáno (skóre ${quality})`);
    await saveMenu(restaurant, result, parsed);
    await updateQueue(restaurant.id, 'done');
    stats.updated++;
    stats.sources[result.sourceType] = (stats.sources[result.sourceType] || 0) + 1;
    console.log(`✓ ${restaurant.name || restaurant.id}: ${parsed.mains.length} jídel (${result.sourceType}, skóre ${quality})`);
  } catch (error) {
    stats.failed++;
    await updateQueue(restaurant.id, 'failed', error.message);
    console.warn(`✗ ${restaurant.name || restaurant.id}: ${error.message}`);
  }
}

console.log(JSON.stringify(stats, null, 2));
if (stats.failed > 0 && stats.updated === 0) process.exitCode = 2;
