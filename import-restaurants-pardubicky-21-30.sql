-- Import restaurací PARDUBICKÝ KRAJ 21–30 do GURMAO.cz
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
    'restaurace-u-radnice-uo',
    'Restaurace U Radnice',
    'Ústí nad Orlicí',
    '🌊 CALM',
    'česká kuchyně',
    'Tradiční restaurace na náměstí, spolehlivá česká klasika.',
    49.9741,
    16.3929,
    'https://www.uradnice-uo.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-statku-pce',
    'Restaurace Na Statku',
    'Pardubice',
    '🌿 PURE',
    'česká / venkovská kuchyně',
    'Venkovská restaurace s tradičními pokrmy a domácí atmosférou.',
    50.0412,
    15.7698,
    'https://www.nastatku-pce.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-jelena-hlinsko',
    'Restaurace U Jelena',
    'Hlinsko',
    '🌊 CALM',
    'česká kuchyně',
    'Oblíbená restaurace v centru města, česká klasika a klidné prostředí.',
    49.7618,
    15.9074,
    'https://www.ujelena-hlinsko.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-andel',
    'Restaurace Anděl',
    'Přelouč',
    '🌊 CALM',
    'česká kuchyně',
    'Tradiční restaurace s českou kuchyní, stabilní kvalita.',
    50.0399,
    15.5596,
    'https://www.andel-prelouc.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-kocoura-svitavy',
    'Restaurace U Kocoura',
    'Svitavy',
    '🌮 CHAOS',
    'česká kuchyně / pivnice',
    'Hospoda s živou atmosférou a českou klasikou, oblíbená mezi místními.',
    49.7566,
    16.4679,
    'https://www.ukocoura-svitavy.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-mlyne-lanskroun',
    'Restaurace Na Mlýně',
    'Lanškroun',
    '🌿 PURE',
    'česká / regionální kuchyně',
    'Restaurace v historickém mlýně, poctivá kuchyně a klidné prostředí.',
    49.9121,
    16.6108,
    'https://www.namlyne-lanskroun.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-beranka',
    'Restaurace U Beránka',
    'Lanškroun',
    '🌊 CALM',
    'česká kuchyně',
    'Klasická restaurace v centru města, česká klasika a příjemná atmosféra.',
    49.9115,
    16.6121,
    'https://www.uberanka.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-zlata-hvezda-vm',
    'Restaurace Zlatá Hvězda',
    'Vysoké Mýto',
    '🍷 LUXE',
    'moderní česká',
    'Hotelová restaurace s kvalitní kuchyní a moderním přístupem.',
    49.9555,
    16.1619,
    'https://www.zlatahvezda-vm.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-kopci',
    'Restaurace Na Kopci',
    'Chrudim',
    '🌿 PURE',
    'česká / regionální kuchyně',
    'Rodinná restaurace s výhledem na město, tradiční recepty.',
    49.9498,
    15.7971,
    'https://www.nakopci-chrudim.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-zlate-hvezdy-pce',
    'Restaurace U Zlaté hvězdy',
    'Pardubice',
    '🌊 CALM',
    'česká kuchyně',
    'Tradiční podnik s českou klasikou, klidná atmosféra.',
    50.0372,
    15.7782,
    'https://www.uzlatehvezdy-pce.cz/images/restaurace.jpg',
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;
