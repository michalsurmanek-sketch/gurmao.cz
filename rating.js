// Rating System for GURMAO.cz
// © 2025 GURMAO.cz
// Now uses Supabase for persistent storage

class RatingManager {
  constructor() {
    this.supabase = null;
    this.rateRestaurantFn = null;
    this.getUserRatingFn = null;
    this.getRatingStatsFn = null;
    this.ready = false;
    this.initPromise = this.initSupabase();
  }

  async initSupabase() {
    try {
      const module = await import('./supabase-client.js');
      this.supabase = module.supabase;
      this.rateRestaurantFn = module.rateRestaurant;
      this.getUserRatingFn = module.getUserRating;
      this.getRatingStatsFn = module.getRestaurantRatingStats;
      this.ready = true;
      console.log('Rating system initialized successfully');
    } catch (error) {
      console.error('Failed to load Supabase:', error);
      this.ready = false;
    }
  }

  async ensureReady() {
    if (!this.ready) {
      await this.initPromise;
    }
    if (!this.ready) {
      throw new Error('Rating systém se nepodařilo načíst');
    }
  }

  // Rate a restaurant (1-5 stars)
  async rate(restaurantId, stars) {
    await this.ensureReady();

    if (stars < 1 || stars > 5) {
      throw new Error('Hodnocení musí být mezi 1 a 5');
    }

    try {
      const result = await this.rateRestaurantFn(restaurantId, stars);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get user's current rating for a restaurant
  async getUserRating(restaurantId) {
    await this.ensureReady();
    
    try {
      return await this.getUserRatingFn(restaurantId);
    } catch (error) {
      console.error('Error getting user rating:', error);
      return null;
    }
  }

  // Check if user is logged in
  async isUserLoggedIn() {
    await this.ensureReady();
    
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      return !!user;
    } catch {
      return false;
    }
  }

  // Get average rating for a restaurant
  async getAverage(restaurantId) {
    await this.ensureReady();
    
    try {
      const stats = await this.getRatingStatsFn(restaurantId);
      return stats.average_rating || 0;
    } catch (error) {
      console.error('Error getting rating stats:', error);
      return 0;
    }
  }

  // Get rating count
  async getCount(restaurantId) {
    await this.ensureReady();
    
    try {
      const stats = await this.getRatingStatsFn(restaurantId);
      return stats.rating_count || 0;
    } catch (error) {
      console.error('Error getting rating count:', error);
      return 0;
    }
  }

  // Get rating statistics
  async getRestaurantRatingStats(restaurantId) {
    await this.ensureReady();
    
    try {
      return await this.getRatingStatsFn(restaurantId);
    } catch (error) {
      console.error('Error getting rating stats:', error);
      return {
        restaurant_id: restaurantId,
        rating_count: 0,
        average_rating: 0
      };
    }
  }

  // Render star rating (static display)
  renderStars(rating, size = 'md') {
    const sizeClass = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-xl'
    }[size] || 'text-base';

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let html = `<div class="inline-flex items-center gap-0.5 ${sizeClass}">`;
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      html += '<span class="text-gurmaogold">⭐</span>';
    }
    
    // Half star
    if (hasHalfStar) {
      html += '<span class="text-gurmaogold">✨</span>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      html += '<span class="text-white/20">⭐</span>';
    }
    
    html += `</div>`;
    return html;
  }

  // Render interactive star rating
  async renderInteractiveStars(restaurantId, currentRating = 0) {
    const isLoggedIn = await this.isUserLoggedIn();
    const userRating = isLoggedIn ? await this.getUserRating(restaurantId) : null;
    const hasRated = userRating !== null;
    const finalRating = userRating || currentRating;
    
    // If user already rated, show locked rating
    if (hasRated) {
      const html = `
        <div class="rating-locked inline-flex items-center gap-1" data-restaurant="${restaurantId}">
          ${[1, 2, 3, 4, 5].map(star => `
            <span 
              class="text-2xl ${star <= finalRating ? 'text-gurmaogold' : 'text-white/20'}"
              title="Již jste ohodnotili ${finalRating} ${finalRating === 1 ? 'hvězdičkou' : finalRating < 5 ? 'hvězdičkami' : 'hvězdičkami'}"
            >⭐</span>
          `).join('')}
          <span class="ml-2 text-xs text-white/40">Již ohodnoceno</span>
        </div>
      `;
      return html;
    }
    
    // If not logged in, show login prompt
    if (!isLoggedIn) {
      const html = `
        <div class="rating-login inline-flex items-center gap-2">
          ${[1, 2, 3, 4, 5].map(star => `
            <span class="text-2xl text-white/10">⭐</span>
          `).join('')}
          <a href="login.html" class="ml-2 text-xs text-gurmaogold hover:underline">Přihlásit se k hodnocení</a>
        </div>
      `;
      return html;
    }
    
    // Show interactive rating
    const html = `
      <div class="rating-interactive inline-flex items-center gap-1" data-restaurant="${restaurantId}">
        ${[1, 2, 3, 4, 5].map(star => `
          <button 
            type="button"
            class="rating-star text-2xl transition-all hover:scale-110 ${star <= finalRating ? 'text-gurmaogold' : 'text-white/20'}"
            data-star="${star}"
            title="${star} ${star === 1 ? 'hvězdička' : star < 5 ? 'hvězdičky' : 'hvězdiček'}"
          >⭐</button>
        `).join('')}
      </div>
    `;
    return html;
  }

  // Initialize interactive rating listeners
  initializeInteractive() {
    document.addEventListener('click', async (e) => {
      const star = e.target.closest('.rating-star');
      if (!star) return;

      const container = star.closest('.rating-interactive');
      const restaurantId = container.dataset.restaurant;
      const stars = parseInt(star.dataset.star);

      try {
        // Save rating
        const result = await this.rate(restaurantId, stars);
        
        // Update UI to locked state
        const allStars = container.querySelectorAll('.rating-star');
        allStars.forEach((s, idx) => {
          if (idx < stars) {
            s.classList.remove('text-white/20');
            s.classList.add('text-gurmaogold');
          } else {
            s.classList.add('text-white/20');
            s.classList.remove('text-gurmaogold');
          }
          // Disable buttons
          s.disabled = true;
          s.style.cursor = 'default';
          s.classList.remove('hover:scale-110');
        });
        
        // Add locked message
        const lockedMsg = document.createElement('span');
        lockedMsg.className = 'ml-2 text-xs text-white/40';
        lockedMsg.textContent = 'Již ohodnoceno';
        container.appendChild(lockedMsg);
        
        // Show toast
        if (window.toast) {
          window.toast.show(`⭐ Ohodnoceno ${stars} ${stars === 1 ? 'hvězdičkou' : stars < 5 ? 'hvězdičkami' : 'hvězdičkami'}!`, 'success');
        }

        // Trigger update event
        const stats = await window.ratingManager.getRestaurantRatingStats(restaurantId);
        window.dispatchEvent(new CustomEvent('ratingUpdated', { 
          detail: { restaurantId, stars, average: stats?.average_rating || stars }
        }));

      } catch (error) {
        console.error('Rating error:', error);
        if (window.toast) {
          window.toast.show(error.message || 'Nepodařilo se ohodnotit', 'error');
        }
      }
    });
  }
}

// Global instance
const ratingManager = new RatingManager();
window.ratingManager = ratingManager;
export default ratingManager;

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ratingManager.initializeInteractive();
  });
} else {
  // DOM already loaded
  window.ratingManager.initializeInteractive();
}

// Convenience functions
window.rateRestaurant = (id, stars) => window.ratingManager.rate(id, stars);
window.getRestaurantRating = (id) => window.ratingManager.getAverage(id);
window.renderStars = (rating, size) => window.ratingManager.renderStars(rating, size);
