import { supabase } from './supabase-client.js';
import { escapeHtml, safeImageUrl, safeWebUrl } from './security-utils.js';

// Načti nový prémiový vzhled detailu kuchaře.
if (!document.querySelector('link[href="chef-detail-redesign.css"]')) {
  const redesign = document.createElement('link');
  redesign.rel = 'stylesheet';
  redesign.href = 'chef-detail-redesign.css';
  document.head.appendChild(redesign);
}

const fallbackRestaurantImage = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4';

const urlParams = new URLSearchParams(window.location.search);
const chefSlug = urlParams.get('id');
const loadingState = document.getElementById('loadingState');
const mainContent = document.getElementById('mainContent');

async function loadChefDetail() {
  if (!chefSlug) {
    showError('Kuchař nebyl nalezen');
    return;
  }

  try {
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

    populateChefDetail(chef);
    if (chef.restaurant_id) loadRelatedRestaurants(chef.restaurant_id);

    loadingState.classList.add('hidden');
    mainContent.classList.remove('hidden');
  } catch (err) {
    console.error('Error loading chef:', err);
    showError('Chyba při načítání kuchaře');
  }
}

function populateChefDetail(chef) {
  const canonicalUrl = new URL('kuchar-detail.html', window.location.origin);
  canonicalUrl.searchParams.set('id', chef.slug || chef.id);
  const description = chef.bio || chef.description || `${chef.name} – kuchař na GURMAO`;
  const imageUrl = safeImageUrl(chef.image_url, `${window.location.origin}/og-image.jpg`);

  document.getElementById('pageTitle').textContent = `${chef.name} – GURMAO`;
  document.getElementById('pageDescription').content = description;
  document.getElementById('ogTitle').content = `${chef.name} – GURMAO`;
  document.getElementById('ogDescription').content = description;
  document.getElementById('ogUrl').content = canonicalUrl.href;
  document.getElementById('ogImage').content = imageUrl;
  document.getElementById('twitterTitle').content = `${chef.name} – GURMAO`;
  document.getElementById('twitterDescription').content = description;
  document.getElementById('twitterImage').content = imageUrl;
  document.getElementById('canonicalUrl').href = canonicalUrl.href;
  updateChefStructuredData(chef, canonicalUrl.href, imageUrl, description);

  document.getElementById('heroImage').style.backgroundImage = `url('${imageUrl}')`;
  document.getElementById('chefName').textContent = chef.name;

  const roleParts = [chef.role, chef.vibe].filter(Boolean);
  document.getElementById('chefRole').textContent = roleParts.length
    ? `🧑‍🍳 ${roleParts.join(' · ')}`
    : '🧑‍🍳 Kuchař';

  document.getElementById('chefBio').textContent = chef.bio || description;
  document.getElementById('chefDescription').textContent = chef.description || chef.bio || 'Profil kuchaře připravujeme.';
  document.getElementById('chefSignature').textContent = chef.signature_style || chef.specialty || 'Neuvedeno';
  document.getElementById('chefCuisines').textContent = chef.favorite_cuisines || 'Neuvedeno';

  if (chef.restaurants) {
    const restaurantText = chef.restaurants.city
      ? `${chef.restaurants.name} · ${chef.restaurants.city}`
      : chef.restaurants.name;
    document.getElementById('chefRestaurant').textContent = restaurantText;

    const restaurantLink = document.getElementById('restaurantLink');
    restaurantLink.href = `restaurant.html?slug=${encodeURIComponent(chef.restaurants.slug)}`;
    restaurantLink.classList.remove('hidden');
  }

  updateSocialMediaLinks(chef);

  if (chef.specialties) {
    const specialtiesArray = chef.specialties.split('·').map(value => value.trim()).filter(Boolean);
    document.getElementById('chefSpecialties').innerHTML = specialtiesArray.map(value => `
      <div class="rounded-2xl p-4 bg-white/5">
        <div class="text-sm text-white/70">${escapeHtml(value)}</div>
      </div>
    `).join('');
  }
}

function updateChefStructuredData(chef, url, imageUrl, description) {
  const restaurant = chef.restaurants;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: chef.name,
    description,
    image: imageUrl,
    url,
    jobTitle: chef.role || 'Kuchař',
    knowsAbout: [chef.signature_style, chef.favorite_cuisines].filter(Boolean),
    worksFor: restaurant ? {
      '@type': 'Restaurant',
      name: restaurant.name,
      url: restaurant.slug ? `${window.location.origin}/restaurant.html?slug=${encodeURIComponent(restaurant.slug)}` : undefined
    } : undefined
  };

  let script = document.getElementById('chefStructuredData');
  if (!script) {
    script = document.createElement('script');
    script.id = 'chefStructuredData';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

async function loadRelatedRestaurants(restaurantId) {
  try {
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (error || !restaurant) return;

    const html = `
      <a href="restaurant.html?slug=${encodeURIComponent(restaurant.slug)}" class="block rounded-3xl overflow-hidden bg-white/5 hover:bg-white/10 transition">
        <div class="aspect-square bg-cover bg-center" style="background-image:url('${escapeHtml(safeImageUrl(restaurant.image_url, fallbackRestaurantImage))}')"></div>
        <div class="p-6">
          <div class="text-gurmaogold text-sm mb-1">${escapeHtml(restaurant.vibe || 'Restaurace')}</div>
          <div class="text-2xl font-semibold">${escapeHtml(restaurant.name)}</div>
          <div class="text-white/60 mt-1">${escapeHtml(restaurant.city || '')}</div>
        </div>
      </a>
    `;

    document.getElementById('relatedRestaurants').innerHTML = html;
  } catch (err) {
    console.error('Error loading related restaurants:', err);
  }
}

function updateSocialMediaLinks(chef) {
  const socialLinks = [
    { id: 'instagramLink', url: chef.instagram_url },
    { id: 'tiktokLink', url: chef.tiktok_url },
    { id: 'facebookLink', url: chef.facebook_url },
    { id: 'youtubeLink', url: chef.youtube_url }
  ];

  let available = 0;
  socialLinks.forEach(social => {
    const linkElement = document.getElementById(social.id);
    if (!linkElement) return;

    const safeUrl = social.url ? safeWebUrl(social.url) : '#';
    if (safeUrl && safeUrl !== '#') {
      linkElement.href = safeUrl;
      linkElement.classList.remove('hidden', 'opacity-50', 'pointer-events-none');
      available++;
    } else {
      linkElement.classList.add('hidden');
      linkElement.href = '#';
    }
  });

  const followBtn = document.getElementById('followBtn');
  if (!available && followBtn) followBtn.classList.add('hidden');
}

function showError(message) {
  loadingState.innerHTML = `
    <div class="text-center px-6">
      <div class="text-4xl mb-4">😕</div>
      <div class="text-white/60 mb-4">${escapeHtml(message)}</div>
      <a href="kuchar.html" class="px-6 py-3 rounded-full bg-gurmaogold text-black font-bold inline-block hover:scale-105 transition">
        ← Zpět na kuchaře
      </a>
    </div>
  `;
  loadingState.classList.remove('hidden');
  mainContent.classList.add('hidden');
}

loadChefDetail();
