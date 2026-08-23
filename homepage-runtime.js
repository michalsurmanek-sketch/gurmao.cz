import { supabase } from './supabase-client.js';

if ((location.pathname.split('/').pop() || 'index.html').toLowerCase() !== 'index.html') {
  throw new Error('homepage-runtime loaded outside homepage');
}

function addWineBarHomepageCategory() {
  const cuisineGrid = document.querySelector('.taste-grid-cuisine');
  if (!cuisineGrid || cuisineGrid.querySelector('[data-category="vinarna"]')) return;

  const wineBar = document.createElement('a');
  wineBar.className = 'taste-item';
  wineBar.href = 'restaurace.html?q=vinárna';
  wineBar.dataset.category = 'vinarna';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of ['M7 3h10c0 5-1.7 8-5 8S7 8 7 3Z', 'M12 11v7M8.5 21h7M9 18h6']) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
  }
  const label = document.createElement('span');
  label.textContent = 'Vinárna';
  wineBar.append(svg, label);

  const pivnice = [...cuisineGrid.querySelectorAll('.taste-item')]
    .find(item => item.textContent.trim() === 'Pivnice');
  if (pivnice) pivnice.insertAdjacentElement('afterend', wineBar);
  else cuisineGrid.appendChild(wineBar);
}

function applyHomepageCuisineLayout() {
  if (!document.querySelector('.taste-grid-cuisine')) return;
  let style = document.getElementById('homepage-cuisine-flex-layout');
  if (!style) {
    style = document.createElement('style');
    style.id = 'homepage-cuisine-flex-layout';
    document.head.appendChild(style);
  }
  style.textContent = `
    @media (min-width:1024px){
      body .hero-bg .hero-discovery .taste-grid-cuisine{display:flex!important;flex-wrap:nowrap!important;justify-content:center!important;align-items:flex-start!important;gap:clamp(8px,1.15vw,18px)!important;width:100%!important}
      body .hero-bg .hero-discovery .taste-grid-cuisine .taste-item{flex:0 1 82px!important;width:auto!important;min-width:62px!important;max-width:86px!important;padding-left:0!important;padding-right:0!important;font-size:12px!important}
    }
  `;
}

async function syncAccountCta() {
  const cta = document.getElementById('heroLoginBtn');
  if (!cta) return;
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      cta.href = 'login.html';
      cta.textContent = 'Přihlásit se →';
      return;
    }
    cta.href = 'collections.html';
    cta.textContent = 'Můj výběr';
  } catch (error) {
    console.warn('Homepage auth CTA could not be verified:', error);
    cta.href = 'login.html';
    cta.textContent = 'Přihlásit se →';
  }
}

function initHomepage() {
  addWineBarHomepageCategory();
  applyHomepageCuisineLayout();
  void syncAccountCta();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initHomepage, { once: true });
else initHomepage();
