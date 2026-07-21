import { fetchOfficialHtml, isSafePublicUrl } from './restaurant-content-suggestions.mjs';

const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugify(value) {
  return normalizeName(value).replace(/\s+/g, '-').slice(0, 180);
}

function cleanText(value, max = 1000) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) || null;
}

function asArray(value) {
  return value == null ? [] : Array.isArray(value) ? value : [value];
}

function hasType(value, expected) {
  return asArray(value).some((item) => String(item).toLowerCase() === expected.toLowerCase());
}

function isChefTitle(value) {
  return /(?:šéf|sef|head|executive|sous)?\s*(?:chef|kuchař|kuchar|cook)/i.test(String(value || ''));
}

function absoluteSafeUrl(value, baseUrl) {
  try {
    const url = new URL(String(value || ''), baseUrl).href;
    return isSafePublicUrl(url) ? url : null;
  } catch {
    return null;
  }
}

function socialLinks(person, baseUrl) {
  const links = asArray(person.sameAs).map((url) => absoluteSafeUrl(url, baseUrl)).filter(Boolean);
  const find = (host) => links.find((url) => new URL(url).hostname.toLowerCase().includes(host)) || null;
  return {
    instagram_url: find('instagram.com'),
    tiktok_url: find('tiktok.com'),
    facebook_url: find('facebook.com'),
    youtube_url: find('youtube.com') || find('youtu.be')
  };
}

function imageUrl(person, baseUrl) {
  const image = typeof person.image === 'object' ? person.image?.url || person.image?.contentUrl : person.image;
  const url = absoluteSafeUrl(image, baseUrl);
  return url && new URL(url).protocol === 'https:' ? url : null;
}

function personCandidate(person, context, baseUrl, restaurant) {
  if (!person || typeof person !== 'object' || !hasType(person['@type'], 'Person')) return null;
  const name = cleanText(person.name, 160);
  if (!name || name.split(/\s+/).length < 2) return null;
  const title = cleanText(person.jobTitle, 160);
  const explicitChef = context === 'chef';
  if (!explicitChef && !isChefTitle(title)) return null;
  const normalizedName = normalizeName(name);
  if (!normalizedName) return null;

  return {
    restaurant_id: restaurant.id,
    normalized_name: normalizedName,
    name,
    proposed_slug: slugify(name),
    source_url: baseUrl,
    bio: cleanText(person.description, 1500),
    vibe: null,
    signature_style: title,
    image_url: imageUrl(person, baseUrl),
    ...socialLinks(person, baseUrl),
    confidence: explicitChef ? 0.95 : 0.85,
    evidence: explicitChef ? 'Oficiální web uvádí osobu ve strukturovaném poli chef.' : `Oficiální web uvádí profesi: ${title}`,
    raw_source: { type: person['@type'], name: person.name, jobTitle: person.jobTitle, source: baseUrl }
  };
}

function walkJson(value, context, baseUrl, restaurant, results) {
  if (Array.isArray(value)) {
    value.forEach((item) => walkJson(item, context, baseUrl, restaurant, results));
    return;
  }
  if (!value || typeof value !== 'object') return;

  const candidate = personCandidate(value, context, baseUrl, restaurant);
  if (candidate) results.push(candidate);

  for (const [key, child] of Object.entries(value)) {
    const nextContext = key.toLowerCase() === 'chef' ? 'chef' : context;
    walkJson(child, nextContext, baseUrl, restaurant, results);
  }
}

export function extractChefCandidates(html, pageUrl, restaurant) {
  const results = [];
  const scriptPattern = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    try {
      walkJson(JSON.parse(match[1]), '', pageUrl, restaurant, results);
    } catch {
      // Neplatný JSON-LD přeskočíme; nic nedohadujeme z volného textu.
    }
  }
  return [...new Map(results.map((item) => [item.normalized_name, item])).values()];
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer || '',
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

function parseArgs(argv) {
  const options = { limit: 50, restaurantId: null, stage: false };
  for (const arg of argv) {
    if (arg === '--stage') options.stage = true;
    else if (arg.startsWith('--limit=')) options.limit = Math.max(1, Math.min(500, Number(arg.slice(8)) || 50));
    else if (arg.startsWith('--restaurant-id=')) options.restaurantId = arg.slice(16);
  }
  return options;
}

export async function discoverChefs(options = {}) {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Chybí SUPABASE_URL nebo SUPABASE_SERVICE_ROLE_KEY.');
  const filters = [
    'select=id,name,website',
    'website=not.is.null',
    'order=created_at.desc',
    `limit=${options.limit || 50}`
  ];
  if (options.restaurantId) filters.push(`id=eq.${encodeURIComponent(options.restaurantId)}`);
  const restaurants = await supabaseRequest(`restaurants?${filters.join('&')}`);
  const existingChefs = await supabaseRequest('chefs?select=id,name,restaurant_id&limit=5000');
  const existingByName = new Map((existingChefs || []).map((chef) => [`${chef.restaurant_id}:${normalizeName(chef.name)}`, chef.id]));
  const candidates = [];

  for (const restaurant of restaurants || []) {
    const page = await fetchOfficialHtml(restaurant.website);
    if (!page) continue;
    for (const candidate of extractChefCandidates(page.html, page.url, restaurant)) {
      const duplicate = existingByName.get(`${restaurant.id}:${candidate.normalized_name}`) || null;
      candidate.duplicate_chef_id = duplicate;
      candidate.candidate_status = duplicate ? 'probable_duplicate' : 'new';
      candidates.push(candidate);
    }
  }

  if (options.stage && candidates.length) {
    await supabaseRequest('chef_import_candidates?on_conflict=restaurant_id,normalized_name,source_url', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=minimal',
      body: JSON.stringify(candidates)
    });
  }
  return { restaurants_checked: restaurants?.length || 0, candidates, staged: options.stage };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await discoverChefs(parseArgs(process.argv.slice(2)));
  console.log(JSON.stringify({
    restaurants_checked: result.restaurants_checked,
    candidates_found: result.candidates.length,
    staged: result.staged,
    candidates: result.candidates.map(({ raw_source, ...candidate }) => candidate)
  }, null, 2));
}
