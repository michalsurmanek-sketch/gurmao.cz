// Rating System for GURMAO.cz
// © 2025 GURMAO.cz

class RatingManager {
  constructor() {
    this.storageKey = 'gurmao_ratings';
    this.ratings = this.loadRatings();
  }

  loadRatings() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    } catch {
      return {};
    }
  }

  saveRatings() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.ratings));
  }

  // Rate a restaurant (1-5 stars)
  rate(restaurantId, stars) {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('gurmao_user') || 'null');
    if (!user?.id) {
      throw new Error('Pro hodnocení se musíte přihlásit');
    }

    if (stars < 1 || stars > 5) {
      throw new Error('Hodnocení musí být mezi 1 a 5');
    }

    if (!this.ratings[restaurantId]) {
      this.ratings[restaurantId] = {
        ratings: [],
        average: 0,
        count: 0
      };
    }

    // Check if user already rated this restaurant
    const existingRatingIndex = this.ratings[restaurantId].ratings.findIndex(
      r => r.userId === user.id
    );

    if (existingRatingIndex !== -1) {
      throw new Error('Tuto restauraci jste již ohodnotili');
    }

    // Add user's rating
    this.ratings[restaurantId].ratings.push({
      stars: stars,
      timestamp: Date.now(),
      userId: user.id
    });

    // Recalculate average
    this.recalculateAverage(restaurantId);
    this.saveRatings();

    return this.ratings[restaurantId];
  }

  // Get user's current rating for a restaurant
  getUserRating(restaurantId) {
    const user = JSON.parse(localStorage.getItem('gurmao_user') || 'null');
    if (!user?.id) return null;
    
    const restaurantRatings = this.ratings[restaurantId];
    
    if (!restaurantRatings) return null;

    const userRating = restaurantRatings.ratings.find(r => r.userId === user.id);

    return userRating ? userRating.stars : null;
  }

  // Check if user has already rated a restaurant
  hasUserRated(restaurantId) {
    const user = JSON.parse(localStorage.getItem('gurmao_user') || 'null');
    if (!user?.id) return false;
    
    const restaurantRatings = this.ratings[restaurantId];
    if (!restaurantRatings) return false;

    return restaurantRatings.ratings.some(r => r.userId === user.id);
  }

  // Check if user is logged in
  isUserLoggedIn() {
    const user = JSON.parse(localStorage.getItem('gurmao_user') || 'null');
    return !!user?.id;
  }

  // Get average rating for a restaurant
  getAverage(restaurantId) {
    return this.ratings[restaurantId]?.average || 0;
  }

  // Get rating count
  getCount(restaurantId) {
    return this.ratings[restaurantId]?.count || 0;
  }

  // Recalculate average rating
  recalculateAverage(restaurantId) {
    const restaurantRatings = this.ratings[restaurantId];
    if (!restaurantRatings || restaurantRatings.ratings.length === 0) {
      restaurantRatings.average = 0;
      restaurantRatings.count = 0;
      return;
    }

    const sum = restaurantRatings.ratings.reduce((acc, r) => acc + r.stars, 0);
    restaurantRatings.average = Math.round((sum / restaurantRatings.ratings.length) * 10) / 10;
    restaurantRatings.count = restaurantRatings.ratings.length;
  }

  // Get current user ID
  getCurrentUserId() {
    const user = JSON.parse(localStorage.getItem('gurmao_user') || 'null');
    return user?.id || null;
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
  renderInteractiveStars(restaurantId, currentRating = 0) {
    const isLoggedIn = this.isUserLoggedIn();
    const hasRated = this.hasUserRated(restaurantId);
    const userRating = this.getUserRating(restaurantId);
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
        const result = this.rate(restaurantId, stars);
        
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
        if (window.toastSuccess) {
          window.toastSuccess(`Ohodnoceno ${stars} ${stars === 1 ? 'hvězdičkou' : stars < 5 ? 'hvězdičkami' : 'hvězdičkami'}!`);
        }

        // Trigger update event
        window.dispatchEvent(new CustomEvent('ratingUpdated', { 
          detail: { restaurantId, stars, average: result.average }
        }));

      } catch (error) {
        console.error('Rating error:', error);
        if (window.toastError) {
          window.toastError(error.message || 'Nepodařilo se ohodnotit');
        }
      }
    });
  }
}

// Global instance
window.ratingManager = new RatingManager();

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  window.ratingManager.initializeInteractive();
});

// Convenience functions
window.rateRestaurant = (id, stars) => window.ratingManager.rate(id, stars);
window.getRestaurantRating = (id) => window.ratingManager.getAverage(id);
window.renderStars = (rating, size) => window.ratingManager.renderStars(rating, size);
