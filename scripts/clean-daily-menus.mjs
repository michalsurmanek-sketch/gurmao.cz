const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');

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

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${text}`);
  return text.trim() ? JSON.parse(text) : null;
}

function asItems(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.split('\n').map(name => ({ name: name.trim(), price: '' })).filter(item => item.name);
    }
  }
  return [];
}

const JUNK = [
  /^(?:obiloviny|korýši|korysi|vejce|ryby|podzemnice|s[oó]jov[eé]\s+boby|ml[eé]ko|skoř[aá]pkov[eé]\s+plody|celer|hořčice|horcice|sezam|oxid\s+siřičit[yý]|oxid\s+siricity|vl[cč][ií]\s+bob|m[eě]kk[yý]ši)/i,
  /\/(?:\s*)?(?:cereals|crustaceans|egg|fish|peanuts|soybeans|milk|nuts|celery|mustard|sesame|sulphites|lupines|molluscs)\b/i,
  /^(?:alergeny?|allergens?|seznam\s+alergenů|list\s+of\s+allergens?)\b/i,
  /hmotnost\s+masa\s+v\s+syrov[eé]m\s+stavu/i,
  /^(?:česk[eé]\s+speciality|czech\s+specialities|hotov[aá]\s+j[ií]dla|main\s+courses|pol[eé]vky|soups?)$/i,
  /^(?:sirloin in cream|beef goulash|bread dumplings|potato dumplings|chicken|pork|beef|salad|soup)\b/i,
  /telefon|rezervace|otev[ií]rac[ií]\s+doba|www\.|https?:|facebook|instagram/i
];

function cleanName(value) {
  return String(value || '')
    .replace(/\s*\/\s*\d+(?:\s*,\s*\d+)*\s*\/?\s*$/g, '')
    .replace(/\s*\((?:alergeny?|allergens?)?\s*\d+(?:\s*,\s*\d+)*\)\s*$/i, '')
    .replace(/^[-•●▪*\d.)\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(item) {
  if (typeof item === 'string') return { name: cleanName(item), price: '' };
  return {
    name: cleanName(item?.name || item?.title || item?.text || ''),
    price: String(item?.price || '').trim()
  };
}

function isUseful(item) {
  if (!item.name || item.name.length < 5 || item.name.length > 220) return false;
  if (JUNK.some(pattern => pattern.test(item.name))) return false;
  const hasPrice = /\d{2,4}(?:[,.]\d{1,2})?\s*(?:Kč|CZK|,-)/i.test(`${item.name} ${item.price}`);
  const foodWords = /kuř|kure|vepř|vepr|hověz|hovez|gul[aá]š|sv[ií][cč]kov|řízek|rizek|om[aá][cč]k|knedl|brambor|r[yý]ž|ryz|těstovin|testovin|sal[aá]t|smažen|smazen|pečen|pecen|gril|burger|pizza|tortill|rizoto|gnocchi|losos|tresk|kachn|krůt|krut|zelenin|sýr|syr|špaget|spaget|karban[aá]tek|sekan[aá]|výpečk|vypeck/i.test(item.name);
  return hasPrice || foodWords;
}

function cleanItems(value) {
  const seen = new Set();
  const result = [];
  for (const raw of asItems(value)) {
    const item = normalize(raw);
    if (!isUseful(item)) continue;
    const key = item.name.toLocaleLowerCase('cs');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result.slice(0, 20);
}

const date = todayPrague();
const menus = await supabase(`daily_menus?select=restaurant_id,menu_date,soup,mains,desserts,drinks&menu_date=eq.${date}&limit=5000`);
let changed = 0;
let removedJunk = 0;

for (const menu of menus || []) {
  const before = asItems(menu.mains).length;
  const mains = cleanItems(menu.mains);
  const soup = JUNK.some(pattern => pattern.test(String(menu.soup || ''))) ? null : cleanName(menu.soup || '') || null;
  removedJunk += Math.max(0, before - mains.length);
  if (JSON.stringify(mains) === JSON.stringify(asItems(menu.mains)) && soup === (menu.soup || null)) continue;

  await supabase(`daily_menus?restaurant_id=eq.${encodeURIComponent(menu.restaurant_id)}&menu_date=eq.${date}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ mains, soup, updated_at: new Date().toISOString() })
  });
  changed++;
}

console.log(JSON.stringify({ date, menus: menus?.length || 0, changed, removedJunk }, null, 2));
