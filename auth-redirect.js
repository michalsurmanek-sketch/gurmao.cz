// Auth redirect handler - determines where user lands after auth actions
// Must be loaded on EVERY page

import { onAuthStateChange, supabase } from './supabase-client.js';

onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    if (!window.location.pathname.endsWith('/reset-password.html')) {
      window.location.href = '/reset-password.html';
    }
  }

  if (event === 'SIGNED_IN') {
    if (window.location.pathname.endsWith('/login.html')) {
      window.location.href = '/feed.html';
    }
  }
});

async function updateHomepageRestaurantCount() {
  const countElement = document.querySelector('.hero-count strong');
  if (!countElement) return;

  try {
    const { count, error } = await supabase
      .from('restaurants')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;
    countElement.textContent = Number(count || 0).toLocaleString('cs-CZ');
  } catch (error) {
    console.error('Nepodařilo se načíst počet restaurací:', error);
  }
}

function addWineBarHomepageCategory() {
  const cuisineGrid = document.querySelector('.taste-grid-cuisine');
  if (!cuisineGrid || cuisineGrid.querySelector('[data-category="vinarna"]')) return;

  const wineBar = document.createElement('a');
  wineBar.className = 'taste-item';
  wineBar.href = 'restaurace.html?q=vinárna';
  wineBar.dataset.category = 'vinarna';
  wineBar.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3h10c0 5-1.7 8-5 8S7 8 7 3Z"/>
      <path d="M12 11v7M8.5 21h7M9 18h6"/>
    </svg>
    <span>Vinárna</span>
  `;

  const pivnice = [...cuisineGrid.querySelectorAll('.taste-item')]
    .find((item) => item.textContent.trim() === 'Pivnice');

  if (pivnice) pivnice.insertAdjacentElement('afterend', wineBar);
  else cuisineGrid.appendChild(wineBar);
}

function applyHomepageCuisineLayout() {
  if (!document.querySelector('.taste-grid-cuisine')) return;

  const styleId = 'homepage-cuisine-flex-layout';
  let style = document.getElementById(styleId);
  if (!style) {
    style = document.createElement('style');
    style.id = styleId;
    document.head.appendChild(style);
  }

  style.textContent = `
    @media (min-width: 1024px) {
      body .hero-bg .hero-discovery .taste-grid-cuisine {
        display: flex !important;
        flex-wrap: nowrap !important;
        justify-content: center !important;
        align-items: flex-start !important;
        gap: clamp(8px, 1.15vw, 18px) !important;
        width: 100% !important;
      }

      body .hero-bg .hero-discovery .taste-grid-cuisine .taste-item {
        flex: 0 1 82px !important;
        width: auto !important;
        min-width: 62px !important;
        max-width: 86px !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        font-size: 12px !important;
      }
    }
  `;
}

async function countAdminItems(table, statuses = null) {
  let query = supabase.from(table).select('id', { count: 'exact', head: true });
  if (Array.isArray(statuses) && statuses.length) query = query.in('candidate_status', statuses);
  const { count, error } = await query;
  if (error) throw error;
  return Number(count || 0);
}

function adminQuickActionCard({ href, icon, title, description, badgeId, accent = 'gold' }) {
  const accents = {
    gold: 'border:rgba(212,175,55,.32);background:linear-gradient(145deg,rgba(212,175,55,.13),rgba(255,255,255,.035));',
    green: 'border:rgba(34,197,94,.30);background:linear-gradient(145deg,rgba(34,197,94,.12),rgba(255,255,255,.035));',
    blue: 'border:rgba(59,130,246,.30);background:linear-gradient(145deg,rgba(59,130,246,.12),rgba(255,255,255,.035));',
    red: 'border:rgba(239,68,68,.30);background:linear-gradient(145deg,rgba(239,68,68,.11),rgba(255,255,255,.035));'
  };

  return `
    <a href="${href}" class="admin-quick-action" style="${accents[accent] || accents.gold}">
      <span class="admin-quick-action__icon">${icon}</span>
      <span class="admin-quick-action__content">
        <strong>${title}</strong>
        <small>${description}</small>
      </span>
      ${badgeId ? `<span class="admin-quick-action__badge" id="${badgeId}">–</span>` : ''}
      <span class="admin-quick-action__arrow">→</span>
    </a>
  `;
}

async function initializeAdminQuickActions() {
  const path = window.location.pathname;
  if (!(path.endsWith('/admin.html') || path.endsWith('/admin') || path === '/admin.html')) return;
  if (document.getElementById('adminQuickActions')) return;

  const tabs = document.querySelector('.tab-btn')?.parentElement;
  if (!tabs) return;

  const style = document.createElement('style');
  style.id = 'admin-quick-actions-style';
  style.textContent = `
    .admin-quick-actions-wrap{margin:0 0 2rem;padding:1rem;border:1px solid rgba(255,255,255,.10);border-radius:1.25rem;background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018));box-shadow:0 18px 45px rgba(0,0,0,.20)}
    .admin-quick-actions-head{display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;margin-bottom:.9rem}
    .admin-quick-actions-head h2{font-size:1.25rem;margin:0;color:#fff}
    .admin-quick-actions-head p{margin:.2rem 0 0;color:rgba(255,255,255,.55);font-size:.82rem}
    .admin-quick-actions-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.75rem}
    .admin-quick-action{position:relative;display:flex;align-items:center;gap:.8rem;min-height:92px;padding:1rem;border:1px solid;border-radius:1rem;color:#fff;text-decoration:none;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;overflow:hidden}
    .admin-quick-action:hover{transform:translateY(-2px);border-color:rgba(212,175,55,.75)!important;box-shadow:0 14px 30px rgba(0,0,0,.28)}
    .admin-quick-action__icon{display:grid;place-items:center;flex:0 0 44px;width:44px;height:44px;border-radius:14px;background:rgba(0,0,0,.28);font-size:1.45rem}
    .admin-quick-action__content{display:flex;flex-direction:column;min-width:0;gap:.24rem}
    .admin-quick-action__content strong{font-size:.94rem;line-height:1.2}
    .admin-quick-action__content small{color:rgba(255,255,255,.58);font-size:.74rem;line-height:1.35}
    .admin-quick-action__badge{position:absolute;top:.6rem;right:.65rem;min-width:24px;height:24px;padding:0 7px;border-radius:999px;display:grid;place-items:center;background:#d4af37;color:#0b0b0d;font-size:.72rem;font-weight:800;box-shadow:0 0 0 3px rgba(212,175,55,.12)}
    .admin-quick-action__arrow{margin-left:auto;align-self:flex-end;color:#d4af37;font-size:1.15rem}
    @media(max-width:1023px){.admin-quick-actions-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:639px){.admin-quick-actions-wrap{padding:.8rem;border-radius:1rem}.admin-quick-actions-head{align-items:flex-start}.admin-quick-actions-grid{grid-template-columns:1fr}.admin-quick-action{min-height:78px;padding:.85rem}.admin-quick-action__content small{font-size:.72rem}}
  `;
  document.head.appendChild(style);

  const section = document.createElement('section');
  section.id = 'adminQuickActions';
  section.className = 'admin-quick-actions-wrap';
  section.setAttribute('aria-label', 'Rychlé administrátorské akce');
  section.innerHTML = `
    <div class="admin-quick-actions-head">
      <div>
        <h2>⚡ Rychlé schvalování a správa</h2>
        <p>Nejdůležitější pracovní procesy na jednom místě.</p>
      </div>
    </div>
    <div class="admin-quick-actions-grid">
      ${adminQuickActionCard({ href: 'admin-imports.html', icon: '📥', title: 'Schválit restaurace', description: 'Kontrola, úprava a publikování importovaných podniků', badgeId: 'quickRestaurantImports', accent: 'gold' })}
      ${adminQuickActionCard({ href: 'admin-chef-imports.html', icon: '👨‍🍳', title: 'Schválit kuchaře', description: 'Kontrola a zveřejnění importovaných profilů kuchařů', badgeId: 'quickChefImports', accent: 'green' })}
      ${adminQuickActionCard({ href: 'admin-contact.html', icon: '📬', title: 'Zprávy a žádosti', description: 'Dotazy uživatelů, restaurací a partnerů', accent: 'blue' })}
      ${adminQuickActionCard({ href: 'admin-imports.html?status=approved', icon: '🚀', title: 'Čeká na publikaci', description: 'Rychlý vstup k již schváleným restauracím', badgeId: 'quickApprovedImports', accent: 'red' })}
    </div>
  `;

  tabs.insertAdjacentElement('beforebegin', section);

  try {
    const [restaurantReview, approved] = await Promise.all([
      countAdminItems('restaurant_import_candidates', ['new', 'probable_duplicate']),
      countAdminItems('restaurant_import_candidates', ['approved'])
    ]);
    const restaurantBadge = document.getElementById('quickRestaurantImports');
    const approvedBadge = document.getElementById('quickApprovedImports');
    if (restaurantBadge) restaurantBadge.textContent = restaurantReview.toLocaleString('cs-CZ');
    if (approvedBadge) approvedBadge.textContent = approved.toLocaleString('cs-CZ');
  } catch (error) {
    console.warn('Počty importů na admin panelu se nepodařilo načíst:', error);
  }

  try {
    const chefBadge = document.getElementById('quickChefImports');
    if (chefBadge) {
      const { count, error } = await supabase
        .from('chef_import_candidates')
        .select('id', { count: 'exact', head: true });
      if (error) throw error;
      chefBadge.textContent = Number(count || 0).toLocaleString('cs-CZ');
    }
  } catch (error) {
    const chefBadge = document.getElementById('quickChefImports');
    if (chefBadge) chefBadge.textContent = '0';
    console.warn('Počet importovaných kuchařů se nepodařilo načíst:', error);
  }
}

function initializeHomepageDynamicContent() {
  updateHomepageRestaurantCount();
  addWineBarHomepageCategory();
  applyHomepageCuisineLayout();
  initializeAdminQuickActions();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeHomepageDynamicContent, { once: true });
} else {
  initializeHomepageDynamicContent();
}
