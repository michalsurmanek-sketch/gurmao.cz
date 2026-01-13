import { supabase } from './supabase-client.js';

async function checkRestaurants() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('name, city, latitude, longitude')
    .ilike('city', '%uhersk%');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Restaurace v Uherském Hradišti:');
  data.forEach(r => {
    console.log(`\n${r.name}`);
    console.log(`  Město: ${r.city}`);
    console.log(`  GPS: ${r.latitude}, ${r.longitude}`);
    if (r.latitude && r.longitude) {
      console.log(`  Google Maps: https://www.google.com/maps?q=${r.latitude},${r.longitude}`);
    } else {
      console.log('  ⚠️ CHYBÍ GPS SOUŘADNICE!');
    }
  });
}

checkRestaurants();
