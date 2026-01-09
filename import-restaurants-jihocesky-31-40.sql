-- Import restaurací JIHOČESKÝ KRAJ 31–40 do GURMAO.cz
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
    'restaurace-u-holubu',
    'Restaurace U Holubů',
    'Soběslav',
    '🌊 CALM',
    'česká kuchyně',
    'Tradiční rodinná restaurace v centru města, stabilní kvalita.',
    49.2598,
    14.7181,
    'https://www.uholubu.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-mlyne',
    'Restaurace Na Mlýně',
    'Dačice',
    '🌿 PURE',
    'česká / regionální kuchyně',
    'Restaurace v historickém mlýně, poctivá kuchyně a klidné prostředí.',
    49.0813,
    15.4354,
    'https://www.namlyne-dacice.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'pivovar-restaurace-eggenberg',
    'Pivovar a restaurace Eggenberg',
    'Český Krumlov',
    '🌮 CHAOS',
    'česká kuchyně / pivovar',
    'Pivovarnická restaurace s vlastním pivem, živá turistická atmosféra.',
    48.8121,
    14.3171,
    'https://www.eggenberg.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-dwau-maryi',
    'Restaurace U Dwau Maryí',
    'Český Krumlov',
    '🌊 CALM',
    'česká / mezinárodní kuchyně',
    'Oblíbená restaurace v historickém centru, široké menu.',
    48.8114,
    14.3159,
    'https://www.udwaumaryi.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-ruze',
    'Restaurace Růže',
    'Český Krumlov',
    '🍷 LUXE',
    'fine dining / česká kuchyně',
    'Luxusní hotelová restaurace v barokním objektu, vysoký standard.',
    48.8117,
    14.3163,
    'https://www.hotelruze.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-kata-cb',
    'Restaurace U Kata',
    'České Budějovice',
    '🌮 CHAOS',
    'česká kuchyně / hospoda',
    'Historická hospoda s českou klasikou a živou atmosférou.',
    48.9751,
    14.4739,
    'https://www.ukata-cb.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-krajinska',
    'Restaurace Krajinská',
    'České Budějovice',
    '🌊 CALM',
    'česká kuchyně',
    'Oblíbená restaurace s českou klasikou a klidnou atmosférou.',
    48.9735,
    14.4768,
    'https://www.krajinska.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'pizzerie-la-fontanella',
    'Pizzerie La Fontanella',
    'České Budějovice',
    '🌿 PURE',
    'italská kuchyně / pizza',
    'Oblíbená pizzerie s autentickou italskou kuchyní.',
    48.9744,
    14.4752,
    'https://www.lafontanella.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-modra-hvezda',
    'Restaurace Modrá Hvězda',
    'Tábor',
    '🌊 CALM',
    'česká kuchyně',
    'Klasická restaurace s dlouholetou tradicí v Táboře.',
    49.4139,
    14.6596,
    'https://www.modrahvezda-tabor.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-peking',
    'Restaurace Peking',
    'Jindřichův Hradec',
    '🌊 CALM',
    'čínská kuchyně',
    'Oblíbená čínská restaurace s širokým menu, rodinná atmosféra.',
    49.1443,
    15.0033,
    'https://www.peking-jh.cz/images/restaurace.jpg',
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;
