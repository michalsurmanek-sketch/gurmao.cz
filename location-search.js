// Location-based search functionality
export class LocationSearch {
  constructor() {
    this.userLocation = null;
    this.maxDistance = 20; // km
    this.isLocationEnabled = false;
    this.watchId = null; // Pro sledování pozice
    
    // Načíst uložený stav polohy z localStorage
    this.loadLocationState();
    
    // Předdefinované města s GPS souřadnicemi
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
  
  // Nastavit pozici podle města
  setLocationByCity(cityKey) {
    const city = this.cities[cityKey.toLowerCase().replace(/\s+/g, '-')];
    if (city) {
      this.userLocation = {
        lat: city.lat,
        lng: city.lng,
        isManual: true,
        cityName: city.name
      };
      this.isLocationEnabled = true;
      this.saveLocationState();
      console.log('📍 RUČNÍ POZICE:', city.name, `(${city.lat}, ${city.lng})`);
      return city;
    }
    return null;
  }

  // Získat pozici uživatele
  async getUserLocation(forceRefresh = false) {
    // Pokud chceme force refresh, invaliduj starou pozici
    if (forceRefresh) {
      this.userLocation = null;
      this.isLocationEnabled = false;
    }
    
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolokace není podporována'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Kontrola přesnosti - pokud je horší než 5 km, odmítni ji
          if (position.coords.accuracy > 5000) {
            console.warn('⚠️ GPS je velmi nepřesná (±' + Math.round(position.coords.accuracy/1000) + ' km) - ignoruji');
            reject(new Error('GPS pozice není dostatečně přesná'));
            return;
          }
          
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          this.isLocationEnabled = true;
          this.saveLocationState();
          
          // Spustit automatickou aktualizaci pozice každých 30 sekund
          this.startWatchingPosition();
          
          console.log('📍 GPS POZICE ZÍSKÁNA:', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            přesnost: `±${Math.round(position.coords.accuracy)}m`,
            googleMaps: `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`,
            timestamp: new Date(position.timestamp).toLocaleTimeString('cs-CZ'),
            'OTEVŘI V MAPĚ →': `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`
          });
          
          // Najdi nejbližší město pro kontrolu
          let nearestCity = null;
          let minDistance = Infinity;
          Object.entries(this.cities).forEach(([key, city]) => {
            const dist = this.calculateDistance(position.coords.latitude, position.coords.longitude, city.lat, city.lng);
            if (dist < minDistance) {
              minDistance = dist;
              nearestCity = city.name;
            }
          });
          console.log(`🏙️ NEJBLIŽŠÍ MĚSTO: ${nearestCity} (${Math.round(minDistance)} km)`);
          
          if (position.coords.accuracy > 1000) {
            console.warn('⚠️ Nízká přesnost GPS (±' + Math.round(position.coords.accuracy) + 'm)');
          }
          
          resolve(this.userLocation);
        },
        (error) => {
          console.error('❌ GPS ERROR:', error.message);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0  // DŮLEŽITÉ: Vynutit novou pozici, ne z cache
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
    this.itopWatchingPosition();
    this.saveLocationState();
  }
  
  // Spustit automatickou aktualizaci pozice
  startWatchingPosition() {
    if (this.watchId) return; // Už běží
    
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        // Aktualizuj jen pokud je přesnost dostatečná
        if (position.coords.accuracy <= 5000) {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          this.saveLocationState();
          console.log('🔄 Pozice aktualizována:', `±${Math.round(position.coords.accuracy)}m`);
        }
      },
      (error) => {
        console.warn('Chyba při sledování pozice:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000 // Aktualizuj max každých 30 sekund
      }
    );
  }
  
  // Zastavit automatickou aktualizaci pozice
  stopWatchingPosition() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('⏹️ Sledování pozice zastaveno');
    }
  }
  
  // Uložit stav polohy do localStorage
  saveLocationState() {
    const state = {
      isEnabled: this.isLocationEnabled,
      location: this.userLocation,
      timestamp: Date.now()
    };
    localStorage.setItem('gurmao_location_state', JSON.stringify(state));
  }
  
  // Načíst stav polohy z localStorage
  loadLocationState() {
    try {
      const saved = localStorage.getItem('gurmao_location_state');
      if (saved) {
        const state = JSON.parse(saved);
        
        // Zkontroluj, zda je uživatel přihlášený
        const user = JSON.parse(localStorage.getItem('gurmao_user') || 'null');
        const isLoggedIn = !!user;
        
        // Pokud je přihlášený, poloha platí trvale
        // Pokud není přihlášený, platí jen 1 hodinu
        const shouldLoad = isLoggedIn || (Date.now() - state.timestamp < 3600000);
        
        if (shouldLoad && state.isEnabled) {
          this.isLocationEnabled = state.isEnabled;
          this.userLocation = state.location;
          console.log('📍 Načten uložený stav polohy:', state, isLoggedIn ? '(trvale - přihlášený)' : '(1 hodina)');
          
          // Spustit sledování pozice pokud byla lokace aktivní a není ruční
          if (this.userLocation && !this.userLocation.isManual) {
            this.startWatchingPosition();
          }
        }
      }
    } catch (error) {
      console.error('Chyba při načítání stavu polohy:', error);
    }
  }
}
