import { supabase } from './supabase-client.js';

async function testChefsSearch() {
  console.log('🔍 Testování vyhledávání kuchařů...\n');
  
  // Test 1: Celkový počet kuchařů
  const { data: allChefs, error: countError } = await supabase
    .from('chefs')
    .select('*');
  
  if (countError) {
    console.error('❌ Chyba při načítání kuchařů:', countError);
    return;
  }
  
  console.log(`📊 Celkový počet kuchařů: ${allChefs?.length || 0}\n`);
  
  if (allChefs && allChefs.length > 0) {
    console.log('👨‍🍳 První 3 kuchaři:');
    allChefs.slice(0, 3).forEach(chef => {
      console.log(`  - ${chef.name} (${chef.slug}) - ${chef.restaurant_name || 'bez restaurace'}`);
    });
    console.log('');
  }
  
  // Test 2: Vyhledání konkrétního kuchaře
  const testQuery = allChefs?.[0]?.name?.substring(0, 3) || 'test';
  console.log(`🔎 Test vyhledávání pro "${testQuery}":`);
  
  const { data: searchResults, error: searchError } = await supabase
    .from('chefs')
    .select('id, slug, name, restaurant_name, image_url')
    .or(`name.ilike.%${testQuery}%,restaurant_name.ilike.%${testQuery}%`)
    .limit(10);
  
  if (searchError) {
    console.error('❌ Chyba při vyhledávání:', searchError);
    return;
  }
  
  console.log(`✅ Nalezeno výsledků: ${searchResults?.length || 0}`);
  if (searchResults && searchResults.length > 0) {
    searchResults.forEach(chef => {
      console.log(`  - ${chef.name} | ${chef.restaurant_name || 'N/A'}`);
    });
  }
}

testChefsSearch();
