import { supabase } from './supabase-client.js';

// Get chef slug from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const chefSlug = urlParams.get('id');

// State
const loadingState = document.getElementById('loadingState');
const mainContent = document.getElementById('mainContent');

// Load chef detail
async function loadChefDetail() {
  if (!chefSlug) {
    showError('Kuchař nebyl nalezen');
    return;
  }

  try {
    // Fetch chef data with restaurant info
    const { data: chef, error } = await supabase
      .from('chefs')
      .select(`
        *,
        restaurants (
          id,
          slug,
          name,
          city,
          vibe,
          image_url
        )
      `)
      .eq('slug', chefSlug)
      .single();

    if (error) throw error;

    if (!chef) {
      showError('Kuchař nebyl nalezen');
      return;
    }

    // Populate chef details
    populateChefDetail(chef);
    
    // Load related restaurants if any
    if (chef.restaurant_id) {
      loadRelatedRestaurants(chef.restaurant_id);
    }

    // Show main content
    loadingState.classList.add('hidden');
    mainContent.classList.remove('hidden');

  } catch (err) {
    console.error('Error loading chef:', err);
    showError('Chyba při načítání kuchaře');
  }
}

// Populate chef detail page
function populateChefDetail(chef) {
  // Meta tags
  document.getElementById('pageTitle').textContent = `${chef.name} – GURMAO`;
  document.getElementById('pageDescription').content = chef.bio || chef.description || 'Detail kuchaře';
  document.getElementById('ogTitle').content = `${chef.name} – GURMAO`;
  document.getElementById('ogDescription').content = chef.bio || chef.description || '';

  // Hero section
  if (chef.image_url) {
    document.getElementById('heroImage').style.backgroundImage = `url('${chef.image_url}')`;
  }

  // Chef info
  document.getElementById('chefName').textContent = chef.name;
  
  if (chef.role && chef.vibe) {
    document.getElementById('chefRole').innerHTML = `🧑‍🍳 ${chef.role} · ${chef.vibe}`;
  } else if (chef.role) {
    document.getElementById('chefRole').innerHTML = `🧑‍🍳 ${chef.role}`;
  }

  if (chef.bio) {
    document.getElementById('chefBio').textContent = chef.bio;
  }

  if (chef.description) {
    document.getElementById('chefDescription').textContent = chef.description;
  }

  // Signature style
  if (chef.signature_style || chef.specialty) {
    document.getElementById('chefSignature').textContent = chef.signature_style || chef.specialty;
  }

  // Favorite cuisines
  if (chef.favorite_cuisines && chef.favorite_cuisines.trim() !== '') {
    document.getElementById('chefCuisines').textContent = chef.favorite_cuisines;
  }

  // Restaurant
  if (chef.restaurants) {
    const restaurantText = chef.restaurants.city 
      ? `${chef.restaurants.name} · ${chef.restaurants.city}`
      : chef.restaurants.name;
    document.getElementById('chefRestaurant').textContent = restaurantText;
    
    // Restaurant link
    const restaurantLink = document.getElementById('restaurantLink');
    restaurantLink.href = `restaurace-detail.html?id=${chef.restaurants.slug}`;
    restaurantLink.classList.remove('hidden');
  }

  // Specialties (if available)
  if (chef.specialties) {
    const specialtiesArray = chef.specialties.split('·').map(s => s.trim());
    const specialtiesHTML = specialtiesArray.map(s => `
      <div class="rounded-2xl p-4 bg-white/5 text-center">
        <div class="text-sm text-white/60">${s}</div>
      </div>
    `).join('');
    document.getElementById('chefSpecialties').innerHTML = specialtiesHTML;
  }
}

// Load related restaurants
async function loadRelatedRestaurants(restaurantId) {
  try {
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (error || !restaurant) return;

    const html = `
      <a href="restaurace-detail.html?id=${restaurant.slug}" class="block rounded-3xl overflow-hidden bg-white/5 hover:bg-white/10 transition">
        <div class="aspect-square bg-cover bg-center" style="background-image: url('${restaurant.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}')"></div>
        <div class="p-6">
          <div class="text-gurmaogold text-sm mb-1">${restaurant.vibe || 'Restaurace'}</div>
          <div class="text-2xl font-semibold">${restaurant.name}</div>
          <div class="text-white/60 mt-1">${restaurant.city || ''}</div>
        </div>
      </a>
    `;

    document.getElementById('relatedRestaurants').innerHTML = html;
  } catch (err) {
    console.error('Error loading related restaurants:', err);
  }
}

// Show error
function showError(message) {
  loadingState.innerHTML = `
    <div class="text-center">
      <div class="text-4xl mb-4">😕</div>
      <div class="text-white/60 mb-4">${message}</div>
      <a href="kuchar.html" class="px-6 py-3 rounded-full bg-gurmaogold text-black font-bold inline-block hover:scale-105 transition">
        ← Zpět na kuchaře
      </a>
    </div>
  `;
  loadingState.classList.remove('hidden');
  mainContent.classList.add('hidden');
}

// Initialize
loadChefDetail();
