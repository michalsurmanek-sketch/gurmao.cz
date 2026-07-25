const STORAGE_KEY = 'gurmao_home_city';
const FALLBACK_KEYS = ['gurmaoHomeCity', 'gurmao_city', 'homeCity'];
const DEFAULT_CITIES = ['Uherské Hradiště','Zlín','Brno','Praha','Ostrava','Olomouc','Plzeň','České Budějovice','Hradec Králové','Pardubice','Jihlava','Liberec'];

function readCity() {
  const direct = localStorage.getItem(STORAGE_KEY);
  if (direct) return direct;
  for (const key of FALLBACK_KEYS) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }
  try {
    const state = JSON.parse(localStorage.getItem('gurmao_location_state') || 'null');
    if (state?.location?.cityName) return state.location.cityName;
  } catch {}
  return '';
}

function saveCity(city) {
  if (city) {
    localStorage.setItem(STORAGE_KEY, city);
    localStorage.setItem('gurmaoHomeCity', city);
  } else {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('gurmaoHomeCity');
  }
  window.dispatchEvent(new CustomEvent('gurmao:home-city-change', { detail: { city } }));
}

function injectStyles() {
  if (document.getElementById('gurmao-home-city-header-style')) return;
  const style = document.createElement('style');
  style.id = 'gurmao-home-city-header-style';
  style.textContent = `
    .gurmao-city-wrap{position:relative;display:flex;align-items:center;flex:0 0 auto}
    .gurmao-city-btn{height:42px;max-width:230px;display:flex;align-items:center;gap:8px;padding:0 14px;border:1px solid rgba(216,173,52,.38);border-radius:999px;background:rgba(216,173,52,.08);color:#f3c94a;font:600 13px/1 Inter,sans-serif;cursor:pointer;white-space:nowrap;transition:.18s}
    .gurmao-city-btn:hover,.gurmao-city-btn[aria-expanded="true"]{border-color:#f3c94a;background:rgba(216,173,52,.14)}
    .gurmao-city-btn .gurmao-city-name{max-width:155px;overflow:hidden;text-overflow:ellipsis}
    .gurmao-city-menu{position:absolute;right:0;top:calc(100% + 10px);z-index:500;width:min(320px,calc(100vw - 28px));padding:10px;border:1px solid rgba(216,173,52,.28);border-radius:18px;background:rgba(10,11,9,.98);box-shadow:0 24px 70px rgba(0,0,0,.58);backdrop-filter:blur(18px)}
    .gurmao-city-menu[hidden]{display:none!important}
    .gurmao-city-title{padding:8px 10px 10px;color:rgba(255,255,255,.54);font-size:11px;text-transform:uppercase;letter-spacing:.11em}
    .gurmao-city-option{width:100%;min-height:43px;display:flex;align-items:center;gap:10px;padding:0 11px;border:0;border-radius:11px;background:transparent;color:#fff;text-align:left;cursor:pointer;font:500 13px Inter,sans-serif}
    .gurmao-city-option:hover,.gurmao-city-option.active{background:rgba(216,173,52,.12);color:#f3c94a}
    .gurmao-city-custom{display:flex;gap:7px;margin-top:8px;padding-top:9px;border-top:1px solid rgba(255,255,255,.1)}
    .gurmao-city-custom input{min-width:0;flex:1;height:40px;padding:0 11px;border:1px solid rgba(255,255,255,.15);border-radius:10px;background:#151613;color:#fff;outline:none}
    .gurmao-city-custom button{height:40px;padding:0 13px;border:0;border-radius:10px;background:#d8ad34;color:#111;font-weight:700;cursor:pointer}
    @media(max-width:1000px){.gurmao-city-btn{max-width:180px}.gurmao-city-btn .gurmao-city-name{max-width:105px}}
    @media(max-width:767px){.gurmao-city-wrap{margin-left:auto;margin-right:8px}.gurmao-city-btn{width:42px;padding:0;justify-content:center}.gurmao-city-btn .gurmao-city-name,.gurmao-city-btn .gurmao-city-arrow{display:none}.gurmao-city-menu{right:-52px}}
  `;
  document.head.appendChild(style);
}

function removeOldCityBadge() {
  document.querySelectorAll('[id*="city" i],[class*="city" i],[id*="location" i],[class*="location" i]').forEach(el => {
    if (el.closest('header') || el.closest('.gurmao-city-wrap')) return;
    const text = String(el.textContent || '').replace(/\s+/g, ' ').trim();
    if (/^📍\s*.+(?:–|-)\s*Změnit$/i.test(text) || /^📍\s*.+\s+Změnit$/i.test(text)) el.style.display = 'none';
  });
}

function init() {
  if (document.getElementById('gurmaoCityHeader')) return;
  const header = document.querySelector('header');
  if (!header) return;
  injectStyles();

  const desktopNav = header.querySelector('nav');
  const mobileControls = header.querySelector('#mobileHeaderControls') || header.querySelector('#menuBtn')?.parentElement;
  const anchor = desktopNav || mobileControls || header.firstElementChild;
  if (!anchor) return;

  const wrap = document.createElement('div');
  wrap.id = 'gurmaoCityHeader';
  wrap.className = 'gurmao-city-wrap';
  const city = readCity();
  wrap.innerHTML = `
    <button class="gurmao-city-btn" type="button" aria-expanded="false" aria-haspopup="menu">
      <span aria-hidden="true">📍</span><span class="gurmao-city-name">${escapeHtml(city || 'Vybrat město')}</span><span class="gurmao-city-arrow">⌄</span>
    </button>
    <div class="gurmao-city-menu" role="menu" hidden>
      <div class="gurmao-city-title">Domovské město</div>
      ${DEFAULT_CITIES.map(name => `<button class="gurmao-city-option${name === city ? ' active' : ''}" type="button" data-city="${escapeHtml(name)}">📍 ${escapeHtml(name)}</button>`).join('')}
      <button class="gurmao-city-option${city ? '' : ' active'}" type="button" data-city="">🌍 Celá Česká republika</button>
      <div class="gurmao-city-custom"><input type="text" maxlength="60" placeholder="Jiné město…"><button type="button">Uložit</button></div>
    </div>`;

  if (desktopNav) desktopNav.insertBefore(wrap, desktopNav.firstChild);
  else anchor.insertBefore(wrap, anchor.firstChild);

  const btn = wrap.querySelector('.gurmao-city-btn');
  const menu = wrap.querySelector('.gurmao-city-menu');
  const name = wrap.querySelector('.gurmao-city-name');
  const input = wrap.querySelector('input');

  const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  const open = () => { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); };
  const select = selected => {
    const clean = String(selected || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    saveCity(clean);
    name.textContent = clean || 'Celá ČR';
    wrap.querySelectorAll('[data-city]').forEach(el => el.classList.toggle('active', el.dataset.city === clean));
    close();
    if (/restaurace\.html$/i.test(location.pathname)) {
      const url = new URL(location.href);
      clean ? url.searchParams.set('city', clean) : url.searchParams.delete('city');
      location.href = url.href;
    }
  };

  btn.addEventListener('click', event => { event.stopPropagation(); menu.hidden ? open() : close(); });
  wrap.querySelectorAll('[data-city]').forEach(option => option.addEventListener('click', () => select(option.dataset.city)));
  wrap.querySelector('.gurmao-city-custom button').addEventListener('click', () => select(input.value));
  input.addEventListener('keydown', event => { if (event.key === 'Enter') select(input.value); });
  document.addEventListener('click', event => { if (!wrap.contains(event.target)) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  removeOldCityBadge();
  setTimeout(removeOldCityBadge, 800);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
