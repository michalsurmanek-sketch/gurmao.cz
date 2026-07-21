import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const VIBES = Object.freeze({
  luxe: '🍷 LUXE',
  drama: '🔥 DRAMA',
  chaos: '🌮 CHAOS',
  pure: '🌿 PURE',
  dark: '🖤 DARK',
  calm: '🌊 CALM'
});

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function categoryDescription(candidate) {
  const category = normalizeText(candidate.category_label || candidate.category);
  if (includesAny(category, ['asian', 'asij'])) return 'asijská restaurace';
  if (includesAny(category, ['steak', 'gril', 'barbecue', 'maso'])) return 'restaurace zaměřená na maso a gril';
  if (includesAny(category, ['pizza', 'pizzer'])) return 'pizzerie';
  if (includesAny(category, ['burger'])) return 'burger restaurace';
  if (includesAny(category, ['vegan'])) return 'veganská restaurace';
  if (includesAny(category, ['vegetarian'])) return 'vegetariánská restaurace';
  if (includesAny(category, ['cafe', 'cafeteria', 'bistro'])) return 'bistro a občerstvení';
  if (includesAny(category, ['pub', 'gastropub', 'beer', 'piv'])) return 'restaurace a hospoda';
  return 'restaurace';
}

export function suggestCandidateContent(candidate) {
  const sourceText = normalizeText([
    candidate.name,
    candidate.category,
    candidate.category_label
  ].filter(Boolean).join(' '));

  let vibe = VIBES.calm;
  if (includesAny(sourceText, ['fine dining', 'luxury', 'luxe', 'boutique', 'hotel'])) vibe = VIBES.luxe;
  else if (includesAny(sourceText, ['street', 'fast food', 'burger', 'kebab', 'doner', 'food court', 'pizza'])) vibe = VIBES.chaos;
  else if (includesAny(sourceText, ['vegan', 'vegetarian', 'healthy', 'organic', 'bio ', 'salad'])) vibe = VIBES.pure;
  else if (includesAny(sourceText, ['steak', 'gril', 'barbecue', 'bbq', 'asian', 'mexican', 'tapas', 'spicy'])) vibe = VIBES.drama;
  else if (includesAny(sourceText, ['bar', 'pub', 'beer', 'piv', 'wine', 'vino', 'night'])) vibe = VIBES.dark;

  const name = String(candidate.name || 'Restaurace').trim();
  const city = String(candidate.city || '').trim();
  const address = String(candidate.address || '').trim();
  const website = String(candidate.website || '').trim();
  const location = city ? ` v ${city}` : '';
  const atAddress = address ? ` na adrese ${address}` : '';
  const websiteSentence = website
    ? ' Aktuální nabídku a otevírací dobu ověřte na oficiálním webu podniku.'
    : '';
  const description = `${name} je ${categoryDescription(candidate)}${location}${atAddress}.${websiteSentence}`
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);

  return { vibe, description };
}

function privateIpv4(address) {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || a >= 224;
}

function privateIp(address) {
  if (isIP(address) === 4) return privateIpv4(address);
  if (isIP(address) !== 6) return false;
  const normalized = address.toLowerCase();
  if (normalized === '::' || normalized === '::1' || /^(fc|fd|fe8|fe9|fea|feb)/.test(normalized)) return true;
  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mapped ? privateIpv4(mapped) : false;
}

export function isSafePublicUrl(value) {
  try {
    const url = new URL(String(value || ''));
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return false;
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return false;
    if (isIP(host) && privateIp(host)) return false;
    return true;
  } catch {
    return false;
  }
}

function decodeHtmlAttribute(value) {
  return String(value || '')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

export function extractOfficialImageUrl(html, pageUrl) {
  const patterns = [
    /<meta\b[^>]*(?:property|name)\s*=\s*["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["'][^>]*content\s*=\s*["']([^"']+)["'][^>]*>/i,
    /<meta\b[^>]*content\s*=\s*["']([^"']+)["'][^>]*(?:property|name)\s*=\s*["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["'][^>]*>/i,
    /<link\b[^>]*rel\s*=\s*["']image_src["'][^>]*href\s*=\s*["']([^"']+)["'][^>]*>/i
  ];
  for (const pattern of patterns) {
    const raw = pattern.exec(html)?.[1];
    if (!raw) continue;
    try {
      const url = new URL(decodeHtmlAttribute(raw), pageUrl).href;
      if (isSafePublicUrl(url) && new URL(url).protocol === 'https:') return url;
    } catch {
      // Zkusíme další metadata.
    }
  }
  return null;
}

async function publicDnsHost(hostname, lookupImpl) {
  if (isIP(hostname)) return !privateIp(hostname);
  try {
    const records = await lookupImpl(hostname, { all: true, verbatim: true });
    return records.length > 0 && records.every((record) => !privateIp(record.address));
  } catch {
    return false;
  }
}

async function readLimitedHtml(response, maxBytes = 750_000) {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let html = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    html += decoder.decode(value, { stream: true });
  }
  return html + decoder.decode();
}

export async function fetchOfficialImage(website, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const lookupImpl = options.lookupImpl || lookup;
  if (!isSafePublicUrl(website)) return null;
  let current = new URL(website);

  for (let redirect = 0; redirect <= 3; redirect += 1) {
    if (!(await publicDnsHost(current.hostname, lookupImpl))) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    let response;
    try {
      response = await fetchImpl(current, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': 'GURMAO metadata preview/1.0 (+https://gurmao.cz)'
        }
      });
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return null;
      try {
        current = new URL(location, current);
      } catch {
        return null;
      }
      if (!isSafePublicUrl(current)) return null;
      continue;
    }
    if (!response.ok) return null;
    const type = response.headers.get('content-type') || '';
    if (type && !type.includes('text/html') && !type.includes('application/xhtml+xml')) return null;
    const html = await readLimitedHtml(response);
    return html ? extractOfficialImageUrl(html, current) : null;
  }
  return null;
}

async function mapConcurrent(items, concurrency, worker) {
  let index = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      await worker(items[current], current);
    }
  });
  await Promise.all(runners);
}

export async function enrichCandidateSuggestions(candidates, options = {}) {
  const generatedAt = new Date().toISOString();
  for (const candidate of candidates) {
    const suggestion = suggestCandidateContent(candidate);
    candidate.suggested_vibe = suggestion.vibe;
    candidate.suggested_description = suggestion.description;
    candidate.suggested_image_url = null;
    candidate.suggestions_generated_at = generatedAt;
  }

  const withWebsite = candidates.filter((candidate) => candidate.website).slice(0, options.imageLimit ?? 50);
  await mapConcurrent(withWebsite, options.concurrency ?? 4, async (candidate) => {
    candidate.suggested_image_url = await fetchOfficialImage(candidate.website, options);
  });
  return candidates;
}
