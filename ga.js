// Google Analytics 4 - GURMAO.cz
// © 2025 GURMAO.cz

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. Jdi na https://analytics.google.com
 * 2. Vytvoř nový property pro gurmao.cz
 * 3. Zkopíruj Measurement ID (formát: G-XXXXXXXXXX)
 * 4. Nahraď 'GA_MEASUREMENT_ID' níže
 * 5. Přidej tento script do <head> všech HTML stránek:
 *    <script src="ga.js"></script>
 */

const GA_MEASUREMENT_ID = 'GA_MEASUREMENT_ID'; // TODO: Nahraď skutečným ID

// Initialize Google Analytics
(function() {
  // Skip if already loaded or if ID not configured
  if (window.gtag || GA_MEASUREMENT_ID === 'GA_MEASUREMENT_ID') {
    console.log('GA: Skipped (not configured or already loaded)');
    return;
  }

  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    'send_page_view': true,
    'anonymize_ip': true // GDPR compliance
  });

  console.log('GA: Initialized with ID:', GA_MEASUREMENT_ID);
})();

// ======================
// CUSTOM EVENT TRACKING
// ======================

/**
 * Track custom events
 * @param {string} eventName - Name of the event
 * @param {object} params - Event parameters
 */
function trackEvent(eventName, params = {}) {
  if (window.gtag) {
    gtag('event', eventName, params);
    console.log('GA Event:', eventName, params);
  }
}

/**
 * Track restaurant view
 */
function trackRestaurantView(restaurantName, vibe) {
  trackEvent('view_restaurant', {
    restaurant_name: restaurantName,
    vibe: vibe
  });
}

/**
 * Track restaurant save
 */
function trackRestaurantSave(restaurantName) {
  trackEvent('save_restaurant', {
    restaurant_name: restaurantName
  });
}

/**
 * Track AI recommendation
 */
function trackAIRecommendation(mood, result) {
  trackEvent('ai_recommendation', {
    mood: mood,
    recommended: result
  });
}

/**
 * Track review submission
 */
function trackReviewSubmit(restaurantName, rating) {
  trackEvent('submit_review', {
    restaurant_name: restaurantName,
    rating: rating
  });
}

/**
 * Track user signup
 */
function trackSignup(method) {
  trackEvent('sign_up', {
    method: method // 'email' or 'google'
  });
}

/**
 * Track user login
 */
function trackLogin(method) {
  trackEvent('login', {
    method: method // 'email' or 'google'
  });
}

// Make tracking functions globally available
window.trackEvent = trackEvent;
window.trackRestaurantView = trackRestaurantView;
window.trackRestaurantSave = trackRestaurantSave;
window.trackAIRecommendation = trackAIRecommendation;
window.trackReviewSubmit = trackReviewSubmit;
window.trackSignup = trackSignup;
window.trackLogin = trackLogin;
