// GURMAO location + preferred city
const CITY_KEY = 'gurmao_preferred_city';
const LOCATION_KEY = 'gurmao_location_state';

const CITY_DATA = {
  'praha': { lat: 50.0755, lng: 14.4378, name: 'Praha' },
  'brno': { lat: 49.1951, lng: 16.6068, name: 'Brno' },
  'ostrava': { lat: 49.8209, lng: 18.2625, name: 'Ostrava' },
  'plzen': { lat: 49.7384, lng: 13.3736, name: 'Plzeň' },
  'liberec': { lat: 50.7663, lng: 15.0543, name: 'Liberec' },
  'olomouc': { lat: 49.5938, lng: 17.2509, name: 'Olomouc' },
  'ceske-budejovice': { lat: 48.9745, lng: 14.4743, name: 'České Budějovice' },
  'hradec-kralove': { lat: 50.2092, lng: 15.8327, name: 'Hradec Králové' },
  'pardubice': { lat: 50.0343, lng: 15.7812, name: 'Pardubice' },
  'zlin': { lat: 49.2266, lng: 17.6668, name: 'Zlín' },
  'kladno': { lat: 50.1476, lng: 14.1028, name: 'Kladno' },
  'karlovy-vary': { lat: 50.2329, lng: 12.8711, name: 'Karlovy Vary' },
  'uherske-hradiste': { lat: 49.0697, lng: 17.4594, name: 'Uherské Hradiště' },
  'jihlava': { lat: 49.3961, lng: 15.5910, name: 'Jihlava' }
};

function slugifyCity(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getPreferredCity() {
  try { return JSON.parse(localStorage.getItem(CITY_KEY) || 'null'); } catch { return null; }
}

function savePreferredCity(city) {
  if (!city?.name) return;
  localStorage.setItem(CITY_KEY, JSON.stringify({ name: city.name, key: slugifyCity(city.name), savedAt: Date.now() }));
  window.dispatchEvent(new CustomEvent('gurmao:city-changed', { detail: city }));
}

function addCityToUrl(url, cityName) {
  try {
    const parsed = new URL(url, location.href);
    if (parsed.origin !== location.origin || !/restaurace\.html$/.test(parsed.pathname)) return url;
    if (cityName && !parsed.searchParams.has('city')) parsed.searchParams.set('city', cityName);
    return `${parsed.pathname.split('/').pop()}${parsed.search}${parsed.hash}`;
  } catch { return url; }
}

function applyPreferredCityToPage(city) {
  if (!city?.name) return;

  document.querySelectorAll('a[href*="restaurace.html"]').forEach(link => {
    link.href = addCityToUrl(link.getAttribute('href') || 'restaurace.html', city.name);
  });

  document.querySelectorAll('form[action*="restaurace.html"]').forEach(form => {
    let input = form.querySelector('input[name="city"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'city';
      form.appendChild(input);
    }
    input.value = city.name;
  });

  const hero = document.querySelector('.hero-bg');
  if (hero && !document.getElementById('preferredCityBar')) {
    const bar = document.createElement('div');
    bar.id = 'preferredCityBar';
    bar.className = 'relative z-10 mt-5 flex items-center gap-3 rounded-full border border-gurmaogold/35 bg-black/55 px-4 py-2 text-sm backdrop-blur';
    bar.innerHTML = `<span class="text-white/65">Zobrazuji podniky pro</span><strong class="text-gurmaogold">📍 ${city.name}</strong><button type="button" id="changePreferredCity" class="text-white/55 underline hover:text-white">Změnit</button>`;
    const form = hero.querySelector('form');
    if (form) form.insertAdjacentElement('afterend', bar);
  }
}

function cityPicker() {
  const current = getPreferredCity();
  const overlay = document.createElement('div');
  overlay.id = 'gurmaoCityPicker';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.78);backdrop-filter:blur(12px);display:grid;place-items:center;padding:20px';
  const cities = Object.values(CITY_DATA).map(city => `<button type="button" data-city="${city.name}" style="height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:${current?.name === city.name ? 'rgba(216,173,52,.2)' : 'rgba(255,255,255,.05)'};color:#fff;cursor:pointer">${city.name}</button>`).join('');
  overlay.innerHTML = `<div style="width:min(620px,100%);max-height:90vh;overflow:auto;border:1px solid rgba(216,173,52,.35);border-radius:24px;background:#10110e;padding:26px;color:#fff;box-shadow:0 30px 100px #000"><div style="display:flex;justify-content:space-between;gap:20px"><div><div style="color:#d8ad34;font-size:12px;text-transform:uppercase;letter-spacing:.15em">Domovské město</div><h2 style="margin:8px 0;font-size:28px">Kde nejčastěji hledáte?</h2><p style="margin:0 0 20px;color:rgba(255,255,255,.6)">Město si zapamatujeme a příště ho zobrazíme automaticky.</p></div>${current ? '<button id="closeCityPicker" type="button" style="width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.15);background:transparent;color:#fff">×</button>' : ''}</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px">${cities}</div><button type="button" data-city="" style="margin-top:14px;width:100%;height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:transparent;color:rgba(255,255,255,.7);cursor:pointer">Celá ČR</button></div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', event => {
    if (event.target.id === 'closeCityPicker' || event.target === overlay) overlay.remove();
    const button = event.target.closest('[data-city]');
    if (!button) return;
    const name = button.dataset.city;
    if (name) savePreferredCity({ name }); else localStorage.removeItem(CITY_KEY);
    overlay.remove();
    location.reload();
  });
}

function initPreferredCity() {
  const city = getPreferredCity();
  if (city) applyPreferredCityToPage(city);
  else if (location.pathname.endsWith('/') || location.pathname.endsWith('/index.html')) setTimeout(cityPicker, 500);

  document.addEventListener('click', event => {
    if (event.target.closest('#changePreferredCity')) cityPicker();
  });
}

export class LocationSearch {
  constructor() {
    this.userLocation = null;
    this.maxDistance = 20;
    this.isLocationEnabled = false;
    this.watchId = null;
    this.cities = CITY_DATA;
    this.loadLocationState();
  }
  setLocationByCity(value) {
    const city = CITY_DATA[slugifyCity(value)];
    if (!city) return null;
    this.userLocation = { lat: city.lat, lng: city.lng, isManual: true, cityName: city.name };
    this.isLocationEnabled = true;
    this.saveLocationState();
    savePreferredCity(city);
    return city;
  }
  getUserLocation(forceRefresh = false) {
    if (forceRefresh) { this.userLocation = null; this.isLocationEnabled = false; }
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolokace není podporována'));
      navigator.geolocation.getCurrentPosition(position => {
        this.userLocation = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy };
        this.isLocationEnabled = true;
        this.saveLocationState();
        resolve(this.userLocation);
      }, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
    });
  }
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371, dLat = this.toRad(lat2-lat1), dLon = this.toRad(lon2-lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(this.toRad(lat1))*Math.cos(this.toRad(lat2))*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
  toRad(value) { return value * Math.PI / 180; }
  filterByDistance(restaurants) {
    if (!this.userLocation || !this.isLocationEnabled) return restaurants;
    return restaurants.map(r => ({ ...r, distance: r.latitude && r.longitude ? this.calculateDistance(this.userLocation.lat, this.userLocation.lng, r.latitude, r.longitude) : 9999 })).sort((a,b) => a.distance-b.distance);
  }
  formatDistance(distance) { return distance < 1 ? `${Math.round(distance*1000)} m` : `${distance.toFixed(1)} km`; }
  setMaxDistance(distance) { this.maxDistance = distance; }
  disable() { this.stopWatchingPosition(); this.userLocation = null; this.isLocationEnabled = false; localStorage.removeItem(LOCATION_KEY); }
  startWatchingPosition() {}
  stopWatchingPosition() { if (this.watchId) navigator.geolocation.clearWatch(this.watchId); this.watchId = null; }
  saveLocationState() { localStorage.setItem(LOCATION_KEY, JSON.stringify({ isEnabled: this.isLocationEnabled, location: this.userLocation, timestamp: Date.now() })); }
  loadLocationState() {
    try {
      const state = JSON.parse(localStorage.getItem(LOCATION_KEY) || 'null');
      if (state?.isEnabled) { this.isLocationEnabled = true; this.userLocation = state.location; }
    } catch {}
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPreferredCity, { once: true });
else initPreferredCity();
