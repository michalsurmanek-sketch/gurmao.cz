// GURMAO Vibe Tooltips

const vibeDescriptions = {
  '🍷 LUXE': 'Elegantní zážitek, důraz na detail, klidná atmosféra',
  '🔥 DRAMA': 'Výrazné chutě, silná osobnost, nezapomenutelné kombinace',
  '🌮 CHAOS': 'Uvolněný styl, pestrost, radost z jídla bez pravidel',
  '🌿 PURE': 'Čisté suroviny, jednoduchost, chuť v hlavní roli',
  '🖤 DARK': 'Intimní atmosféra, večerní vibe, tlumené světlo',
  '🌊 CALM': 'Klidná atmosféra, harmonie, pohoda',
  'LUXE': 'Elegantní zážitek, důraz na detail, klidná atmosféra',
  'DRAMA': 'Výrazné chutě, silná osobnost, nezapomenutelné kombinace',
  'CHAOS': 'Uvolněný styl, pestrost, radost z jídla bez pravidel',
  'PURE': 'Čisté suroviny, jednoduchost, chuť v hlavní roli',
  'DARK': 'Intimní atmosféra, večerní vibe, tlumené světlo',
  'CALM': 'Klidná atmosféra, harmonie, pohoda'
};

function injectRestaurantActionStyles() {
  if (document.getElementById('gurmao-action-hover-styles')) return;

  const style = document.createElement('style');
  style.id = 'gurmao-action-hover-styles';
  style.textContent = `
    @media (min-width: 768px) {
      body[data-page="restaurants-redesign"] #restaurantsList:not(.restaurants-row-view),
      #restaurantsList:not(.restaurants-row-view) {
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      }
    }

    #restaurantsList .flip-btn {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
    }

    #restaurantsList .save-btn,
    #restaurantsList .share-btn,
    #restaurantsList .flip-btn {
      transition: transform .22s ease, background-color .22s ease, border-color .22s ease, color .22s ease, box-shadow .22s ease !important;
      transform-origin: center;
      cursor: pointer;
    }

    #restaurantsList .save-btn:hover,
    #restaurantsList .share-btn:hover,
    #restaurantsList .flip-btn:hover {
      transform: translateY(-3px) scale(1.1) !important;
      background: rgba(212, 175, 55, .96) !important;
      border-color: #f4d66a !important;
      color: #090909 !important;
      box-shadow: 0 10px 26px rgba(0, 0, 0, .42), 0 0 24px rgba(212, 175, 55, .58) !important;
    }

    #restaurantsList .share-btn svg,
    #restaurantsList .flip-btn svg {
      transition: transform .22s ease;
    }

    #restaurantsList .share-btn:hover svg,
    #restaurantsList .flip-btn:hover svg {
      transform: rotate(8deg) scale(1.08);
    }

    #restaurantsList .save-btn:active,
    #restaurantsList .share-btn:active,
    #restaurantsList .flip-btn:active {
      transform: scale(.94) !important;
    }

    #restaurantsList .save-btn:focus-visible,
    #restaurantsList .share-btn:focus-visible,
    #restaurantsList .flip-btn:focus-visible {
      outline: 2px solid #f4d66a;
      outline-offset: 3px;
    }

    #restaurantsList .save-btn.saved {
      background: rgba(212, 175, 55, .96) !important;
      border-color: #f4d66a !important;
      color: #090909 !important;
      box-shadow: 0 0 24px rgba(212, 175, 55, .42) !important;
    }

    @media (prefers-reduced-motion: reduce) {
      #restaurantsList .save-btn,
      #restaurantsList .share-btn,
      #restaurantsList .flip-btn,
      #restaurantsList .share-btn svg,
      #restaurantsList .flip-btn svg {
        transition: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function initVibeTooltips(root = document) {
  injectRestaurantActionStyles();

  root.querySelectorAll('.vibe-tooltip').forEach(element => {
    const text = element.textContent?.trim();
    if (!text) return;
    const description = vibeDescriptions[text];
    if (description) element.setAttribute('data-tooltip', description);
  });
}

function addVibeTooltip(element, vibeKey) {
  const description = vibeDescriptions[vibeKey];
  if (description && element) {
    element.classList.add('vibe-tooltip');
    element.setAttribute('data-tooltip', description);
  }
}

function wrapVibeWithTooltip(vibeText) {
  const description = vibeDescriptions[vibeText];
  if (!description) return vibeText;
  return `<span class="vibe-tooltip" data-tooltip="${description}">${vibeText}</span>`;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initVibeTooltips());
} else {
  initVibeTooltips();
}

window.initVibeTooltips = initVibeTooltips;
window.addVibeTooltip = addVibeTooltip;
window.wrapVibeWithTooltip = wrapVibeWithTooltip;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initVibeTooltips, addVibeTooltip, wrapVibeWithTooltip, vibeDescriptions };
}
