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
            lng: position.coords.longitude
          };
          this.isLocationEnabled = true;
          resolve(this.userLocation);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
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

    return restaurants
      .map(restaurant => {
        if (restaurant.latitude && restaurant.longitude) {
          const distance = this.calculateDistance(
            this.userLocation.lat,
            this.userLocation.lng,
            restaurant.latitude,
            restaurant.longitude
          );
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
