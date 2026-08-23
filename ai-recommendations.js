import { supabase } from './supabase-client.js';

const VIBE_EMOJI = { LUXE: '🍷', DRAMA: '🔥', CHAOS: '🌮', PURE: '🌿', DARK: '🌙', CALM: '🌊' };
const MOOD_VIBES = {
  romantika: ['LUXE', 'CALM'], oslava: ['DRAMA', 'CHAOS', 'LUXE'], business: ['LUXE', 'CALM'],
  kamarádi: ['CHAOS', 'DRAMA'], rychle: ['CHAOS', 'PURE'], klid: ['CALM', 'PURE'], dobrodružství: ['CHAOS', 'DRAMA']
};
const OCCASION_VIBES = {
  rande: ['LUXE', 'CALM'], výročí: ['LUXE'], narozeniny: ['DRAMA', 'CHAOS'],
  'business dinner': ['LUXE', 'CALM'], oběd: ['PURE', 'CHAOS', 'CALM'], 'páteční večer': ['DRAMA', 'CHAOS'], party: ['CHAOS', 'DRAMA']
};
const SELECT_FIELDS = 'id,slug,name,city,tag,vibe,description,image_url,google_rating,google_review_count,price_level,opening_hours';
const CANDIDATE_LIMIT = 240;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}
function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
function cleanTerm(value) {
  return String(value || '').normalize('NFKC').replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}
function vibeKey(value) {
  const text = normalize(value);
  return Object.keys(VIBE_EMOJI).find(key => text.includes(key.toLowerCase())) || '';
}
function numericPriceLevel(value) {
  const raw = String(value || '').toUpperCase();
  if (!raw) return null;
  if (raw.includes('VERY_EXPENSIVE') || raw === '4') return 4;
  if (raw.includes('EXPENSIVE') || raw === '3') return 3;
  if (raw.includes('MODERATE') || raw === '2') return 2;
  if (raw.includes('INEXPENSIVE') || raw === '1') return 1;
  return null;
}
function safeImageUrl(value) {
  try {
    const url = new URL(String(value || ''), location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
function detailUrl(restaurant) {
  return `restaurant.html?slug=${encodeURIComponent(String(restaurant.slug || restaurant.id || ''))}`;
}
function requestedVibes(query) {
  return [...new Set([...(MOOD_VIBES[query.mood] || []), ...(OCCASION_VIBES[query.occasion] || [])])];
}
function textTerms(value) {
  return [...new Set(cleanTerm(value).split(/\s+/).filter(term => term.length >= 2))].slice(0, 4);
}

class AIRecommendationEngine {
  async fetchCandidates(query = {}) {
    let request = supabase
      .from('restaurants')
      .select(SELECT_FIELDS)
      .not('slug', 'is', null)
      .not('name', 'is', null);

    const city = cleanTerm(query.city);
    if (city) request = request.ilike('city', city);

    const vibes = requestedVibes(query);
    if (vibes.length) {
      request = request.or(vibes.map(vibe => `vibe.ilike.%${vibe}%`).join(','));
    }

    const terms = textTerms(query.freeText);
    if (terms.length) {
      const clauses = [];
      for (const term of terms) {
        const safe = term.replace(/[,%()]/g, '');
        clauses.push(`name.ilike.%${safe}%`, `tag.ilike.%${safe}%`, `description.ilike.%${safe}%`, `city.ilike.%${safe}%`);
      }
      request = request.or(clauses.join(','));
    }

    const { data, error } = await request
      .order('google_rating', { ascending: false, nullsFirst: false })
      .order('google_review_count', { ascending: false, nullsFirst: false })
      .limit(CANDIDATE_LIMIT);

    if (error) throw error;
    const candidates = Array.isArray(data) ? data : [];
    if (candidates.length || city || terms.length) return candidates;

    // If a mood/vibe filter was too restrictive, fall back only when the user did not
    // explicitly constrain city or free text. The fallback is still bounded.
    const { data: fallback, error: fallbackError } = await supabase
      .from('restaurants')
      .select(SELECT_FIELDS)
      .not('slug', 'is', null)
      .not('name', 'is', null)
      .order('google_rating', { ascending: false, nullsFirst: false })
      .order('google_review_count', { ascending: false, nullsFirst: false })
      .limit(CANDIDATE_LIMIT);
    if (fallbackError) throw fallbackError;
    return Array.isArray(fallback) ? fallback : [];
  }

  scoreRestaurant(restaurant, query) {
    let score = 0;
    const reasons = [];
    const restaurantVibe = vibeKey(restaurant.vibe);
    const city = normalize(query.city);
    const freeText = normalize(query.freeText);
    const restaurantText = normalize([restaurant.name, restaurant.city, restaurant.tag, restaurant.vibe, restaurant.description].filter(Boolean).join(' '));

    if (city) {
      if (normalize(restaurant.city) === city) { score += 40; reasons.push(`Je v ${restaurant.city}`); }
      else score -= 35;
    }

    const moodVibes = MOOD_VIBES[query.mood] || [];
    if (restaurantVibe && moodVibes.includes(restaurantVibe)) { score += 28; reasons.push(`Sedí na náladu ${query.mood}`); }

    const occasionVibes = OCCASION_VIBES[query.occasion] || [];
    if (restaurantVibe && occasionVibes.includes(restaurantVibe)) { score += 24; reasons.push(`Hodí se pro ${query.occasion}`); }

    const wantedPrice = Number(query.priceLevel) || null;
    const restaurantPrice = numericPriceLevel(restaurant.price_level);
    if (wantedPrice && restaurantPrice) {
      const difference = Math.abs(wantedPrice - restaurantPrice);
      if (difference === 0) { score += 24; reasons.push('Odpovídá rozpočtu'); }
      else if (difference === 1) score += 8;
      else score -= 12;
    }

    if (freeText) {
      const terms = [...new Set(freeText.split(/\s+/).filter(term => term.length >= 2))].slice(0, 6);
      const matches = terms.filter(term => restaurantText.includes(term));
      if (matches.length) { score += Math.min(42, matches.length * 14); reasons.push(`Odpovídá chuti: ${matches.slice(0, 3).join(', ')}`); }
      else score -= 10;
    }

    const rating = Number(restaurant.google_rating || 0);
    const reviews = Number(restaurant.google_review_count || 0);
    if (Number.isFinite(rating) && rating > 0) {
      score += Math.max(0, (rating - 3.5) * 10);
      if (rating >= 4.5) reasons.push(`Hodnocení ${rating.toFixed(1)} na Google`);
    }
    if (Number.isFinite(reviews) && reviews > 0) score += Math.min(12, Math.log10(reviews + 1) * 4);
    if (restaurant.image_url) score += 2;
    if (restaurant.opening_hours) score += 2;

    return { restaurant, score, reasons: reasons.slice(0, 3) };
  }

  async getRecommendations(query = {}) {
    const candidates = await this.fetchCandidates(query);
    return candidates
      .map(restaurant => this.scoreRestaurant(restaurant, query))
      .filter(item => item.score > -20)
      .sort((a, b) => b.score - a.score || Number(b.restaurant.google_rating || 0) - Number(a.restaurant.google_rating || 0))
      .slice(0, 3);
  }

  explanation(query, result) {
    const restaurant = result.restaurant;
    return result.reasons.length
      ? `${restaurant.name} vychází nejlépe podle zadaných kritérií: ${result.reasons.join(' · ')}.`
      : `${restaurant.name} vychází nejlépe z aktuálních restaurací v databázi GURMAO podle dostupných dat a hodnocení.`;
  }

  card(result, index) {
    const restaurant = result.restaurant;
    const rating = Number(restaurant.google_rating || 0);
    const reviews = Number(restaurant.google_review_count || 0);
    const image = safeImageUrl(restaurant.image_url);
    const vibe = vibeKey(restaurant.vibe);
    const vibeLabel = vibe ? `${VIBE_EMOJI[vibe]} ${vibe}` : 'GURMAO VÝBĚR';
    const reasons = result.reasons.length
      ? `<div class="mb-4 space-y-1">${result.reasons.map(reason => `<div class="text-xs text-white/60 flex items-center gap-2"><span class="text-gurmaogold">✓</span>${escapeHtml(reason)}</div>`).join('')}</div>`
      : '';
    const ratingHtml = rating > 0
      ? `<div class="text-gurmaogold text-sm font-semibold">★ ${escapeHtml(rating.toFixed(1).replace('.', ','))}${reviews > 0 ? ` · ${escapeHtml(reviews.toLocaleString('cs-CZ'))} recenzí` : ''}</div>`
      : '<div class="text-white/40 text-xs">Bez dostupného hodnocení</div>';

    return `<article class="bg-white/5 rounded-2xl border ${index === 0 ? 'border-gurmaogold shadow-glow' : 'border-white/10'} overflow-hidden hover:bg-white/10 transition">
      ${image ? `<a href="${escapeHtml(detailUrl(restaurant))}" class="block aspect-[16/9] overflow-hidden"><img src="${escapeHtml(image)}" alt="${escapeHtml(restaurant.name)}" loading="lazy" class="w-full h-full object-cover"></a>` : ''}
      <div class="p-6">
        ${index === 0 ? '<div class="inline-block px-3 py-1 rounded-full bg-gurmaogold text-black text-xs font-bold mb-3">TOP DOPORUČENÍ</div>' : ''}
        <div class="text-xs text-gurmaogold mb-1">${escapeHtml(vibeLabel)}</div>
        <h3 class="text-xl font-bold">${escapeHtml(restaurant.name)}</h3>
        <div class="text-white/60 text-sm mt-1">${escapeHtml([restaurant.city, restaurant.tag].filter(Boolean).join(' · '))}</div>
        <div class="mt-3">${ratingHtml}</div>
        ${restaurant.description ? `<p class="text-white/80 text-sm my-4">${escapeHtml(String(restaurant.description).slice(0, 220))}</p>` : '<div class="mb-4"></div>'}
        ${reasons}
        <a href="${escapeHtml(detailUrl(restaurant))}" class="inline-flex w-full justify-center px-4 py-3 rounded-full ${index === 0 ? 'bg-gurmaogold text-black' : 'bg-white/10 text-white'} text-sm font-semibold hover:scale-[1.02] transition">Zobrazit detail →</a>
      </div>
    </article>`;
  }

  async renderRecommendations(query = {}) {
    try {
      const results = await this.getRecommendations(query);
      if (!results.length) return '<div class="text-center text-white/60 py-12">Pro zadaná kritéria jsme nenašli vhodnou restauraci. Zkus změnit město nebo preference.</div>';
      const top = results[0];
      return `<section aria-live="polite">
        <div class="mb-8 p-6 bg-gradient-to-br from-gurmaogold/20 to-gurmaored/20 rounded-2xl border border-gurmaogold/30">
          <div class="flex items-start gap-3"><div class="text-3xl" aria-hidden="true">✦</div><div class="flex-1">
            <h3 class="font-bold mb-2">Doporučení GURMAO</h3>
            <p class="text-white/90 text-sm leading-relaxed">${escapeHtml(this.explanation(query, top))}</p>
            <p class="text-white/45 text-xs mt-3">Výsledek vychází z aktuálních dat restaurací, zadaných preferencí a dostupného hodnocení. Nejde o placené pořadí.</p>
          </div></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${results.map((result, index) => this.card(result, index)).join('')}</div>
      </section>`;
    } catch (error) {
      console.error('Recommendation loading failed:', error);
      return '<div class="text-center text-red-300 py-12">Doporučení se teď nepodařilo načíst. Zkus to prosím znovu.</div>';
    }
  }
}

window.aiEngine = new AIRecommendationEngine();
