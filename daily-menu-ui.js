import { supabase } from './supabase-client.js';
import { escapeHtml, safeWebUrl } from './security-utils.js';

function todayPrague() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat('cs-CZ', {
      timeZone: 'Europe/Prague', weekday: 'long', day: 'numeric', month: 'long'
    }).format(new Date(`${value}T12:00:00+02:00`));
  } catch {
    return value;
  }
}

function normalizeItems(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.split('\n').map(name => ({ name: name.trim() })).filter(item => item.name);
    }
  }
  return [];
}

function renderItems(items) {
  return normalizeItems(items).map((item, index) => {
    const name = typeof item === 'string' ? item : (item.name || item.title || item.text || '');
    const price = typeof item === 'object' ? (item.price || '') : '';
    if (!name) return '';
    return `<li class="flex items-start justify-between gap-4 py-3 border-b border-white/10 last:border-0">
      <span class="text-white/90"><span class="text-gurmaogold mr-2">${index + 1}.</span>${escapeHtml(name)}</span>
      ${price ? `<strong class="whitespace-nowrap text-gurmaogold">${escapeHtml(price)}</strong>` : ''}
    </li>`;
  }).join('');
}

function buildMenuCard(menu) {
  const mains = renderItems(menu.mains);
  const desserts = renderItems(menu.desserts);
  const drinks = renderItems(menu.drinks);
  const sourceUrl = safeWebUrl(menu.source_url || '');
  const rawText = String(menu.raw_text || '').trim();

  return `<section id="dailyMenuSection" class="py-12 border-b border-white/10 bg-white/[0.02]">
    <div class="max-w-6xl mx-auto px-6">
      <div class="rounded-3xl border border-gurmaogold/30 bg-white/5 p-6 md:p-8 shadow-xl">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div class="text-gurmaogold text-sm uppercase tracking-wider mb-2">Dnešní nabídka</div>
            <h2 class="text-3xl font-bold">Polední menu</h2>
            <p class="text-white/60 mt-1">${escapeHtml(formatDate(menu.menu_date))}</p>
          </div>
          ${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener" class="inline-flex items-center justify-center px-4 py-2 rounded-full border border-white/20 hover:border-gurmaogold hover:text-gurmaogold transition text-sm">Ověřit na webu restaurace</a>` : ''}
        </div>

        ${menu.soup ? `<div class="mb-6 rounded-2xl bg-gurmaogold/10 border border-gurmaogold/20 p-4"><div class="text-xs uppercase tracking-wider text-gurmaogold mb-1">Polévka</div><div class="text-white">${escapeHtml(menu.soup)}</div></div>` : ''}
        ${mains ? `<div class="mb-5"><h3 class="text-xl mb-2">Hlavní jídla</h3><ul>${mains}</ul></div>` : ''}
        ${desserts ? `<div class="mb-5"><h3 class="text-xl mb-2">Dezerty</h3><ul>${desserts}</ul></div>` : ''}
        ${drinks ? `<div class="mb-5"><h3 class="text-xl mb-2">Nápoje</h3><ul>${drinks}</ul></div>` : ''}
        ${!menu.soup && !mains && !desserts && !drinks && rawText ? `<pre class="whitespace-pre-wrap font-sans text-white/80 leading-relaxed">${escapeHtml(rawText)}</pre>` : ''}
        <p class="text-xs text-white/40 mt-5">Nabídka se může během dne změnit. Platnost a ceny ověřte u restaurace.</p>
      </div>
    </div>
  </section>`;
}

async function loadDailyMenu() {
  if (!location.pathname.endsWith('/restaurace-detail.html') && !location.pathname.endsWith('restaurace-detail.html')) return;
  const idOrSlug = new URLSearchParams(location.search).get('id');
  if (!idOrSlug) return;

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('id')
    .eq(isUUID ? 'id' : 'slug', idOrSlug)
    .maybeSingle();

  if (restaurantError || !restaurant) return;

  const { data: menu, error } = await supabase
    .from('daily_menus')
    .select('menu_date,source_url,source_type,soup,mains,desserts,drinks,raw_text,ai_summary,updated_at')
    .eq('restaurant_id', restaurant.id)
    .eq('menu_date', todayPrague())
    .maybeSingle();

  if (error || !menu) return;

  const mainContent = document.getElementById('mainContent');
  const hero = mainContent?.querySelector('section');
  if (!mainContent || !hero || document.getElementById('dailyMenuSection')) return;
  hero.insertAdjacentHTML('afterend', buildMenuCard(menu));
}

document.addEventListener('DOMContentLoaded', () => {
  loadDailyMenu().catch(error => console.error('Daily menu UI:', error));
});
