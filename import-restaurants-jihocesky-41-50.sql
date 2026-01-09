-- Import restaurací JIHOČESKÝ KRAJ 41–50 do GURMAO.cz (FINÁLNÍ BALÍK)
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
    'restaurace-satlava',
    'Restaurace Šatlava',
    'Písek',
    '🌊 CALM',
    'česká kuchyně',
    'Oblíbená restaurace v centru Písku, česká klasika a klidné prostředí.',
    49.3085,
    14.1482,
    'https://www.satlava.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-labute',
    'Restaurace U Labutě',
    'Tábor',
    '🌿 PURE',
    'česká / regionální kuchyně',
    'Rodinná restaurace s důrazem na tradiční recepty a domácí atmosféru.',
    49.4135,
    14.6602,
    'https://www.ulabute.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-zamku',
    'Restaurace U Zámku',
    'Jindřichův Hradec',
    '🌊 CALM',
    'česká kuchyně',
    'Restaurace v blízkosti zámku, spolehlivá kuchyně a klidná atmosféra.',
    49.1446,
    15.0019,
    'https://www.uzamku-jh.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-kocoura',
    'Restaurace U Kocoura',
    'Třeboň',
    '🌮 CHAOS',
    'česká kuchyně / pivnice',
    'Oblíbená hospoda s živou atmosférou a českou klasikou.',
    49.0033,
    14.7706,
    'https://www.ukocoura.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-zlata-ruze-ck',
    'Restaurace Zlatá Růže',
    'Český Krumlov',
    '🌊 CALM',
    'česká / mezinárodní kuchyně',
    'Restaurace s širokým menu a příjemnou atmosférou v turistickém centru.',
    48.8109,
    14.3154,
    'https://www.zlataruze-ck.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-stare-poste-cb',
    'Restaurace Na Staré Poště',
    'České Budějovice',
    '🌊 CALM',
    'česká kuchyně',
    'Tradiční restaurace v historické budově, poctivá česká kuchyně.',
    48.9740,
    14.4755,
    'https://www.nastareposte-cb.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-pizzeria-donna',
    'Restaurace Pizzeria Donna',
    'Strakonice',
    '🌿 PURE',
    'italská kuchyně / pizza',
    'Oblíbená pizzerie s italskou kuchyní a rodinnou atmosférou.',
    49.2611,
    13.9020,
    'https://www.donna-strakonice.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-panorama',
    'Restaurace Panorama',
    'Hluboká nad Vltavou',
    '🌊 CALM',
    'česká kuchyně',
    'Restaurace s výhledem na Hlubokou, česká klasika a klidné prostředí.',
    49.0518,
    14.4338,
    'https://www.panorama-hluboka.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-zlate-koruny',
    'Restaurace U Zlaté Koruny',
    'Prachatice',
    '🌿 PURE',
    'česká / regionální kuchyně',
    'Rodinná restaurace s tradičními recepty a domácí atmosférou.',
    49.0127,
    13.9985,
    'https://www.uzlatekoruny.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-louzi',
    'Restaurace Na Louži',
    'Český Krumlov',
    '🌊 CALM',
    'česká kuchyně',
    'Oblíbená restaurace na hlavním náměstí, česká klasika a příjemná atmosféra.',
    48.8111,
    14.3161,
    'https://www.nalouzi.cz/images/restaurace.jpg',
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;
