-- Import prvních 9 restaurací do GURMAO.cz
-- Zkopíruj tento SQL do Supabase → SQL Editor → New query → Run

INSERT INTO restaurants (
  slug, 
  name, 
  city, 
  vibe, 
  tag, 
  description, 
  latitude, 
  longitude, 
  image_url,
  created_at
) VALUES 
  (
    'la-degustation-boheme-bourgeoise',
    'La Degustation Bohême Bourgeoise',
    'Praha',
    '🍷 LUXE',
    'fine dining',
    'Prestižní michelinská restaurace s moderním výkladem české kuchyně a kreativitou šéfkuchaře, založená na sezónních lokálních surovinách.',
    50.0865,
    14.4210,
    'https://ladegustation.cz/wp-content/uploads/2020/03/ladegustation-interior.jpg',
    NOW()
  ),
  (
    'field-restaurant',
    'Field Restaurant',
    'Praha',
    '🍷 LUXE',
    'fine dining',
    'Elegantní moderní restaurace s degustacemi založenými na lokálních a sezónních surovinách a výrazným gastronomickým konceptem.',
    50.0918183,
    14.4219328,
    'https://fieldrestaurant.cz/wp-content/uploads/2024/01/field-prague-interior.jpg',
    NOW()
  ),
  (
    'restaurant-essens',
    'Restaurant ESSENS',
    'Hlohovec',
    '🍷 LUXE',
    'fine dining',
    'Významná moravská restaurace s moderním pojetím české kuchyně, často mezinárodně oceňovaná a vyhledávaná gurmány.',
    48.75742,
    16.81670,
    'https://restaurantessens.cz/wp-content/uploads/2021/09/essens-interior.jpg',
    NOW()
  ),
  (
    'pot-au-feu',
    'Pot-au-Feu',
    'Praha',
    '🌿 PURE',
    'French',
    'Francouzská restaurace s důrazem na klasickou francouzskou kuchyni v elegentním prostředí centra Prahy.',
    50.08720,
    14.42010,
    'https://potaufeu.cz/wp-content/uploads/2023/07/pot-au-feu-dish.jpg',
    NOW()
  ),
  (
    'restaurant-mlynec',
    'Restaurant Mlýnec',
    'Praha',
    '🍷 LUXE',
    'modern Czech',
    'Stylová restaurace s výhledem na Vltavu a Karlův most, známá svým kreativním pojetím české kuchyně.',
    50.08761,
    14.41598,
    'https://www.mlynec.cz/wp-content/uploads/2022/03/mlynec-restaurant.jpg',
    NOW()
  ),
  (
    'terasa-u-zlate-studne',
    'Terasa U Zlaté studně',
    'Praha',
    '🌊 CALM',
    'fine dining',
    'Luxusní restaurace s panoramatickou terasou a výhledem na Prahu, světová úroveň gastronomie s nádechem romantiky.',
    50.09035,
    14.40450,
    'https://www.terasauzlatestudne.cz/wp-content/uploads/2021/04/terasa-u-zlate-studne-view.jpg',
    NOW()
  ),
  (
    'dejvicka-34',
    'Dejvická 34',
    'Praha',
    '🔥 DRAMA',
    'modern bistro',
    'Objevná moderní restaurace se silným charakterem a osobitým přístupem šéfkuchaře Tomáše Černého, kombinující české a italské vlivy.',
    50.10240,
    14.41870,
    'https://www.dejvicka34.cz/wp-content/uploads/2022/08/dejvicka34-interior.jpg',
    NOW()
  ),
  (
    'sansho',
    'Sansho',
    'Praha',
    '🔥 DRAMA',
    'asian fusion',
    'Stylová pražská restaurace s moderním asijským vlivem a kreativní kuchyní ve středu města.',
    50.08860,
    14.42380,
    'https://sansho.cz/wp-content/uploads/2024/05/sansho-restaurant.jpg',
    NOW()
  ),
  (
    'benjamin',
    'Benjamin',
    'Praha',
    '🍷 LUXE',
    'fine dining',
    'Intimní a kreativní degustace s pevně daným tasting menu a silným gastronomickým konceptem.',
    50.07590,
    14.43020,
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
    NOW()
  );

-- Hotovo! ✅
-- Po spuštění tohoto SQL se všech 9 restaurací objeví:
-- - Na mapě (mapa.html)
-- - Ve feedu (feed.html)
-- - V seznamu restaurací (restaurace.html)
