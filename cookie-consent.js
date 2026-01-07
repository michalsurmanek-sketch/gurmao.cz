/**
 * Cookie Consent Banner for GURMAO.cz
 * GDPR compliant cookie consent management
 */

class CookieConsent {
  constructor() {
    this.consentKey = 'gurmao-cookie-consent';
    this.consent = this.loadConsent();
    
    // If no consent stored, show banner
    if (!this.consent) {
      this.showBanner();
    } else {
      // Apply stored preferences
      this.applyConsent(this.consent);
    }
  }

  loadConsent() {
    const stored = localStorage.getItem(this.consentKey);
    return stored ? JSON.parse(stored) : null;
  }

  saveConsent(consent) {
    localStorage.setItem(this.consentKey, JSON.stringify({
      ...consent,
      timestamp: new Date().toISOString()
    }));
    this.consent = consent;
  }

  showBanner() {
    // Remove existing banner if present
    const existing = document.getElementById('cookieConsentBanner');
    if (existing) existing.remove();

    // Create banner HTML
    const banner = document.createElement('div');
    banner.id = 'cookieConsentBanner';
    banner.className = 'cookie-consent-banner';
    banner.innerHTML = `
      <div class="cookie-consent-content">
        <div class="cookie-consent-text">
          <div class="cookie-consent-icon">🍪</div>
          <div>
            <h3 class="cookie-consent-title">Soubory cookie</h3>
            <p class="cookie-consent-description">
              Používáme cookies pro zajištění funkčnosti webu a zlepšování uživatelské zkušenosti. 
              Analytické cookies nám pomáhají pochopit, jak web používáte.
              <a href="legal.html#cookies" target="_blank" class="cookie-consent-link">Více informací</a>
            </p>
          </div>
        </div>
        
        <div class="cookie-consent-actions">
          <button id="cookieAcceptAll" class="cookie-btn cookie-btn-primary">
            Přijmout vše
          </button>
          <button id="cookieAcceptNecessary" class="cookie-btn cookie-btn-secondary">
            Pouze nezbytné
          </button>
          <button id="cookieCustomize" class="cookie-btn cookie-btn-text">
            Nastavit
          </button>
        </div>
      </div>
      
      <!-- Detailed settings (hidden by default) -->
      <div id="cookieSettings" class="cookie-settings" style="display: none;">
        <h4 class="cookie-settings-title">Nastavení cookies</h4>
        
        <div class="cookie-option">
          <div class="cookie-option-header">
            <label class="cookie-option-label">
              <input type="checkbox" checked disabled class="cookie-checkbox">
              <span class="cookie-option-name">Nezbytné cookies</span>
            </label>
            <span class="cookie-option-badge">Vždy aktivní</span>
          </div>
          <p class="cookie-option-description">
            Nutné pro základní funkčnost webu (přihlášení, uložené preference).
          </p>
        </div>
        
        <div class="cookie-option">
          <div class="cookie-option-header">
            <label class="cookie-option-label">
              <input type="checkbox" id="cookieAnalytics" class="cookie-checkbox" checked>
              <span class="cookie-option-name">Analytické cookies</span>
            </label>
          </div>
          <p class="cookie-option-description">
            Pomáhají nám pochopit, jak používáte web (Google Analytics). Údaje jsou anonymizované.
          </p>
        </div>
        
        <div class="cookie-settings-actions">
          <button id="cookieSaveSettings" class="cookie-btn cookie-btn-primary">
            Uložit nastavení
          </button>
          <button id="cookieCancel" class="cookie-btn cookie-btn-secondary">
            Zpět
          </button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .cookie-consent-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(11, 11, 13, 0.98);
        backdrop-filter: blur(20px);
        border-top: 1px solid rgba(255, 255, 255, 0.15);
        padding: 1.5rem;
        z-index: 999999;
        box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
      }
      
      .cookie-consent-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 2rem;
        flex-wrap: wrap;
      }
      
      .cookie-consent-text {
        flex: 1;
        min-width: 300px;
        display: flex;
        gap: 1rem;
        align-items: flex-start;
      }
      
      .cookie-consent-icon {
        font-size: 2rem;
        flex-shrink: 0;
      }
      
      .cookie-consent-title {
        color: #d4af37;
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
      }
      
      .cookie-consent-description {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.875rem;
        line-height: 1.6;
        margin: 0;
      }
      
      .cookie-consent-link {
        color: #d4af37;
        text-decoration: underline;
        text-decoration-color: rgba(212, 175, 55, 0.3);
        transition: all 0.2s;
      }
      
      .cookie-consent-link:hover {
        color: #e5c158;
        text-decoration-color: #d4af37;
      }
      
      .cookie-consent-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        align-items: center;
      }
      
      .cookie-btn {
        padding: 0.75rem 1.5rem;
        border-radius: 0.75rem;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        white-space: nowrap;
      }
      
      .cookie-btn-primary {
        background: #d4af37;
        color: #0b0b0d;
      }
      
      .cookie-btn-primary:hover {
        background: #e5c158;
        transform: translateY(-1px);
      }
      
      .cookie-btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .cookie-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
      }
      
      .cookie-btn-text {
        background: transparent;
        color: rgba(255, 255, 255, 0.7);
        text-decoration: underline;
        text-decoration-color: rgba(255, 255, 255, 0.2);
        padding: 0.75rem 1rem;
      }
      
      .cookie-btn-text:hover {
        color: #d4af37;
        text-decoration-color: #d4af37;
      }
      
      .cookie-settings {
        max-width: 1200px;
        margin: 1.5rem auto 0;
        padding-top: 1.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .cookie-settings-title {
        color: #d4af37;
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 1rem 0;
      }
      
      .cookie-option {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.75rem;
        padding: 1rem;
        margin-bottom: 0.75rem;
      }
      
      .cookie-option-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      
      .cookie-option-label {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        color: white;
        font-weight: 500;
        font-size: 0.9375rem;
      }
      
      .cookie-checkbox {
        width: 1.25rem;
        height: 1.25rem;
        cursor: pointer;
        accent-color: #d4af37;
      }
      
      .cookie-checkbox:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      
      .cookie-option-badge {
        background: rgba(212, 175, 55, 0.15);
        color: #d4af37;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
      }
      
      .cookie-option-description {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.8125rem;
        line-height: 1.5;
        margin: 0;
        padding-left: 2rem;
      }
      
      .cookie-settings-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1rem;
      }
      
      @media (max-width: 768px) {
        .cookie-consent-content {
          flex-direction: column;
          align-items: stretch;
        }
        
        .cookie-consent-actions {
          flex-direction: column;
        }
        
        .cookie-btn {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);

    // Add to page
    document.body.appendChild(banner);

    // Event listeners
    document.getElementById('cookieAcceptAll').addEventListener('click', () => {
      this.acceptAll();
    });

    document.getElementById('cookieAcceptNecessary').addEventListener('click', () => {
      this.acceptNecessary();
    });

    document.getElementById('cookieCustomize').addEventListener('click', () => {
      this.showSettings();
    });

    document.getElementById('cookieSaveSettings')?.addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('cookieCancel')?.addEventListener('click', () => {
      this.hideSettings();
    });
  }

  showSettings() {
    document.getElementById('cookieSettings').style.display = 'block';
  }

  hideSettings() {
    document.getElementById('cookieSettings').style.display = 'none';
  }

  acceptAll() {
    const consent = {
      necessary: true,
      analytics: true
    };
    this.saveConsent(consent);
    this.applyConsent(consent);
    this.hideBanner();
  }

  acceptNecessary() {
    const consent = {
      necessary: true,
      analytics: false
    };
    this.saveConsent(consent);
    this.applyConsent(consent);
    this.hideBanner();
  }

  saveSettings() {
    const analyticsCheckbox = document.getElementById('cookieAnalytics');
    const consent = {
      necessary: true,
      analytics: analyticsCheckbox ? analyticsCheckbox.checked : false
    };
    this.saveConsent(consent);
    this.applyConsent(consent);
    this.hideBanner();
  }

  applyConsent(consent) {
    // Apply Google Analytics if consented
    if (consent.analytics) {
      this.enableAnalytics();
    } else {
      this.disableAnalytics();
    }
  }

  enableAnalytics() {
    // Check if ga.js exists and Google Analytics is configured
    if (window.gaTrackingId) {
      console.log('Google Analytics enabled with consent');
      // GA is already loaded via ga.js
    }
  }

  disableAnalytics() {
    // Disable Google Analytics
    if (window.gaTrackingId) {
      window['ga-disable-' + window.gaTrackingId] = true;
      console.log('Google Analytics disabled');
    }
  }

  hideBanner() {
    const banner = document.getElementById('cookieConsentBanner');
    if (banner) {
      banner.style.animation = 'slideDown 0.3s ease-out';
      setTimeout(() => banner.remove(), 300);
    }
  }

  // Public method to reopen banner (from footer link)
  static reopen() {
    localStorage.removeItem('gurmao-cookie-consent');
    location.reload();
  }
}

// Add slide animation
const animStyle = document.createElement('style');
animStyle.textContent = `
  @keyframes slideDown {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(animStyle);

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.cookieConsent = new CookieConsent();
  });
} else {
  window.cookieConsent = new CookieConsent();
}

// Export for footer link usage
window.CookieConsent = CookieConsent;
