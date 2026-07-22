import { supabase } from './supabase-client.js';

const DAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'];
const DAY_LABELS = { mon:'Po', tue:'Út', wed:'St', thu:'Čt', fri:'Pá', sat:'So', sun:'Ne' };
const HOURS_CACHE = new Map();
let loading = null;

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
}

function norm(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function parseMinutes(value) {
  const match = String(value || '').match(/(\d{1,2})[:.](\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 24 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function dayValue(hours, key) {
  if (!hours || typeof hours !== 'object' || Array.isArray(hours)) return '';
  return String(hours[key] ?? '').trim();
}

function intervals(value) {
  return [...String(value || '').matchAll(/(\d{1,2}[:.]\d{2})\s*[–—-]\s*(\d{1,2}[:.]\d{2})/g)]
    .map(match => ({ open: parseMinutes(match[1]), close: parseMinutes(match[2]), openText: match[1].replace('.', ':'), closeText: match[2].replace('.', ':') }))
    .filter(item => item.open !== null && item.close !== null);
}

function openingState(hours) {
  const now = new Date();
  const key = DAY_KEYS[now.getDay()];
  const value = dayValue(hours, key);
  if (!value) return { type:'unknown', text:'🕐 Doba neuvedena' };
  if (/closed|zavřeno|zavreno/i.test(value)) return { type:'closed', text:'● Dnes zavřeno' };

  const current = now.getHours() * 60 + now.getMinutes();
  let nextOpen = null;
  for (const interval of intervals(value)) {
    const close = interval.close <= interval.open ? interval.close + 1440 : interval.close;
    const currentAdjusted = current < interval.open && close > 1440 ? current + 1440 : current;
    if (currentAdjusted >= interval.open && currentAdjusted < close) {
      const remaining = close - currentAdjusted;
      return remaining <= 30
        ? { type:'closing', text:`● Zavírá za ${remaining} min` }
        : { type:'open', text:`● Otevřeno do ${interval.closeText}` };
    }
    if (current < interval.open && (nextOpen === null || interval.open < nextOpen)) nextOpen = interval.open;
  }
  if (nextOpen !== null) {
    const h = String(Math.floor(nextOpen / 60)).padStart(2, '0');
    const m = String(nextOpen % 60).padStart(2, '0');
    return { type:'closed', text:`● Zavřeno · otevírá ${h}:${m}` };
  }
  return { type:'closed', text:'● Zavřeno' };
}

async function loadHours() {
  if (loading) return loading;
  loading = (async () => {
    const { data, error } = await supabase.from('restaurants').select('id,slug,opening_hours,opening_hours_verified_at');
    if (error) throw error;
    for (const row of data || []) {
      if (row.slug) HOURS_CACHE.set(String(row.slug), row);
      if (row.id) HOURS_CACHE.set(String(row.id), row);
    }
  })().catch(error => console.error('Opening hours UI:', error));
  return loading;
}

function slugFromCard(card) {
  const href = card.querySelector('a[href*="restaurace-"]')?.getAttribute('href') || '';
  const match = href.match(/restaurace-([^/?#]+)\.html/i);
  return match ? decodeURIComponent(match[1]) : '';
}

function enhanceCards() {
  document.querySelectorAll('.restaurant-card').forEach(card => {
    const badge = card.querySelector('.card-badge');
    if (!badge || badge.dataset.openingEnhanced === '1') return;
    const slug = slugFromCard(card);
    const row = HOURS_CACHE.get(slug);
    if (!row?.opening_hours) return;
    const currentText = norm(badge.textContent);
    if (!currentText.includes('novinka') && !currentText.includes('popularni')) return;
    const state = openingState(row.opening_hours);
    badge.dataset.openingEnhanced = '1';
    badge.className = `card-badge opening-badge ${state.type}`;
    badge.textContent = state.text;
    badge.title = row.opening_hours_verified_at ? `Aktualizováno ${new Date(row.opening_hours_verified_at).toLocaleDateString('cs-CZ')}` : '';
  });
}

function scheduleHtml(hours) {
  const order = ['mon','tue','wed','thu','fri','sat','sun'];
  return `<div class="gurmao-hours-week">${order.map(key => {
    const value = dayValue(hours, key) || 'Neuvedeno';
    const closed = /closed|zavřeno|zavreno/i.test(value);
    return `<div class="gurmao-hours-row"><strong>${DAY_LABELS[key]}</strong><span class="${closed ? 'is-closed' : ''}">${esc(closed ? 'Zavřeno' : value)}</span></div>`;
  }).join('')}</div>`;
}

async function enhanceDetail() {
  const params = new URLSearchParams(location.search);
  const identifier = params.get('id');
  if (!identifier) return;
  const row = HOURS_CACHE.get(identifier);
  if (!row?.opening_hours) return;

  const quickInfo = document.getElementById('quickInfo');
  if (!quickInfo || quickInfo.dataset.hoursEnhanced === '1') return;
  const state = openingState(row.opening_hours);
  const wrapper = document.createElement('div');
  wrapper.className = 'gurmao-detail-hours';
  wrapper.innerHTML = `<div class="gurmao-hours-heading"><span class="opening-status ${state.type}">${esc(state.text)}</span><small>Pravidelná otevírací doba</small></div>${scheduleHtml(row.opening_hours)}`;

  const existing = [...quickInfo.children].find(item => norm(item.textContent).includes('oteviraci doba'));
  if (existing) existing.replaceWith(wrapper); else quickInfo.prepend(wrapper);
  quickInfo.dataset.hoursEnhanced = '1';
}

function injectStyles() {
  if (document.getElementById('gurmao-opening-hours-styles')) return;
  const style = document.createElement('style');
  style.id = 'gurmao-opening-hours-styles';
  style.textContent = `
    .card-badge.opening-badge{letter-spacing:0!important;text-transform:none!important;max-width:calc(100% - 92px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .card-badge.opening-badge.open{color:#69dc83!important;border-color:rgba(105,220,131,.55)!important;background:rgba(8,57,25,.86)!important}
    .card-badge.opening-badge.closing{color:#ffbf69!important;border-color:rgba(255,191,105,.55)!important;background:rgba(87,43,8,.88)!important}
    .card-badge.opening-badge.closed{color:#ff8b78!important;border-color:rgba(255,139,120,.5)!important;background:rgba(83,22,13,.88)!important}
    .card-badge.opening-badge.unknown{color:rgba(255,255,255,.72)!important}
    .gurmao-detail-hours{grid-column:1/-1;width:100%;padding:16px;border:1px solid rgba(216,173,52,.25);border-radius:16px;background:rgba(216,173,52,.055)}
    .gurmao-hours-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.gurmao-hours-heading small{color:rgba(255,255,255,.48)}
    .gurmao-hours-week{display:grid;gap:7px}.gurmao-hours-row{display:flex;justify-content:space-between;gap:18px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.08)}.gurmao-hours-row:last-child{border-bottom:0}.gurmao-hours-row strong{color:rgba(255,255,255,.62)}.gurmao-hours-row span{color:#fff;text-align:right}.gurmao-hours-row .is-closed{color:#ff8b78}
    .opening-status.open{color:#69dc83}.opening-status.closing{color:#ffbf69}.opening-status.closed{color:#ff8b78}.opening-status.unknown{color:rgba(255,255,255,.62)}
  `;
  document.head.appendChild(style);
}

async function init() {
  injectStyles();
  await loadHours();
  enhanceCards();
  await enhanceDetail();
  const observer = new MutationObserver(() => { enhanceCards(); enhanceDetail(); });
  observer.observe(document.body, { childList:true, subtree:true });
  setInterval(enhanceCards, 60000);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
else init();
