// Import Supabase client
import { supabase } from './supabase-client.js';

// Get restaurant slug from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const restaurantSlug = urlParams.get('id');

// Global state
let currentRestaurant = null;
let selectedRating = 0;

// Vibe configuration
const vibeConfig = {
  'LUXE': { emoji: '🍷', label: 'LUXE', color: '#d4af37' },
  'DRAMA': { emoji: '🔥', label: 'DRAMA', color: '#ff4444' },
  'PURE': { emoji: '🌿', label: 'PURE', color: '#44ff44' },
  'DARK': { emoji: '🌙', label: 'DARK', color: '#666666' },
  'CHAOS': { emoji: '🌮', label: 'CHAOS', color: '#ff8844' },
  'CALM': { emoji: '🌊', label: 'CALM', color: '#4488ff' }
};

// Ensure loading state is visible immediately (before DOM loads)
if (!restaurantSlug) {
  // If no slug, prepare to show error
  window.addEventListener('DOMContentLoaded', () => {
    showError('Nebyl zadán žádný identifikátor restaurace');
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  if (!restaurantSlug) {
    return; // Already handled above
  }
  
  await loadRestaurantDetail();
  await initializeReviewSystem();
});

// Load restaurant detail from Supabase
async function loadRestaurantDetail() {
  try {
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select(`
        *,
        chefs (
          id,
          name,
          slug,
          vibe,
          signature_style,
          favorite_cuisines,
          image_url
        )
      `)
      .eq('slug', restaurantSlug)
      .single();
    
    if (error) throw error;
    
    if (!restaurant) {
      showError('Restaurace nenalezena');
      return;
    }
    
    currentRestaurant = restaurant;
    populateRestaurantDetail(restaurant);
    
    // Load similar restaurants
    if (restaurant.vibe) {
      loadSimilarRestaurants(restaurant.vibe, restaurant.slug);
    }
    
  } catch (error) {
    console.error('Error loading restaurant:', error);
    showError('Nepodařilo se načíst detail restaurace');
  }
}

// Populate restaurant detail into HTML
function populateRestaurantDetail(restaurant) {
  // Update page title and meta
  document.getElementById('pageTitle').textContent = `${restaurant.name} – GURMAO`;
  document.getElementById('pageDescription').content = restaurant.description || `${restaurant.name} v ${restaurant.city}`;
  document.getElementById('ogTitle').content = `${restaurant.name} – GURMAO`;
  document.getElementById('ogDescription').content = restaurant.description || `${restaurant.name} v ${restaurant.city}`;
  
  // Hero section
  const imageUrl = restaurant.image_url || restaurant.image || restaurant.photo_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800';
  document.getElementById('heroImage').style.backgroundImage = `url('${imageUrl}')`;
  
  // Vibe label
  const vibe = restaurant.vibe || '';
  const vibeKey = Object.keys(vibeConfig).find(key => vibe.includes(key));
  const vibeInfo = vibeKey ? vibeConfig[vibeKey] : { emoji: '📍', label: 'Restaurace' };
  document.getElementById('vibeLabel').innerHTML = `${vibeInfo.emoji} ${vibeInfo.label}${restaurant.cuisine_type ? ' · ' + restaurant.cuisine_type : ''}`;
  
  // Restaurant name and description
  document.getElementById('restaurantName').textContent = restaurant.name;
  document.getElementById('restaurantDescription').textContent = restaurant.description || 'Objevte tuto výjimečnou restauraci';
  
  // Meta info
  const metaInfo = [];
  if (restaurant.city) metaInfo.push(`📍 ${restaurant.city}`);
  if (restaurant.price_range) metaInfo.push(`💰 ${restaurant.price_range}`);
  if (restaurant.cuisine_type) metaInfo.push(`🍽️ ${restaurant.cuisine_type}`);
  document.getElementById('restaurantMetaInfo').innerHTML = metaInfo.map(info => `<span>${info}</span>`).join('');
  
  // Save button
  const saveBtn = document.getElementById('saveButton');
  saveBtn.setAttribute('data-save', restaurant.slug);
  
  // Quick Info
  const quickInfo = [];
  if (restaurant.cuisine_type) quickInfo.push({ icon: '🍽️', label: 'Typ kuchyně', value: restaurant.cuisine_type });
  if (restaurant.price_range) quickInfo.push({ icon: '💰', label: 'Cenová hladina', value: restaurant.price_range });
  if (restaurant.opening_hours) quickInfo.push({ icon: '🕐', label: 'Otevírací doba', value: restaurant.opening_hours });
  
  document.getElementById('quickInfo').innerHTML = quickInfo.map(info => `
    <div class="flex items-start gap-3">
      <span class="text-xl">${info.icon}</span>
      <div>
        <div class="text-white/60 text-xs mb-1">${info.label}</div>
        <div class="text-white">${info.value}</div>
      </div>
    </div>
  `).join('');
  
  // Chef Info
  if (restaurant.chefs && restaurant.chefs.length > 0) {
    const chef = restaurant.chefs[0];
    const chefInfo = [];
    
    chefInfo.push({ 
      icon: '👨‍🍳', 
      label: 'Jméno', 
      value: chef.name,
      link: `kuchar-detail.html?id=${chef.slug}`
    });
    
    if (chef.signature_style) {
      chefInfo.push({ icon: '✨', label: 'Styl', value: chef.signature_style });
    }
    
    if (chef.favorite_cuisines) {
      chefInfo.push({ icon: '🍽️', label: 'Oblíbená kuchyně', value: chef.favorite_cuisines });
    }
    
    document.getElementById('chefInfo').innerHTML = chefInfo.map(info => `
      <div class="flex items-start gap-3">
        <span class="text-xl">${info.icon}</span>
        <div class="flex-1 min-w-0">
          <div class="text-white/60 text-xs mb-1">${info.label}</div>
          ${info.link ? 
            `<a href="${info.link}" class="text-white hover:text-gurmaogold transition break-words">${info.value}</a>` :
            `<div class="text-white break-words">${info.value}</div>`
          }
        </div>
      </div>
    `).join('');
    
    document.getElementById('chefInfoCard').classList.remove('hidden');
  }
  
  // Contact Info
  const contactInfo = [];
  if (restaurant.phone) contactInfo.push({ icon: '📞', label: 'Telefon', value: restaurant.phone, link: `tel:${restaurant.phone}` });
  if (restaurant.email) contactInfo.push({ icon: '✉️', label: 'Email', value: restaurant.email, link: `mailto:${restaurant.email}` });
  if (restaurant.website) contactInfo.push({ icon: '🌐', label: 'Web', value: 'Navštívit web', link: restaurant.website });
  
  document.getElementById('contactInfo').innerHTML = contactInfo.map(info => `
    <div class="flex items-start gap-3">
      <span class="text-xl">${info.icon}</span>
      <div>
        <div class="text-white/60 text-xs mb-1">${info.label}</div>
        <a href="${info.link}" target="_blank" rel="noopener" class="text-white hover:text-gurmaogold transition">${info.value}</a>
      </div>
    </div>
  `).join('');
  
  // Location Info
  const locationInfo = [];
  if (restaurant.address) locationInfo.push({ icon: '📍', label: 'Adresa', value: restaurant.address });
  if (restaurant.city) locationInfo.push({ icon: '🏙️', label: 'Město', value: restaurant.city });
  if (restaurant.latitude && restaurant.longitude) {
    const mapsUrl = `https://www.google.com/maps?q=${restaurant.latitude},${restaurant.longitude}`;
    locationInfo.push({ icon: '🗺️', label: 'Mapa', value: 'Zobrazit na mapě', link: mapsUrl });
  }
  
  document.getElementById('locationInfo').innerHTML = locationInfo.map(info => `
    <div class="flex items-start gap-3">
      <span class="text-xl">${info.icon}</span>
      <div>
        <div class="text-white/60 text-xs mb-1">${info.label}</div>
        ${info.link ? 
          `<a href="${info.link}" target="_blank" rel="noopener" class="text-white hover:text-gurmaogold transition">${info.value}</a>` :
          `<div class="text-white">${info.value}</div>`
        }
      </div>
    </div>
  `).join('');
  
  // Long description
  document.getElementById('longDescription').textContent = restaurant.long_description || restaurant.description || 'Tato restaurace nabízí jedinečný gastronomický zážitek.';
  
  // Features/Tags
  const features = [];
  if (restaurant.vibe) features.push(restaurant.vibe);
  if (restaurant.atmosphere) features.push(restaurant.atmosphere);
  if (restaurant.specialty) features.push(restaurant.specialty);
  
  document.getElementById('featuresContainer').innerHTML = features.map(feature => `
    <span class="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm">${feature}</span>
  `).join('');
  
  // Show main content, hide loading
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('mainContent').classList.remove('hidden');
  
  // Initialize save button functionality
  if (typeof window.updateSaveButtons === 'function') {
    setTimeout(() => window.updateSaveButtons(), 100);
  }
  
  // Initialize share functionality
  initializeShareButton(restaurant);
}

// Initialize share button
function initializeShareButton(restaurant) {
  const shareBtn = document.getElementById('shareButton');
  shareBtn.addEventListener('click', async () => {
    const shareData = {
      title: restaurant.name,
      text: `Podívej se na ${restaurant.name} na GURMAO`,
      url: window.location.href
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      showToast('Odkaz zkopírován do schránky');
    }
  });
}

// Load similar restaurants
async function loadSimilarRestaurants(vibe, currentSlug) {
  try {
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*')
      .contains('vibe', [vibe.split(' ')[1]]) // Extract main vibe
      .neq('slug', currentSlug)
      .limit(3);
    
    if (error) throw error;
    
    if (restaurants && restaurants.length > 0) {
      document.getElementById('similarSection').classList.remove('hidden');
      
      document.getElementById('similarRestaurants').innerHTML = restaurants.map(r => {
        const imageUrl = r.image_url || r.image || r.photo_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800';
        return `
          <a href="restaurace-detail.html?id=${r.slug}" class="block rounded-3xl overflow-hidden bg-white/5 hover:bg-white/10 transition">
            <img src="${imageUrl}" alt="${r.name}" class="aspect-[3/4] w-full object-cover" />
            <div class="p-5">
              <div class="text-sm text-gurmaogold mb-1">${r.vibe || ''}</div>
              <div class="text-xl font-semibold mb-1">${r.name}</div>
              <div class="text-white/60 text-sm">${r.city || ''}</div>
            </div>
          </a>
        `;
      }).join('');
    }
    
  } catch (error) {
    console.error('Error loading similar restaurants:', error);
  }
}

// Initialize review system
async function initializeReviewSystem() {
  if (!window.ratingManager) {
    console.error('Rating manager not available');
    return;
  }
  
  try {
    await window.ratingManager.ensureReady();
  } catch (error) {
    console.error('Failed to initialize rating system:', error);
    return;
  }

  // Check if user is logged in
  const isLoggedIn = await window.ratingManager.isUserLoggedIn();
  
  if (isLoggedIn) {
    document.getElementById('writeReviewSection').classList.remove('hidden');
    document.getElementById('loginPrompt').classList.add('hidden');
  } else {
    document.getElementById('writeReviewSection').classList.add('hidden');
    document.getElementById('loginPrompt').classList.remove('hidden');
  }

  // Star rating interaction
  const starButtons = document.querySelectorAll('[data-star]');
  starButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const rating = parseInt(btn.dataset.star);
      selectedRating = rating;
      document.getElementById('ratingValue').value = rating;
      
      // Update star display
      starButtons.forEach((b, i) => {
        if (i < rating) {
          b.classList.remove('text-white/20');
          b.classList.add('text-gurmaogold');
        } else {
          b.classList.add('text-white/20');
          b.classList.remove('text-gurmaogold');
        }
      });
    });
  });

  // Handle review form submission
  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitReview();
    });
  }

  // Load existing reviews
  await loadReviews();
}

// Submit review
async function submitReview() {
  if (!selectedRating) {
    showToast('Prosím, vyberte hodnocení', 'error');
    return;
  }

  const reviewText = document.getElementById('reviewText').value;
  const reviewTitle = document.getElementById('reviewTitle').value;
  
  if (!reviewText.trim()) {
    showToast('Prosím, napište text recenze', 'error');
    return;
  }

  try {
    const submitBtn = document.getElementById('submitReviewBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Odesílám...';
    
    const success = await window.ratingManager.submitRating(
      restaurantSlug,
      selectedRating,
      reviewText,
      reviewTitle
    );
    
    if (success) {
      showToast('Recenze byla úspěšně odeslána');
      
      // Reset form
      document.getElementById('reviewForm').reset();
      selectedRating = 0;
      document.querySelectorAll('[data-star]').forEach(btn => {
        btn.classList.add('text-white/20');
        btn.classList.remove('text-gurmaogold');
      });
      
      // Reload reviews
      await loadReviews();
    } else {
      showToast('Nepodařilo se odeslat recenzi', 'error');
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Odeslat recenzi';
    
  } catch (error) {
    console.error('Error submitting review:', error);
    showToast('Chyba při odesílání recenze', 'error');
    
    const submitBtn = document.getElementById('submitReviewBtn');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Odeslat recenzi';
  }
}

// Load reviews
async function loadReviews() {
  try {
    const reviews = await window.ratingManager.getRestaurantRatings(restaurantSlug);
    
    if (!reviews || reviews.length === 0) {
      document.getElementById('noReviews').classList.remove('hidden');
      document.getElementById('reviewsList').classList.add('hidden');
      return;
    }
    
    document.getElementById('noReviews').classList.add('hidden');
    document.getElementById('reviewsList').classList.remove('hidden');
    
    // Calculate average rating
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    document.getElementById('avgRating').textContent = avgRating.toFixed(1);
    document.getElementById('avgStars').textContent = '★'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating));
    document.getElementById('reviewCount').textContent = `${reviews.length} ${reviews.length === 1 ? 'recenze' : reviews.length < 5 ? 'recenze' : 'recenzí'}`;
    
    // Render reviews
    document.getElementById('reviewsList').innerHTML = reviews.map(review => {
      const date = new Date(review.created_at).toLocaleDateString('cs-CZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      return `
        <div class="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold">${review.user_name || 'Anonym'}</span>
                <span class="text-gurmaogold text-sm">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
              </div>
              <div class="text-xs text-white/60">${date}</div>
            </div>
          </div>
          ${review.title ? `<h4 class="font-semibold mb-2">${review.title}</h4>` : ''}
          <p class="text-white/80 leading-relaxed">${review.comment}</p>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Error loading reviews:', error);
  }
}

// Show error state
function showError(message) {
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('errorState').classList.remove('hidden');
  
  if (message) {
    const errorMsg = document.querySelector('#errorState p');
    if (errorMsg) errorMsg.textContent = message;
  }
}

// Show toast notification
function showToast(message, type = 'success') {
  if (typeof window.showToast === 'function') {
    window.showToast(message, type);
  } else {
    alert(message);
  }
}
