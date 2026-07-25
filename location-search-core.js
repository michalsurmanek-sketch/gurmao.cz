// Location-based search functionality
export class LocationSearch {
  constructor() {
    this.userLocation = null;
    this.maxDistance = 20;
    this.isLocationEnabled = false;
    this.watchId = null;
    this.loadLocationState();
    this.cities = {
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
  }

  setLocationByCity(cityKey) {
    const city = this.cities[cityKey.toLowerCase().replace(/\s+/g, '-')];
    if (!city) return null;
    this.userLocation = { lat: city.lat, lng: city.lng, isManual: true, cityName: city.name };
    this.isLocationEnabled = true;
    this.saveLocationState();
    return city;
  }

  async getUserLocation(forceRefresh = false) {
    if (forceRefresh) {
      this.userLocation = null;
      this.isLocationEnabled = false;
    }
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolokace není podporována'));
      navigator.geolocation.getCurrentPosition(position => {
        if (position.coords.accuracy > 5000) return reject(new Error('GPS pozice není dostatečně přesná'));
        this.userLocation = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy };
        this.isLocationEnabled = true;
        this.saveLocationState();
        this.startWatchingPosition();
        resolve(this.userLocation);
      }, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    });
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  toRad(degrees) { return degrees * Math.PI / 180; }

  filterByDistance(restaurants) {
    if (!this.userLocation || !this.isLocationEnabled) return restaurants;
    return restaurants.map(restaurant => {
      if (restaurant.latitude && restaurant.longitude) {
        return { ...restaurant, distance: this.calculateDistance(this.userLocation.lat, this.userLocation.lng, restaurant.latitude, restaurant.longitude) };
      }
      return { ...restaurant, distance: 9999 };
    }).sort((a, b) => a.distance - b.distance);
  }

  formatDistance(distance) {
    return distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`;
  }

  setMaxDistance(distance) { this.maxDistance = distance; }

  disable() {
    this.isLocationEnabled = false;
    this.userLocation = null;
    this.stopWatchingPosition();
    this.saveLocationState();
  }

  startWatchingPosition() {
    if (this.watchId || !navigator.geolocation) return;
    this.watchId = navigator.geolocation.watchPosition(position => {
      if (position.coords.accuracy <= 5000) {
        this.userLocation = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy };
        this.saveLocationState();
      }
    }, () => {}, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
  }

  stopWatchingPosition() {
    if (!this.watchId) return;
    navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
  }

  saveLocationState() {
    localStorage.setItem('gurmao_location_state', JSON.stringify({ isEnabled: this.isLocationEnabled, location: this.userLocation, timestamp: Date.now() }));
  }

  loadLocationState() {
    try {
      const state = JSON.parse(localStorage.getItem('gurmao_location_state') || 'null');
      if (!state) return;
      const user = JSON.parse(localStorage.getItem('gurmao_user') || 'null');
      const shouldLoad = Boolean(user) || Date.now() - state.timestamp < 3600000;
      if (shouldLoad && state.isEnabled) {
        this.isLocationEnabled = true;
        this.userLocation = state.location;
        if (this.userLocation && !this.userLocation.isManual) this.startWatchingPosition();
      }
    } catch (error) {
      console.error('Chyba při načítání stavu polohy:', error);
    }
  }
}
