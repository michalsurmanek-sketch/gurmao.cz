// Auth redirect handler - determines where user lands after auth actions
// Must be loaded on EVERY page

import { onAuthStateChange, supabase } from './supabase-client.js';

onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    // User clicked reset password link → redirect to reset form
    if (!window.location.pathname.endsWith('/reset-password.html')) {
      window.location.href = '/reset-password.html';
    }
  }

  if (event === 'SIGNED_IN') {
    // User logged in or registered → redirect to feed
    if (window.location.pathname.endsWith('/login.html')) {
      window.location.href = '/feed.html';
    }
  }

  if (event === 'USER_UPDATED') {
    // Email changed or other profile update
    // Stay on current page
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

function initializeHomepageDynamicContent() {
  updateHomepageRestaurantCount();
  addWineBarHomepageCategory();
  applyHomepageCuisineLayout();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeHomepageDynamicContent, { once: true });
} else {
  initializeHomepageDynamicContent();
}
