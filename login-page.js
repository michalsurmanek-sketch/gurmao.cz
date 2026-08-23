import {
  supabase,
  signIn,
  signUp,
  signInWithGoogle,
  resetPassword,
  migrateLocalStorageToSupabase
} from './supabase-client.js';

if (!location.pathname.endsWith('/login.html')) {
  throw new Error('login-page loaded outside login');
}

const LOGIN_PATH = '/login.html';
const DEFAULT_DESTINATION = '/feed.html';

function safeDestination(value, user = null) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw, location.origin);
    if (url.origin !== location.origin) return '';
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (!path.startsWith('/') || url.pathname === LOGIN_PATH) return '';
    if (/^\/admin(?:[-/.]|$)/i.test(url.pathname) && user?.app_metadata?.role !== 'admin') return '';
    return path;
  } catch {
    return '';
  }
}

function desiredDestination(user = null) {
  const params = new URLSearchParams(location.search);
  const fromQuery = safeDestination(params.get('return'), user);
  const fromStorage = safeDestination(localStorage.getItem('gurmao_return_url'), user);
  localStorage.removeItem('gurmao_return_url');
  return fromQuery || fromStorage || DEFAULT_DESTINATION;
}

function storeCompatibilityUser(user) {
  if (!user) return;
  localStorage.setItem('gurmao_user', JSON.stringify({
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.display_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Uživatel',
    loggedIn: true
  }));
}

function toastLoadingSafe(message) {
  return window.toastLoading?.(message) ?? window.toast?.loading?.(message) ?? null;
}

function toastUpdateSafe(id, message, type = 'success') {
  if (id != null && window.toast?.update) window.toast.update(id, message, type);
  else window.showToast?.(message, type);
}

async function syncLocalSaved() {
  try {
    await migrateLocalStorageToSupabase();
    window.GurmaoCollections?.invalidate?.();
  } catch (error) {
    console.warn('Saved restaurants could not be migrated after login:', error);
  }
}

async function completeSignIn(user) {
  storeCompatibilityUser(user);
  await syncLocalSaved();
  location.replace(desiredDestination(user));
}

async function handleExistingSession() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;
  await completeSignIn(user);
  return true;
}

function bindTabs() {
  const tabLogin = document.getElementById('tabLogin');
  const tabSignup = document.getElementById('tabSignup');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  if (!tabLogin || !tabSignup || !loginForm || !signupForm) return;

  const showLogin = () => {
    tabLogin.classList.add('bg-gurmaogold', 'text-black');
    tabLogin.classList.remove('bg-white/5');
    tabSignup.classList.remove('bg-gurmaogold', 'text-black');
    tabSignup.classList.add('bg-white/5');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
  };
  const showSignup = () => {
    tabSignup.classList.add('bg-gurmaogold', 'text-black');
    tabSignup.classList.remove('bg-white/5');
    tabLogin.classList.remove('bg-gurmaogold', 'text-black');
    tabLogin.classList.add('bg-white/5');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  };

  tabLogin.addEventListener('click', showLogin, { capture: true });
  tabSignup.addEventListener('click', showSignup, { capture: true });
  window.__gurmaoShowLoginTab = showLogin;
}

function bindAuthActions() {
  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    if (form.id === 'formLogin') {
      event.preventDefault();
      event.stopImmediatePropagation();
      const email = document.getElementById('loginEmail')?.value || '';
      const password = document.getElementById('loginPassword')?.value || '';
      const loading = toastLoadingSafe('Přihlašování…');
      try {
        const result = await signIn(email, password);
        toastUpdateSafe(loading, '✅ Přihlášení úspěšné!', 'success');
        await completeSignIn(result.user);
      } catch (error) {
        console.error('Login failed:', error);
        toastUpdateSafe(loading, `❌ ${error?.message || 'Přihlášení se nepodařilo'}`, 'error');
      }
      return;
    }

    if (form.id === 'formSignup') {
      event.preventDefault();
      event.stopImmediatePropagation();
      const name = document.getElementById('signupName')?.value || '';
      const email = document.getElementById('signupEmail')?.value || '';
      const passwordInput = document.getElementById('signupPassword');
      const password = passwordInput?.value || '';
      if (password.length < 10) {
        passwordInput?.setCustomValidity('Heslo musí mít alespoň 10 znaků.');
        passwordInput?.reportValidity();
        passwordInput?.setCustomValidity('');
        return;
      }

      const loading = toastLoadingSafe('Registrace…');
      try {
        const result = await signUp(email, password, name);
        if (result.session && result.user) {
          toastUpdateSafe(loading, '✅ Účet vytvořen a přihlášen.', 'success');
          await completeSignIn(result.user);
          return;
        }
        toastUpdateSafe(loading, '✅ Zkontroluj e-mail pro potvrzení účtu.', 'success');
        window.__gurmaoShowLoginTab?.();
      } catch (error) {
        console.error('Signup failed:', error);
        toastUpdateSafe(loading, `❌ ${error?.message || 'Registrace se nepodařila'}`, 'error');
      }
    }
  }, true);

  document.addEventListener('click', async event => {
    const target = event.target instanceof Element ? event.target.closest('button,a') : null;
    if (!target) return;

    if (target.id === 'forgotPasswordLink') {
      event.preventDefault();
      event.stopImmediatePropagation();
      let email = document.getElementById('loginEmail')?.value?.trim() || '';
      if (!email) email = window.prompt('Zadej svůj e-mail:')?.trim() || '';
      if (!email) return;
      const loading = toastLoadingSafe('Odesílám e-mail…');
      try {
        await resetPassword(email);
        toastUpdateSafe(loading, '✅ Zkontroluj e-mail.', 'success');
      } catch (error) {
        console.error('Password reset failed:', error);
        toastUpdateSafe(loading, `❌ ${error?.message || 'E-mail se nepodařilo odeslat'}`, 'error');
      }
      return;
    }

    if (target.tagName === 'BUTTON' && /pokračovat\s+s\s+google/i.test(target.textContent || '')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const destination = desiredDestination();
      localStorage.setItem('gurmao_return_url', destination);
      const loading = toastLoadingSafe('Přihlašování přes Google…');
      try {
        await signInWithGoogle();
      } catch (error) {
        console.error('Google login failed:', error);
        toastUpdateSafe(loading, `❌ ${error?.message || 'Google přihlášení se nepodařilo'}`, 'error');
      }
    }
  }, true);
}

async function init() {
  bindTabs();
  bindAuthActions();
  await handleExistingSession();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void init(), { once: true });
} else {
  void init();
}
