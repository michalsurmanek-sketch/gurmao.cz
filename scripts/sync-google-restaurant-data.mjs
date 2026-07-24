const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const GOOGLE_PLACES_API_KEY = String(process.env.GOOGLE_PLACES_API_KEY || '');
const LIMIT = Math.max(1, Math.min(Number(process.env.GOOGLE_SYNC_LIMIT || 100), 500));
const REFRESH_DAYS = Math.max(1, Number(process.env.GOOGLE_REFRESH_DAYS || 7));

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !GOOGLE_PLACES_API_KEY) {
  console.error('Chybí SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY nebo GOOGLE_PLACES_API_KEY.');
  process.exit(1);
}

const restHeaders = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json'
};

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...restHeaders, ...(options.headers || {}) }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${text}`);
  return text.trim() ? JSON.parse(text) : null;
}

function timeValue(value) {
  if (!value || typeof value !== 'object' || !Number.isInteger(value.hour)) return null;
  const minute = Number.isInteger(value.minute) ? value.minute : 0;
  return `${String(value.hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function normalizePeriods(periods) {
  if (!Array.isArray(periods) || periods.length === 0) return null;
  const buckets = Object.fromEntries(DAYS.map(day => [day, []]));
  for (const period of periods) {
    const day = Number(period?.open?.day);
    const open = timeValue(period?.open);
    const close = timeValue(period?.close);
    if (!Number.isInteger(day) || day < 0 || day > 6 || !open) continue;
    buckets[DAYS[day]].push(`${open}-${close || '24:00'}`);
  }
  const result = {};
  for (const day of DAYS) result[day] = buckets[day].length ? buckets[day].join(', ') : 'closed';
  return Object.values(buckets).some(items => items.length) ? result : null;
}

async function googleJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      ...(init.headers || {})
    }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Google Places ${response.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

async function findPlace(row) {
  if (row.google_place_id) return row.google_place_id;
  const textQuery = [row.name, row.address, row.city, 'Česko'].filter(Boolean).join(', ');
  const data = await googleJson('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'X-Goog-FieldMask': 'places.id' },
    body: JSON.stringify({ textQuery, languageCode: 'cs', regionCode: 'CZ', maxResultCount: 1 })
  });
  return data?.places?.[0]?.id || null;
}

async function loadPlace(placeId) {
  const mask = [
    'id','regularOpeningHours','currentOpeningHours','rating','userRatingCount',
    'nationalPhoneNumber','websiteUri','location','priceLevel','primaryType','photos'
  ].join(',');
  return googleJson(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=cs`, {
    headers: { 'X-Goog-FieldMask': mask }
  });
}

async function loadRestaurants() {
  const cutoff = new Date(Date.now() - REFRESH_DAYS * 86400000).toISOString();
  const select = 'id,name,address,city,image_url,google_place_id,opening_hours_verified_at';
  const filter = `or=(opening_hours_verified_at.is.null,opening_hours_verified_at.lt.${encodeURIComponent(cutoff)})`;
  return supabase(`restaurants?select=${select}&${filter}&order=opening_hours_verified_at.asc.nullsfirst&limit=${LIMIT}`);
}

async function patchRestaurant(id, updates) {
  await supabase(`restaurants?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(updates)
  });
}

const rows = await loadRestaurants();
let updated = 0, notFound = 0, noHours = 0, failed = 0;

for (const row of rows || []) {
  try {
    const checkedAt = new Date().toISOString();
    const placeId = await findPlace(row);
    if (!placeId) {
      await patchRestaurant(row.id, {
        opening_hours_verified_at: checkedAt,
        opening_hours_source: 'google_not_found'
      });
      notFound++;
      console.warn(`Nenalezeno: ${row.name}`);
      continue;
    }
    const place = await loadPlace(placeId);
    const periods = place?.regularOpeningHours?.periods || place?.currentOpeningHours?.periods || [];
    const openingHours = normalizePeriods(periods);
    const updates = {
      google_place_id: placeId,
      opening_hours_verified_at: checkedAt,
      opening_hours_source: openingHours ? 'google' : 'google_no_hours'
    };
    if (openingHours) updates.opening_hours = openingHours;
    if (Number.isFinite(place?.rating)) updates.google_rating = Number(place.rating);
    if (Number.isInteger(place?.userRatingCount)) updates.google_review_count = place.userRatingCount;
    if (place?.nationalPhoneNumber) updates.phone = String(place.nationalPhoneNumber);
    if (place?.websiteUri) updates.website = String(place.websiteUri);
    if (Number.isFinite(place?.location?.latitude)) updates.latitude = Number(place.location.latitude);
    if (Number.isFinite(place?.location?.longitude)) updates.longitude = Number(place.location.longitude);
    if (place?.priceLevel) updates.price_level = String(place.priceLevel);
    if (place?.primaryType) updates.google_primary_type = String(place.primaryType);
    const photoName = place?.photos?.[0]?.name ? String(place.photos[0].name) : '';
    if (photoName) {
      updates.google_photo_name = photoName;
      if (!String(row.image_url || '').trim()) {
        updates.image_url = `${SUPABASE_URL}/functions/v1/google-place-photo?name=${encodeURIComponent(photoName)}&w=1400`;
      }
    }
    await patchRestaurant(row.id, updates);
    if (!openingHours) noHours++;
    updated++;
    console.log(`✓ ${row.name}${openingHours ? '' : ' (bez hodin)'}`);
  } catch (error) {
    failed++;
    console.warn(`✗ ${row.name}: ${error.message}`);
  }
}

console.log(JSON.stringify({ processed: rows?.length || 0, updated, notFound, noHours, failed }, null, 2));
if (failed > 0 && updated === 0 && notFound === 0) process.exitCode = 2;
