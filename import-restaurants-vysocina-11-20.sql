-- Import restaurací VYSOČINA 11–20 do GURMAO.cz
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
    'restaurace-pansky-dum',
    'Restaurace Panský dům',
    'Telč',
    '🍷 LUXE',
    'česká / moderní gastronomie',
    'Stylová restaurace v centru UNESCO města, kvalitní kuchyně v historických prostorách.',
    49.1844,
    15.4528,
    'https://www.panskydum.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-hrabenky',
    'Restaurace U Hraběnky',
    'Telč',
    '🌊 CALM',
    'česká kuchyně',
    'Tradiční restaurace na náměstí, spolehlivá česká klasika a příjemná atmosféra.',
    49.1842,
    15.4523,
    'https://www.uhrabenky.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-fenix',
    'Restaurace Fénix',
    'Nové Město na Moravě',
    '🌿 PURE',
    'česká kuchyně',
    'Oblíbená restaurace s českou kuchyní, populární mezi místními i návštěvníky.',
    49.5617,
    16.0742,
    'https://www.fenix-nmnm.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'hotel-slavie-restaurace',
    'Hotel Slavie – Restaurace',
    'Jihlava',
    '🌊 CALM',
    'česká / mezinárodní',
    'Hotelová restaurace s širším menu, kvalitní servis a klidná atmosféra.',
    49.3961,
    15.5889,
    'https://www.hotelslavie.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-kopecku',
    'Restaurace Na Kopečku',
    'Havlíčkův Brod',
    '🌮 CHAOS',
    'česká kuchyně / pivnice',
    'Živá pivnice s dobrou atmosférou, české speciality a pivo.',
    49.6082,
    15.5812,
    'https://www.nakopecku.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-grand',
    'Restaurace Grand',
    'Jihlava',
    '🍷 LUXE',
    'moderní česká',
    'Elegantní restaurace s moderním pojetím české kuchyně, kvalitní vinný lístek.',
    49.3958,
    15.5898,
    'https://www.grand-jihlava.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-cerneho-orla',
    'Restaurace U Černého orla',
    'Třebíč',
    '🌊 CALM',
    'česká kuchyně',
    'Klasická restaurace se solidní českou kuchyní a tradicí.',
    49.2158,
    15.8802,
    'https://www.ucernehoorla.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-modranka',
    'Restaurace Modřanka',
    'Světlá nad Sázavou',
    '🌿 PURE',
    'česká kuchyně',
    'Poctivá česká restaurace, lokálně oblíbená, domácí atmosféra.',
    49.6678,
    15.4027,
    'https://www.modranka.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-supa',
    'Restaurace U Supa',
    'Chotěboř',
    '🌮 CHAOS',
    'česká kuchyně / hospoda',
    'Oblíbená hospoda s tradičními recepty, živá atmosféra.',
    49.7208,
    15.6703,
    'https://www.usupa.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-balkan',
    'Restaurace Balkán',
    'Pelhřimov',
    '🌮 CHAOS',
    'česká / balkánská kuchyně',
    'Netradiční restaurace s balkánskou kuchyní, živá atmosféra a specifické menu.',
    49.4310,
    15.2245,
    'https://www.balkan-pelhrimov.cz/images/restaurace.jpg',
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;
