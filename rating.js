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
    if (stars < 1 || stars > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    if (!this.ratings[restaurantId]) {
      this.ratings[restaurantId] = {
        ratings: [],
        average: 0,
        count: 0
      };
    }

    // Add user's rating (in real app, would include user ID)
    this.ratings[restaurantId].ratings.push({
      stars: stars,
      timestamp: Date.now(),
      userId: this.getCurrentUserId()
    });

    // Recalculate average
    this.recalculateAverage(restaurantId);
    this.saveRatings();

    return this.ratings[restaurantId];
  }

  // Get user's current rating for a restaurant
  getUserRating(restaurantId) {
    const userId = this.getCurrentUserId();
    const restaurantRatings = this.ratings[restaurantId];
    
    if (!restaurantRatings) return null;

    const userRating = restaurantRatings.ratings
      .filter(r => r.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    return userRating ? userRating.stars : null;
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

  // Get current user ID (from localStorage or generate temporary)
  getCurrentUserId() {
    const user = JSON.parse(localStorage.getItem('gurmao_user') || 'null');
    if (user?.id) return user.id;

    // Generate temporary user ID for anonymous users
    let tempId = localStorage.getItem('gurmao_temp_user_id');
    if (!tempId) {
      tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('gurmao_temp_user_id', tempId);
    }
    return tempId;
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
    const html = `
      <div class="rating-interactive inline-flex items-center gap-1" data-restaurant="${restaurantId}">
        ${[1, 2, 3, 4, 5].map(star => `
          <button 
            type="button"
            class="rating-star text-2xl transition-all hover:scale-110 ${star <= currentRating ? 'text-gurmaogold' : 'text-white/20'}"
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
        // Visual feedback
        const allStars = container.querySelectorAll('.rating-star');
        allStars.forEach((s, idx) => {
          if (idx < stars) {
            s.classList.remove('text-white/20');
            s.classList.add('text-gurmaogold');
          } else {
            s.classList.add('text-white/20');
            s.classList.remove('text-gurmaogold');
          }
        });

        // Save rating
        const result = this.rate(restaurantId, stars);
        
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
          window.toastError('Nepodařilo se ohodnotit');
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
