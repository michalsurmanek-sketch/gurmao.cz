// Location-based search functionality
export class LocationSearch {
  constructor() {
    this.userLocation = null;
    this.maxDistance = 20; // km
    this.isLocationEnabled = false;
  }

  // Získat pozici uživatele
  async getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolokace není podporována'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          this.isLocationEnabled = true;
          
          console.log('📍 GPS POZICE ZÍSKÁNA:', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            přesnost: `±${Math.round(position.coords.accuracy)}m`,
            googleMaps: `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`,
            timestamp: new Date(position.timestamp).toLocaleTimeString('cs-CZ')
          });
          
          if (position.coords.accuracy > 1000) {
            console.warn('⚠️ POZOR: Nízká přesnost GPS (±' + Math.round(position.coords.accuracy) + 'm)');
            console.warn('💡 TIP: Jsi venku? Zkus povolit GPS v telefonu nebo počkat na lepší signál.');
          }
          
          resolve(this.userLocation);
        },
        (error) => {
          console.error('❌ GPS ERROR:', error.message);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  // Vypočítat vzdálenost mezi dvěma body (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Poloměr Země v km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Vzdálenost v km
  }

  toRad(degrees) {
    return degrees * Math.PI / 180;
  }

  // Filtrovat restaurace podle vzdálenosti
  filterByDistance(restaurants) {
    if (!this.userLocation || !this.isLocationEnabled) {
      return restaurants;
    }

    console.log('📍 Tvoje pozice:', this.userLocation);
    
    return restaurants
      .map(restaurant => {
        if (restaurant.latitude && restaurant.longitude) {
          const distance = this.calculateDistance(
            this.userLocation.lat,
            this.userLocation.lng,
            restaurant.latitude,
            restaurant.longitude
          );
          
          // Debug pro první 3 restaurace
          if (restaurants.indexOf(restaurant) < 3) {
            console.log(`📏 ${restaurant.name}:`, {
              restaurace: `${restaurant.latitude}, ${restaurant.longitude}`,
              tvoje: `${this.userLocation.lat}, ${this.userLocation.lng}`,
              vzdalenost: `${distance.toFixed(2)} km`
            });
          }
          
          return { ...restaurant, distance };
        }
        // Restaurace bez souřadnic - přidej velkou vzdálenost aby byly na konci
        return { ...restaurant, distance: 9999 };
      })
      .sort((a, b) => a.distance - b.distance);
  }

  // Formátovat vzdálenost pro zobrazení
  formatDistance(distance) {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  }

  // Nastavit maximální vzdálenost
  setMaxDistance(distance) {
    this.maxDistance = distance;
  }

  // Vypnout lokační vyhledávání
  disable() {
    this.isLocationEnabled = false;
    this.userLocation = null;
  }
}
