// GURMAO Vibe Tooltips

const vibeDescriptions = {
  '🍷 LUXE': 'Elegantní zážitek, důraz na detail, klidná atmosféra',
  '🔥 DRAMA': 'Výrazné chutě, silná osobnost, nezapomenutelné kombinace',
  '🌮 CHAOS': 'Uvolněný styl, pestrost, radost z jídla bez pravidel',
  '🌿 PURE': 'Čisté suroviny, jednoduchost, chuť v hlavní roli',
  '🖤 DARK': 'Intimní atmosféra, večerní vibe, tlumené světlo',
  '🌊 CALM': 'Klidná atmosféra, harmonie, pohoda',
  
  // Alternative formats (without emoji)
  'LUXE': 'Elegantní zážitek, důraz na detail, klidná atmosféra',
  'DRAMA': 'Výrazné chutě, silná osobnost, nezapomenutelné kombinace',
  'CHAOS': 'Uvolněný styl, pestrost, radost z jídla bez pravidel',
  'PURE': 'Čisté suroviny, jednoduchost, chuť v hlavní roli',
  'DARK': 'Intimní atmosféra, večerní vibe, tlumené světlo',
  'CALM': 'Klidná atmosféra, harmonie, pohoda',
  
  // Czech variants
  'Luxe': 'Elegantní zážitek, důraz na detail, klidná atmosféra',
  'Drama': 'Výrazné chutě, silná osobnost, nezapomenutelné kombinace',
  'Chaos': 'Uvolněný styl, pestrost, radost z jídla bez pravidel',
  'Pure': 'Čisté suroviny, jednoduchost, chuť v hlavní roli',
  'Dark': 'Intimní atmosféra, večerní vibe, tlumené světlo',
  'Calm': 'Klidná atmosféra, harmonie, pohoda'
};

/**
 * Initialize vibe tooltips on the page
 * Automatically finds elements with vibe text and adds tooltips
 */
function initVibeTooltips() {
  // Find all elements that might contain vibe information
  const vibeSelectors = [
    '[class*="vibe"]',
    '[data-vibe]',
    'button:contains("🍷")',
    'button:contains("🔥")',
    'button:contains("🌮")',
    'button:contains("🌿")',
    'button:contains("🖤")',
    'button:contains("🌊")',
    'div:contains("🍷 LUXE")',
    'div:contains("🔥 DRAMA")',
    'div:contains("🌮 CHAOS")',
    'div:contains("🌿 PURE")',
    'div:contains("🖤 DARK")',
    'div:contains("🌊 CALM")'
  ];
  
  // Process all text nodes and elements that might contain vibe text
  document.querySelectorAll('*').forEach(element => {
    const text = element.textContent?.trim();
    if (!text) return;
    
    // Skip if already processed
    if (element.classList.contains('vibe-tooltip')) return;
    
    // Check if element contains vibe text
    for (const [key, description] of Object.entries(vibeDescriptions)) {
      if (text.includes(key)) {
        // Only add tooltip to elements that directly contain the vibe text
        // (not parent containers)
        const children = element.children;
        const hasChildrenWithText = Array.from(children).some(child => 
          child.textContent?.trim().includes(key)
        );
        
        if (!hasChildrenWithText || children.length === 0) {
          element.classList.add('vibe-tooltip');
          element.setAttribute('data-tooltip', description);
          break;
        }
      }
    }
  });
}

/**
 * Manually add tooltip to a specific element
 * @param {HTMLElement} element - The element to add tooltip to
 * @param {string} vibeKey - The vibe key (e.g., '🍷 LUXE')
 */
function addVibeTooltip(element, vibeKey) {
  const description = vibeDescriptions[vibeKey];
  if (description && element) {
    element.classList.add('vibe-tooltip');
    element.setAttribute('data-tooltip', description);
  }
}

/**
 * Wrap vibe text in a span with tooltip
 * Useful for dynamic content
 * @param {string} vibeText - The vibe text (e.g., '🍷 LUXE')
 * @returns {string} - HTML string with tooltip wrapper
 */
function wrapVibeWithTooltip(vibeText) {
  const description = vibeDescriptions[vibeText];
  if (!description) return vibeText;
  
  return `<span class="vibe-tooltip" data-tooltip="${description}">${vibeText}</span>`;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVibeTooltips);
} else {
  initVibeTooltips();
}

// Re-initialize when dynamic content is added
const observer = new MutationObserver((mutations) => {
  let shouldReinit = false;
  
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length > 0) {
      shouldReinit = true;
    }
  });
  
  if (shouldReinit) {
    // Debounce re-initialization
    clearTimeout(observer.debounceTimer);
    observer.debounceTimer = setTimeout(initVibeTooltips, 100);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Export functions for external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initVibeTooltips,
    addVibeTooltip,
    wrapVibeWithTooltip,
    vibeDescriptions
  };
}
