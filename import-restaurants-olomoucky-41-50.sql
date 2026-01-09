-- Import restaurací OLOMOUCKÝ KRAJ 41–50 do GURMAO.cz
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
    'restaurant-long-story-short-eatery',
    'Restaurant Long Story Short – Eatery',
    'Olomouc',
    '🌿 PURE',
    'moderní kuchyně / bistro',
    'Moderní gastronomie s důrazem na sezónní suroviny, klidná a čistá atmosféra.',
    49.5965,
    17.2506,
    'https://www.longstoryshort.cz/wp-content/uploads/2021/05/long-story-short-interior.jpg',
    NOW()
  ),
  (
    'lobster-family-restaurant',
    'Lobster Family Restaurant',
    'Olomouc',
    '🌊 CALM',
    'italská kuchyně / pizza',
    'Oblíbená rodinná restaurace s pizzou a italskou klasikou v nákupní zóně.',
    49.6027,
    17.2581,
    'https://www.lobster-restaurant.cz/wp-content/uploads/2021/04/lobster.jpg',
    NOW()
  ),
  (
    'u-cerneho-volka',
    'U Černého volka',
    'Olomouc',
    '🌮 CHAOS',
    'česká kuchyně / pivnice',
    'Klasická česká hospoda s dlouhou historií, velké porce a silná atmosféra.',
    49.6000,
    17.2489,
    'https://www.ucervenehovolka.cz/wp-content/uploads/2020/10/u-cerveneho-volka.jpg',
    NOW()
  ),
  (
    'bistro-paulus',
    'Bistro Paulus',
    'Olomouc',
    '🌿 PURE',
    'bistro / lehká kuchyně',
    'Oblíbené bistro na snídaně a brunche, moderní styl a lehká jídla.',
    49.6007,
    17.2601,
    'https://www.catering-paulus.cz/wp-content/uploads/2021/05/bistro-paulus.jpg',
    NOW()
  ),
  (
    'asado-grill',
    'Asado Grill',
    'Olomouc',
    '🔥 DRAMA',
    'steakhouse / grill',
    'Masová restaurace s grilovanými specialitami a otevřenou kuchyní.',
    49.6031,
    17.2512,
    'https://asadogrill.cz/wp-content/uploads/2021/05/asado-grill.jpg',
    NOW()
  ),
  (
    'restaurant-new-wave',
    'Restaurant New Wave',
    'Olomouc',
    '🍷 LUXE',
    'moderní evropská kuchyně',
    'Elegantní restaurace s moderním menu a důrazem na prezentaci.',
    49.5949,
    17.2442,
    'https://www.hotelclarionolomouc.cz/wp-content/uploads/2021/06/new-wave-restaurant.jpg',
    NOW()
  ),
  (
    'restaurant-drapal-santovka',
    'Restaurant Drápal – Šantovka',
    'Olomouc',
    '🌊 CALM',
    'česká kuchyně',
    'Druhá provozovna legendární restaurace Drápal, stabilní kvalita a klasika.',
    49.6029,
    17.2575,
    'https://www.restauracedrapal.cz/wp-content/uploads/2021/04/drapal-interier.jpg',
    NOW()
  ),
  (
    'moravska-restaurace-dolni-namesti',
    'Moravská restaurace – Dolní náměstí',
    'Olomouc',
    '🌿 PURE',
    'moravská kuchyně',
    'Tradiční moravská kuchyně v centru města, ideální pro první návštěvu Olomouce.',
    49.6013,
    17.2502,
    'https://www.moravskarestaurace.cz/wp-content/uploads/2020/10/moravska-restaurace.jpg',
    NOW()
  ),
  (
    'restaurant-tiskarna',
    'Restaurant Tiskárna',
    'Olomouc',
    '🌮 CHAOS',
    'česká kuchyně / pivnice',
    'Moderní pivnice s českou klasikou, dobré pivo a rušnější atmosféra.',
    49.5944,
    17.2466,
    'https://www.tiskarna-olomouc.cz/wp-content/uploads/2021/06/tiskarna-interier.jpg',
    NOW()
  ),
  (
    'restaurant-u-morice',
    'Restaurant U Mořice',
    'Olomouc',
    '🌊 CALM',
    'česká / evropská kuchyně',
    'Velmi oblíbená restaurace s širokým menu, dlouhodobě vysoké hodnocení.',
    49.6080,
    17.2540,
    'https://www.umorice.cz/images/restaurant.jpg',
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;
