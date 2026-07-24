const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const LIMIT = Math.max(1, Math.min(Number(process.env.MENU_DISCOVERY_LIMIT || 100), 500));
const RETRY_DAYS = Math.max(1, Number(process.env.MENU_DISCOVERY_RETRY_DAYS || 30));

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Chybí SUPABASE_URL nebo SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json'
};

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${text}`);
  return text.trim() ? JSON.parse(text) : null;
}

function absoluteUrl(value, base) {
  try {
    const url = new URL(value, base);
    return /^https?:$/.test(url.protocol) ? url.href : '';
  } catch { return ''; }
}

function scoreCandidate(url, label = '') {
  const value = `${url} ${label}`.toLowerCase();
  let score = 0;
  if (/denn[ií][-_ ]?menu|poledn[ií][-_ ]?menu|ob[eě]dov[eé][-_ ]?menu|menu[-_ ]?dne/.test(value)) score += 100;
  if (/j[ií]deln[ií][-_ ]?l[ií]stek|lunch|obed|oběd/.test(value)) score += 60;
  if (/(^|[\/_-])menu([\/_-]|$)/.test(value)) score += 45;
  if (/\.pdf(?:$|\?)/.test(url)) score += 20;
  if (/facebook|instagram|wolt|foodora|boltfood|menicka\.cz/.test(value)) score -= 200;
  return score;
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GURMAO-menu-discovery/1.0; +https://gurmao.cz)',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.2'
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html') && !type.includes('application/xhtml+xml')) return { html: '', finalUrl: response.url };
    return { html: await response.text(), finalUrl: response.url };
  } finally { clearTimeout(timeout); }
}

function extractLinks(html, baseUrl) {
  const links = [];
  const pattern = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const href = absoluteUrl(match[1], baseUrl);
    if (!href) continue;
    const label = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    links.push({ href, label, score: scoreCandidate(href, label) });
  }
  return links.sort((a, b) => b.score - a.score);
}

async function probeCommonPaths(website) {
  const base = new URL(website);
  const paths = [
    '/denni-menu','/denni-menu/','/poledni-menu','/poledni-menu/',
    '/obedove-menu','/obedove-menu/','/menu','/menu/','/jidelnicek','/jidelni-listek'
  ];
  for (const path of paths) {
    const url = new URL(path, base.origin).href;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
      clearTimeout(timeout);
      if (response.ok) return response.url;
    } catch {}
  }
  return '';
}

async function loadRestaurants() {
  const cutoff = new Date(Date.now() - RETRY_DAYS * 86400000).toISOString();
  const select = 'id,name,website,menu_url,menu_auto_enabled,menu_last_checked';
  const retryFilter = `or=(menu_last_checked.is.null,menu_last_checked.lt.${encodeURIComponent(cutoff)})`;
  return supabase(`restaurants?select=${select}&website=not.is.null&or=(menu_url.is.null,menu_url.eq.)&${retryFilter}&order=menu_last_checked.asc.nullsfirst&limit=${LIMIT}`);
}

async function patch(row, values) {
  await supabase(`restaurants?id=eq.${encodeURIComponent(row.id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(values)
  });
}

const rows = await loadRestaurants();
let found = 0, missing = 0, failed = 0;

for (const row of rows || []) {
  const website = String(row.website || '').trim();
  const checkedAt = new Date().toISOString();
  if (!/^https?:\/\//i.test(website)) {
    await patch(row, { menu_last_checked: checkedAt }).catch(() => {});
    missing++;
    continue;
  }
  try {
    const { html, finalUrl } = await fetchPage(website);
    let candidate = '';
    if (html) {
      const best = extractLinks(html, finalUrl).find(item => item.score >= 40);
      candidate = best?.href || '';
    }
    if (!candidate) candidate = await probeCommonPaths(finalUrl || website);
    if (!candidate || /menicka\.cz/i.test(candidate)) {
      await patch(row, { menu_last_checked: checkedAt });
      missing++;
      console.log(`– ${row.name}: menu nenalezeno`);
      continue;
    }
    await patch(row, { menu_url: candidate, menu_auto_enabled: true, menu_last_checked: null });
    found++;
    console.log(`✓ ${row.name}: ${candidate}`);
  } catch (error) {
    await patch(row, { menu_last_checked: checkedAt }).catch(() => {});
    failed++;
    console.warn(`✗ ${row.name}: ${error.message}`);
  }
}

console.log(JSON.stringify({ processed: rows?.length || 0, found, missing, failed }, null, 2));
if (failed > 0 && found === 0 && missing === 0) process.exitCode = 2;
