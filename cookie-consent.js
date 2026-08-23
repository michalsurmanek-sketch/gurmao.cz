// GURMAO.cz privacy/storage notice.
// Analytics are currently not configured; this notice therefore describes only
// storage that is necessary for authentication, preferences and saved restaurants.

class CookieConsent {
  constructor() {
    this.consentKey = 'gurmao-cookie-consent-v2';
    this.consent = this.loadConsent();
    if (!this.consent) this.showBanner();
  }

  loadConsent() {
    try {
      const stored = localStorage.getItem(this.consentKey);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed?.necessary === true ? parsed : null;
    } catch {
      localStorage.removeItem(this.consentKey);
      return null;
    }
  }

  saveConsent() {
    const consent = {
      necessary: true,
      analytics: false,
      version: 2,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(this.consentKey, JSON.stringify(consent));
    this.consent = consent;
  }

  showBanner() {
    document.getElementById('cookieConsentBanner')?.remove();

    const banner = document.createElement('aside');
    banner.id = 'cookieConsentBanner';
    banner.className = 'gurmao-privacy-notice';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Informace o úložišti webu');

    const content = document.createElement('div');
    content.className = 'gurmao-privacy-content';

    const copy = document.createElement('div');
    copy.className = 'gurmao-privacy-copy';
    const title = document.createElement('strong');
    title.textContent = 'Soukromí a nezbytné úložiště';
    const text = document.createElement('p');
    text.textContent = 'GURMAO používá nezbytné úložiště pro přihlášení, uložené restaurace a vaše základní volby. Analytické cookies ani Google Analytics aktuálně nejsou aktivní.';
    const link = document.createElement('a');
    link.href = 'legal.html#soukromi';
    link.textContent = 'Více informací';
    copy.append(title, text, link);

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Rozumím';
    button.addEventListener('click', () => {
      this.saveConsent();
      banner.remove();
    });

    content.append(copy, button);
    banner.appendChild(content);
    document.body.appendChild(banner);

    if (!document.getElementById('gurmao-privacy-notice-style')) {
      const style = document.createElement('style');
      style.id = 'gurmao-privacy-notice-style';
      style.textContent = `
        .gurmao-privacy-notice{position:fixed;left:0;right:0;bottom:0;z-index:999999;padding:16px;background:rgba(7,8,7,.97);border-top:1px solid rgba(255,255,255,.13);backdrop-filter:blur(18px);box-shadow:0 -18px 45px rgba(0,0,0,.38)}
        .gurmao-privacy-content{width:min(1120px,100%);margin:auto;display:flex;align-items:center;justify-content:space-between;gap:24px}
        .gurmao-privacy-copy{min-width:0}.gurmao-privacy-copy strong{display:block;color:#f3c94a;font:700 14px/1.35 Inter,system-ui,sans-serif}.gurmao-privacy-copy p{margin:5px 0 3px;color:rgba(255,255,255,.7);font:400 12px/1.55 Inter,system-ui,sans-serif}.gurmao-privacy-copy a{color:#f3c94a;font:600 11px/1.4 Inter,system-ui,sans-serif;text-decoration:underline}
        .gurmao-privacy-content button{flex:0 0 auto;min-height:42px;padding:0 19px;border:0;border-radius:999px;background:#d8ad34;color:#111;font:700 13px/1 Inter,system-ui,sans-serif;cursor:pointer}
        .gurmao-privacy-content button:hover,.gurmao-privacy-content button:focus-visible{filter:brightness(1.08);outline:2px solid rgba(243,201,74,.45);outline-offset:2px}
        @media(max-width:700px){.gurmao-privacy-content{align-items:stretch;flex-direction:column;gap:12px}.gurmao-privacy-content button{width:100%}}
      `;
      document.head.appendChild(style);
    }
  }

  static reopen() {
    localStorage.removeItem('gurmao-cookie-consent-v2');
    document.getElementById('cookieConsentBanner')?.remove();
    window.cookieConsent = new CookieConsent();
  }
}

function initializePrivacyNotice() {
  if (!window.cookieConsent) window.cookieConsent = new CookieConsent();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePrivacyNotice, { once: true });
} else {
  initializePrivacyNotice();
}

window.CookieConsent = CookieConsent;
