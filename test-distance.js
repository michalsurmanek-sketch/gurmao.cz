// Test Haversine výpočtu
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Poloměr Země v km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(degrees) {
  return degrees * Math.PI / 180;
}

// Uherské Hradiště souřadnice
const uhLat = 49.0697;
const uhLon = 17.4594;

console.log('Test: Uherské Hradiště -> Uherské Hradiště (stejné místo)');
console.log('Vzdálenost:', calculateDistance(uhLat, uhLon, uhLat, uhLon), 'km');

console.log('\nTest: Uherské Hradiště -> Praha (cca 250km)');
console.log('Vzdálenost:', calculateDistance(uhLat, uhLon, 50.0755, 14.4378), 'km');

console.log('\nTest: Uherské Hradiště -> Brno (cca 70km)');
console.log('Vzdálenost:', calculateDistance(uhLat, uhLon, 49.1951, 16.6068), 'km');
