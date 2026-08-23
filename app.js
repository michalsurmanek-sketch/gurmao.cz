// GURMAO.cz – shared public runtime

const currentPublicPage = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
document.documentElement.style.scrollBehavior = 'smooth';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(error => {
      console.error('Service worker registration failed:', error);
    });
  }, { once: true });
}

function loadScriptOnce(src, marker) {
  if (document.querySelector(`script[${marker}]`)) return;
  const script = document.createElement('script');
  script.src = src;
  script.defer = true;
  script.setAttribute(marker, 'true');
  document.head.appendChild(script);
}

loadScriptOnce('/mobile-bottom-nav.js?v=20260823-2', 'data-gurmao-bottom-nav');

if (!/^(admin(?:-|\.)|login\.|register\.|forgot-|reset-|404\.)/.test(currentPublicPage)) {
  void import('/header-search.js?v=20260823-2').catch(error => console.error('Shared header search failed:', error));
}
if (currentPublicPage === 'restaurace.html') {
  void import('/restaurant-card-enhancements.js?v=20260823-2').catch(error => console.error('Restaurant card enhancements failed:', error));
  void import('/restaurant-recommendation-card.js?v=20260823-2').catch(error => console.error('Daily recommendation failed:', error));
}
if (currentPublicPage === 'ai.html') {
  void import('/ai-form-runtime.js?v=20260823-2').catch(error => console.error('Recommendation form runtime failed:', error));
}
if (currentPublicPage === 'kontakt.html') {
  void import('/contact-form-runtime.js?v=20260823-2').catch(error => console.error('Protected contact form failed:', error));
}

if (!document.getElementById('gurmao-global-scrollbar-style')) {
  const style = document.createElement('style');
  style.id = 'gurmao-global-scrollbar-style';
  style.textContent = 'html,*{scrollbar-color:#d8ad34 #050505;scrollbar-width:thin}*::-webkit-scrollbar{width:10px;height:10px}*::-webkit-scrollbar-track{background:#050505}*::-webkit-scrollbar-thumb{min-height:36px;border:2px solid #050505;border-radius:999px;background:#d8ad34}*::-webkit-scrollbar-corner{background:#050505}';
  document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('menuBtn');
  const close = document.getElementById('menuClose');
  const backdrop = document.getElementById('menuBackdrop');
  const menu = document.getElementById('mobileMenu');
  const header = document.querySelector('header');
  if (!btn || !close || !backdrop || !menu) return;

  let scrollPosition = 0;
  let previousFocus = null;
  const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  const syncHeaderHeight = () => {
    const height = header?.getBoundingClientRect().height || 65;
    document.documentElement.style.setProperty('--gurmao-header-height', `${Math.ceil(height)}px`);
  };
  const isOpen = () => !menu.classList.contains('hidden');

  btn.setAttribute('aria-controls', 'mobileMenu');
  btn.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-modal', 'true');
  menu.setAttribute('aria-label', 'Mobilní navigace');
  close.setAttribute('aria-label', close.getAttribute('aria-label') || 'Zavřít menu');
  syncHeaderHeight();

  const open = () => {
    if (isOpen()) return;
    syncHeaderHeight();
    scrollPosition = window.scrollY;
    previousFocus = document.activeElement;
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
    if (!isOpen()) return;
    backdrop.classList.add('hidden');
    menu.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('gurmao-menu-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo({ top: scrollPosition, behavior: 'instant' });
    (previousFocus instanceof HTMLElement ? previousFocus : btn).focus({ preventScroll: true });
  };

  btn.addEventListener('click', open);
  close.addEventListener('click', shut);
  backdrop.addEventListener('click', shut);
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', shut));
  document.addEventListener('keydown', event => {
    if (!isOpen()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      shut();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...menu.querySelectorAll(focusableSelector)].filter(node => !node.hidden && node.getClientRects().length);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  window.addEventListener('resize', () => {
    syncHeaderHeight();
    if (innerWidth >= 768) shut();
  }, { passive: true });
});

function readLocalSaved() {
  try {
    const parsed = JSON.parse(localStorage.getItem('gurmao_saved') || '[]');
    return new Set(Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : []);
  } catch {
    localStorage.removeItem('gurmao_saved');
    return new Set();
  }
}

function writeLocalSaved(saved) {
  if (!saved.size) localStorage.removeItem('gurmao_saved');
  else localStorage.setItem('gurmao_saved', JSON.stringify([...saved]));
}

const GurmaoCollections = {
  savedCache: null,

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
    const user = await this.getAuthUser();
    if (!user) return (this.savedCache = localSaved);

    try {
      const { getSavedRestaurants, saveRestaurant } = await import('./supabase-client.js');
      const cloudRows = await getSavedRestaurants();
      const cloudSaved = new Set(cloudRows.map(item => String(item.restaurant_id || '')).filter(Boolean));
      const remainingLocal = new Set(localSaved);

      for (const slug of localSaved) {
        if (cloudSaved.has(slug)) {
          remainingLocal.delete(slug);
          continue;
        }
        try {
          await saveRestaurant(slug);
          cloudSaved.add(slug);
          remainingLocal.delete(slug);
        } catch (error) {
          console.warn(`Saved restaurant sync failed for ${slug}:`, error);
        }
      }

      writeLocalSaved(remainingLocal);
      return (this.savedCache = new Set([...cloudSaved, ...remainingLocal]));
    } catch (error) {
      console.error('Saved restaurants could not be loaded:', error);
      return (this.savedCache = localSaved);
    }
  },

  async save(slugValue) {
    const slug = String(slugValue || '').trim();
    if (!slug) throw new Error('Restaurant slug is required');
    const user = await this.getAuthUser();
    if (!user) {
      const saved = readLocalSaved();
      saved.add(slug);
      writeLocalSaved(saved);
      this.savedCache?.add(slug);
      return { saved: true, synced: false };
    }
    const { saveRestaurant } = await import('./supabase-client.js');
    await saveRestaurant(slug);
    this.savedCache?.add(slug);
    return { saved: true, synced: true };
  },

  async remove(slugValue) {
    const slug = String(slugValue || '').trim();
    if (!slug) throw new Error('Restaurant slug is required');
    const user = await this.getAuthUser();
    if (!user) {
      const saved = readLocalSaved();
      saved.delete(slug);
      writeLocalSaved(saved);
      this.savedCache?.delete(slug);
      return { saved: false, synced: false };
    }
    const { unsaveRestaurant } = await import('./supabase-client.js');
    await unsaveRestaurant(slug);
    const localSaved = readLocalSaved();
    localSaved.delete(slug);
    writeLocalSaved(localSaved);
    this.savedCache?.delete(slug);
    return { saved: false, synced: true };
  },

  async toggle(slug) {
    const saved = await this.getSaved();
    return saved.has(String(slug)) ? this.remove(slug) : this.save(slug);
  },

  async isSaved(slug) {
    return (await this.getSaved()).has(String(slug));
  },

  invalidate() {
    this.savedCache = null;
  }
};

window.GurmaoCollections = GurmaoCollections;

function updateSaveButtonLabel(button, active) {
  if (button.id === 'saveAction') {
    button.textContent = active ? '♥ Uloženo' : '♡ Uložit';
    return;
  }
  if (button.classList.contains('save-menu-btn')) {
    button.textContent = active ? '❤️ Uloženo' : '🤍 Uložit do výběru';
    return;
  }
  button.textContent = active ? '❤️' : '🤍';
}

async function updateAllSaveButtons() {
  const buttons = [...document.querySelectorAll('[data-save]')];
  if (!buttons.length) return;
  try {
    const saved = await GurmaoCollections.getSaved();
    buttons.forEach(button => {
      const id = String(button.dataset.save || '');
      const active = saved.has(id);
      button.classList.toggle('saved', active);
      button.setAttribute('aria-pressed', String(active));
      updateSaveButtonLabel(button, active);
    });
  } catch (error) {
    console.error('Save buttons could not be refreshed:', error);
  }
}

window.updateSaveButtons = updateAllSaveButtons;

document.addEventListener('DOMContentLoaded', () => {
  void updateAllSaveButtons();
  document.body.addEventListener('click', async event => {
    const button = event.target.closest('[data-save]');
    if (!button || button.dataset.saveBusy === '1') return;
    const id = String(button.dataset.save || '').trim();
    if (!id) return;
    event.preventDefault();
    event.stopPropagation();
    button.dataset.saveBusy = '1';
    button.disabled = true;
    try {
      const result = await GurmaoCollections.toggle(id);
      button.classList.toggle('saved', result.saved);
      button.setAttribute('aria-pressed', String(result.saved));
      updateSaveButtonLabel(button, result.saved);
      showToast(result.saved
        ? (result.synced ? '❤️ Přidáno do výběru' : '❤️ Uloženo v tomto zařízení')
        : (result.synced ? '🤍 Odebráno z výběru' : '🤍 Odebráno v tomto zařízení'));
    } catch (error) {
      console.error('Saved restaurant synchronization failed:', error);
      GurmaoCollections.invalidate();
      showToast('⚠️ Nepodařilo se synchronizovat. Zkuste to znovu.');
      await updateAllSaveButtons();
    } finally {
      button.disabled = false;
      delete button.dataset.saveBusy;
    }
  });
});

function showToast(message, duration = 2200) {
  const existing = document.getElementById('gurmao-toast');
  existing?.remove();
  const toast = document.createElement('div');
  toast.id = 'gurmao-toast';
  toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full bg-gurmaogold text-black font-semibold shadow-glow';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = String(message || '');
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity .25s';
    setTimeout(() => toast.remove(), 260);
  }, duration);
}

window.showToast = showToast;
