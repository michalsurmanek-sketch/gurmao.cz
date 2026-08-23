// GURMAO.cz - Shared JavaScript

document.documentElement.style.scrollBehavior = 'smooth';

document.addEventListener('DOMContentLoaded', () => {
  document.body.style.opacity = '0';
  requestAnimationFrame(() => {
    document.body.style.transition = 'opacity 0.3s ease-in';
    document.body.style.opacity = '1';
  });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(error => {
      console.error('Service worker registration failed:', error);
    });
  });
}

if (!document.querySelector('script[data-gurmao-bottom-nav]')) {
  const bottomNavScript = document.createElement('script');
  bottomNavScript.src = '/mobile-bottom-nav.js?v=20260726-3';
  bottomNavScript.defer = true;
  bottomNavScript.dataset.gurmaoBottomNav = 'true';
  document.head.appendChild(bottomNavScript);
}

const currentPublicPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
if (!/^(admin(?:-|\.)|login\.|register\.|forgot-|reset-|404\.)/.test(currentPublicPage)) {
  void import('/header-search.js?v=20260726-unified-4').catch(error => {
    console.error('Shared header search failed to load:', error);
  });
}

if (!document.getElementById('gurmao-global-scrollbar-style')) {
  const scrollbarStyle = document.createElement('style');
  scrollbarStyle.id = 'gurmao-global-scrollbar-style';
  scrollbarStyle.textContent = `
    html,*{scrollbar-color:#d8ad34 #050505;scrollbar-width:thin}
    *::-webkit-scrollbar{width:10px;height:10px}
    *::-webkit-scrollbar-track{background:#050505}
    *::-webkit-scrollbar-thumb{min-height:36px;border:2px solid #050505;border-radius:999px;background:linear-gradient(180deg,#f3c94a 0%,#d8ad34 55%,#9f7615 100%)}
    *::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#ffe27a 0%,#e4bd3d 58%,#ad8118 100%)}
    *::-webkit-scrollbar-corner{background:#050505}
  `;
  document.head.appendChild(scrollbarStyle);
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('menuBtn');
  const close = document.getElementById('menuClose');
  const backdrop = document.getElementById('menuBackdrop');
  const menu = document.getElementById('mobileMenu');
  const header = document.querySelector('header');
  if (!btn || !close || !backdrop || !menu) return;

  let scrollPosition = 0;

  const syncHeaderHeight = () => {
    const height = header?.getBoundingClientRect().height || 65;
    document.documentElement.style.setProperty('--gurmao-header-height', `${Math.ceil(height)}px`);
  };

  btn.setAttribute('aria-controls', 'mobileMenu');
  btn.setAttribute('aria-expanded', 'false');
  close.setAttribute('aria-label', close.getAttribute('aria-label') || 'Zavřít menu');
  menu.setAttribute('aria-hidden', 'true');
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-label', 'Mobilní navigace');
  syncHeaderHeight();

  const open = () => {
    syncHeaderHeight();
    scrollPosition = window.scrollY;
    backdrop.classList.remove('hidden');
    menu.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('gurmao-menu-open');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';
    close.focus({ preventScroll: true });
  };

  const shut = () => {
    if (menu.classList.contains('hidden')) return;
    backdrop.classList.add('hidden');
    menu.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('gurmao-menu-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo({ top: scrollPosition, behavior: 'instant' });
    btn.focus({ preventScroll: true });
  };

  btn.addEventListener('click', open);
  close.addEventListener('click', shut);
  backdrop.addEventListener('click', shut);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') shut();
  });
  window.addEventListener('resize', () => {
    syncHeaderHeight();
    if (window.innerWidth >= 768) shut();
  }, { passive: true });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', shut));
});

function readLocalSaved() {
  try {
    const parsed = JSON.parse(localStorage.getItem('gurmao_saved') || '[]');
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    localStorage.removeItem('gurmao_saved');
    return new Set();
  }
}

function writeLocalSaved(saved) {
  localStorage.setItem('gurmao_saved', JSON.stringify([...saved]));
}

const GurmaoCollections = {
  storageKey: 'gurmao_saved',
  savedCache: null,

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('gurmao_user') || 'null');
    } catch {
      localStorage.removeItem('gurmao_user');
      return null;
    }
  },

  async getAuthUser() {
    try {
      const { getCurrentUser } = await import('./supabase-client.js');
      return await getCurrentUser();
    } catch (error) {
      console.warn('Auth state could not be verified:', error);
      return null;
    }
  },

  async getSaved() {
    if (this.savedCache) return this.savedCache;

    const localSaved = readLocalSaved();
    const authUser = await this.getAuthUser();
    if (!authUser) {
      this.savedCache = localSaved;
      return this.savedCache;
    }

    try {
      const { getSavedRestaurants } = await import('./supabase-client.js');
      const savedRestaurants = await getSavedRestaurants();
      const cloudSaved = new Set(savedRestaurants.map(item => String(item.restaurant_id || '')).filter(Boolean));
      this.savedCache = new Set([...cloudSaved, ...localSaved]);
      return this.savedCache;
    } catch (error) {
      console.error('Error fetching saved restaurants:', error);
      this.savedCache = localSaved;
      return this.savedCache;
    }
  },

  async save(restaurantSlug) {
    const slug = String(restaurantSlug || '');
    if (!slug) throw new Error('Restaurant slug is required');

    const authUser = await this.getAuthUser();
    if (!authUser) {
      const saved = readLocalSaved();
      saved.add(slug);
      writeLocalSaved(saved);
      if (this.savedCache) this.savedCache.add(slug);
      return { saved: true, synced: false };
    }

    const { saveRestaurant } = await import('./supabase-client.js');
    await saveRestaurant(slug);
    if (this.savedCache) this.savedCache.add(slug);
    return { saved: true, synced: true };
  },

  async remove(restaurantSlug) {
    const slug = String(restaurantSlug || '');
    if (!slug) throw new Error('Restaurant slug is required');

    const authUser = await this.getAuthUser();
    if (!authUser) {
      const saved = readLocalSaved();
      saved.delete(slug);
      writeLocalSaved(saved);
      if (this.savedCache) this.savedCache.delete(slug);
      return { saved: false, synced: false };
    }

    const { unsaveRestaurant } = await import('./supabase-client.js');
    await unsaveRestaurant(slug);
    if (this.savedCache) this.savedCache.delete(slug);
    return { saved: false, synced: true };
  },

  async toggle(restaurantSlug) {
    const saved = await this.getSaved();
    return saved.has(String(restaurantSlug))
      ? this.remove(restaurantSlug)
      : this.save(restaurantSlug);
  },

  async isSaved(restaurantSlug) {
    const saved = await this.getSaved();
    return saved.has(String(restaurantSlug));
  },

  invalidate() {
    this.savedCache = null;
  }
};

window.GurmaoCollections = GurmaoCollections;

document.addEventListener('DOMContentLoaded', async () => {
  await updateAllSaveButtons();

  document.body.addEventListener('click', async event => {
    const btn = event.target.closest('[data-save]');
    if (!btn || btn.dataset.saveBusy === '1') return;

    event.preventDefault();
    event.stopPropagation();

    const id = btn.getAttribute('data-save');
    if (!id) return;

    btn.dataset.saveBusy = '1';
    btn.disabled = true;
    try {
      const result = await GurmaoCollections.toggle(id);
      btn.textContent = result.saved ? '❤️' : '🤍';
      btn.classList.toggle('saved', result.saved);
      if (result.saved) {
        showToast(result.synced ? '❤️ Přidáno do výběru' : '❤️ Uloženo v tomto zařízení');
      } else {
        showToast(result.synced ? '🤍 Odebráno z výběru' : '🤍 Odebráno v tomto zařízení');
      }
    } catch (error) {
      console.error('Saved restaurant synchronization failed:', error);
      showToast('⚠️ Nepodařilo se synchronizovat. Zkus to znovu.');
      GurmaoCollections.invalidate();
      await updateAllSaveButtons();
    } finally {
      btn.disabled = false;
      delete btn.dataset.saveBusy;
    }
  });
});

async function updateAllSaveButtons() {
  const saveButtons = document.querySelectorAll('[data-save]');
  if (!saveButtons.length) return;

  let saved;
  try {
    saved = await GurmaoCollections.getSaved();
  } catch (error) {
    console.error('Saved buttons could not be refreshed:', error);
    return;
  }

  saveButtons.forEach(btn => {
    const id = String(btn.getAttribute('data-save') || '');
    const isSaved = saved.has(id);
    btn.textContent = isSaved ? '❤️' : '🤍';
    btn.classList.toggle('saved', isSaved);
    btn.setAttribute('aria-pressed', String(isSaved));
  });
}

window.updateSaveButtons = updateAllSaveButtons;

function showToast(message, duration = 2200) {
  const existing = document.getElementById('gurmao-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'gurmao-toast';
  toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full bg-gurmaogold text-black font-semibold shadow-glow animate-fade-in';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (event) {
    const href = this.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});