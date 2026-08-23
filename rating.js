// GURMAO rating runtime.
// Numeric star ratings live in `ratings`; text reviews live in `reviews`.

class RatingManager {
  constructor() {
    this.module = null;
    this.supabase = null;
    this.ready = false;
    this.initPromise = this.initSupabase();
    this.statsCache = new Map();
    this.userRatingsCache = new Map();
    this.cacheLoaded = false;
  }

  async initSupabase() {
    try {
      this.module = await import('./supabase-client.js');
      this.supabase = this.module.supabase;
      this.ready = true;
    } catch (error) {
      console.error('Rating system failed to load:', error);
      this.ready = false;
    }
  }

  async ensureReady() {
    if (!this.ready) await this.initPromise;
    if (!this.ready || !this.module || !this.supabase) throw new Error('Rating systém se nepodařilo načíst');
  }

  async loadAllRatings() {
    if (this.cacheLoaded) return;
    await this.ensureReady();
    try {
      const [stats, userRatings] = await Promise.all([
        this.module.getAllRatingsStats(),
        this.module.getAllUserRatings()
      ]);
      this.statsCache = stats;
      this.userRatingsCache = userRatings;
    } catch (error) {
      console.warn('Rating cache is unavailable:', error);
      this.statsCache = new Map();
      this.userRatingsCache = new Map();
    } finally {
      this.cacheLoaded = true;
    }
  }

  async rate(restaurantId, stars) {
    await this.ensureReady();
    const numericStars = Number(stars);
    if (!Number.isInteger(numericStars) || numericStars < 1 || numericStars > 5) {
      throw new Error('Hodnocení musí být celé číslo od 1 do 5');
    }
    const result = await this.module.rateRestaurant(String(restaurantId), numericStars);
    this.statsCache.delete(String(restaurantId));
    this.userRatingsCache.set(String(restaurantId), numericStars);
    return result;
  }

  async getUserRating(restaurantId) {
    await this.ensureReady();
    const key = String(restaurantId);
    if (this.cacheLoaded && this.userRatingsCache.has(key)) return this.userRatingsCache.get(key);
    return this.module.getUserRating(key);
  }

  async isUserLoggedIn() {
    await this.ensureReady();
    const { data: { user }, error } = await this.supabase.auth.getUser();
    return !error && Boolean(user);
  }

  async getRestaurantRatingStats(restaurantId) {
    await this.ensureReady();
    const key = String(restaurantId);
    if (this.cacheLoaded && this.statsCache.has(key)) return this.statsCache.get(key);
    return this.module.getRestaurantRatingStats(key);
  }

  async getAverage(restaurantId) {
    const stats = await this.getRestaurantRatingStats(restaurantId);
    return Number(stats?.average_rating || 0);
  }

  async getCount(restaurantId) {
    const stats = await this.getRestaurantRatingStats(restaurantId);
    return Number(stats?.rating_count || 0);
  }

  async resolveRestaurant(identifier) {
    await this.ensureReady();
    const value = String(identifier || '').trim();
    if (!value) throw new Error('Chybí restaurace');

    if (/^[0-9a-f-]{36}$/i.test(value)) {
      const { data, error } = await this.supabase
        .from('restaurants')
        .select('id,slug,name')
        .eq('id', value)
        .maybeSingle();
      if (error) throw error;
      if (data) return data;
    }

    const { data, error } = await this.supabase
      .from('restaurants')
      .select('id,slug,name')
      .eq('slug', value)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Restaurace nebyla nalezena');
    return data;
  }

  async submitRating(restaurantIdentifier, rating, comment, title = null) {
    await this.ensureReady();
    const numericRating = Number(rating);
    const reviewText = String(comment || '').trim();
    const reviewTitle = String(title || '').trim();
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      throw new Error('Hodnocení musí být celé číslo od 1 do 5');
    }
    if (reviewText.length < 3 || reviewText.length > 3000) {
      throw new Error('Recenze musí mít 3 až 3000 znaků');
    }
    if (reviewTitle.length > 120) throw new Error('Nadpis recenze je příliš dlouhý');

    const { data: { user }, error: authError } = await this.supabase.auth.getUser();
    if (authError || !user) throw new Error('Musíte být přihlášeni pro přidání recenze');

    const restaurant = await this.resolveRestaurant(restaurantIdentifier);
    await this.module.addReview(
      user.id,
      restaurant.id,
      numericRating,
      reviewTitle || null,
      reviewText
    );
    return true;
  }

  async getRestaurantRatings(restaurantIdentifier) {
    await this.ensureReady();
    const restaurant = await this.resolveRestaurant(restaurantIdentifier);
    const reviews = await this.module.getRestaurantReviews(restaurant.id);
    return (reviews || []).map(review => ({
      ...review,
      rating: Number(review.rating || 0),
      comment: String(review.text || ''),
      user_name: String(review.profiles?.display_name || 'Anonym')
    }));
  }

  renderStars(rating, size = 'md') {
    const value = Math.max(0, Math.min(5, Number(rating) || 0));
    const sizeClass = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }[size] || 'text-sm';
    const rounded = Math.round(value);
    return `<div class="inline-flex items-center gap-0.5 ${sizeClass}" aria-label="Hodnocení ${value.toFixed(1)} z 5">${[1,2,3,4,5].map(star => `<span class="${star <= rounded ? 'text-gurmaogold' : 'text-white/20'}" aria-hidden="true">${star <= rounded ? '●' : '○'}</span>`).join('')}</div>`;
  }

  async renderInteractiveStars(restaurantId, currentRating = 0) {
    const isLoggedIn = await this.isUserLoggedIn();
    const userRating = isLoggedIn ? await this.getUserRating(restaurantId) : null;
    const finalRating = Number(userRating ?? currentRating ?? 0);

    if (userRating != null) {
      return `<div class="rating-locked inline-flex items-center gap-1" data-restaurant="${String(restaurantId)}">${[1,2,3,4,5].map(star => `<span class="text-sm ${star <= finalRating ? 'text-gurmaogold opacity-70' : 'text-white/15'}" aria-hidden="true">●</span>`).join('')}<span class="ml-2 text-xs text-white/40">Již ohodnoceno</span></div>`;
    }

    if (!isLoggedIn) {
      return `<div class="rating-login inline-flex items-center gap-2">${[1,2,3,4,5].map(() => '<span class="text-sm text-white/10" aria-hidden="true">○</span>').join('')}<a href="login.html" class="ml-2 text-xs text-gurmaogold hover:underline">Přihlásit se k hodnocení</a></div>`;
    }

    return `<div class="rating-interactive inline-flex items-center gap-1" data-restaurant="${String(restaurantId)}">${[1,2,3,4,5].map(star => `<button type="button" class="rating-star text-base transition-all hover:scale-110 ${star <= finalRating ? 'text-gurmaogold opacity-70' : 'text-white/20 opacity-50'}" data-star="${star}" aria-label="Ohodnotit ${star} z 5">●</button>`).join('')}</div>`;
  }

  initializeInteractive() {
    if (window.__gurmaoRatingInteractionInitialized) return;
    window.__gurmaoRatingInteractionInitialized = true;

    document.addEventListener('click', async event => {
      const star = event.target.closest('.rating-star');
      if (!star || star.disabled) return;
      const container = star.closest('.rating-interactive');
      const restaurantId = container?.dataset.restaurant;
      const stars = Number(star.dataset.star);
      if (!restaurantId || !Number.isInteger(stars)) return;

      const buttons = [...container.querySelectorAll('.rating-star')];
      buttons.forEach(button => { button.disabled = true; });
      try {
        await this.rate(restaurantId, stars);
        buttons.forEach((button, index) => {
          button.classList.toggle('text-gurmaogold', index < stars);
          button.classList.toggle('text-white/20', index >= stars);
        });
        window.dispatchEvent(new CustomEvent('ratingUpdated', { detail: { restaurantId, stars } }));
        window.toast?.show?.(`Hodnocení uloženo: ${stars}/5`, 'success');
      } catch (error) {
        console.error('Rating save failed:', error);
        buttons.forEach(button => { button.disabled = false; });
        window.toast?.show?.(error.message || 'Nepodařilo se uložit hodnocení', 'error');
      }
    });
  }
}

const ratingManager = new RatingManager();
window.ratingManager = ratingManager;
export default ratingManager;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ratingManager.initializeInteractive(), { once: true });
} else {
  ratingManager.initializeInteractive();
}

window.rateRestaurant = (id, stars) => ratingManager.rate(id, stars);
window.getRestaurantRating = id => ratingManager.getAverage(id);
window.renderStars = (rating, size) => ratingManager.renderStars(rating, size);
