-- Import restaurací PARDUBICKÝ KRAJ 31–40 do GURMAO.cz
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
    'restaurace-u-vaclava',
    'Restaurace U Václava',
    'Pardubice',
    '🌮 CHAOS',
    'česká kuchyně / hospoda',
    'Oblíbená hospoda s českou klasikou a živější atmosférou.',
    50.0356,
    15.7817,
    'https://www.uvaclava.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-stara-posta-litomysl',
    'Restaurace Stará Pošta',
    'Litomyšl',
    '🌊 CALM',
    'česká kuchyně',
    'Historická restaurace v centru města, česká klasika a klidné prostředí.',
    49.8689,
    16.3129,
    'https://www.staraposta-litomysl.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-ruzku-chrudim',
    'Restaurace Na Růžku',
    'Chrudim',
    '🌿 PURE',
    'česká / regionální kuchyně',
    'Rodinná restaurace s tradičními recepty a domácí atmosférou.',
    49.9515,
    15.7956,
    'https://www.naruzku-chrudim.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-kohouta-vm',
    'Restaurace U Kohouta',
    'Vysoké Mýto',
    '🌮 CHAOS',
    'česká kuchyně / pivnice',
    'Hospoda s živou atmosférou a českou klasikou, oblíbená mezi místními.',
    49.9545,
    16.1641,
    'https://www.ukohouta-vm.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-zamku-svitavy',
    'Restaurace U Zámku',
    'Svitavy',
    '🌊 CALM',
    'česká kuchyně',
    'Restaurace v blízkosti zámku, česká klasika a klidná atmosféra.',
    49.7554,
    16.4702,
    'https://www.uzamku-svitavy.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-hradbach',
    'Restaurace Na Hradbách',
    'Pardubice',
    '🌊 CALM',
    'česká kuchyně',
    'Restaurace v historickém centru, spolehlivá kuchyně a příjemná atmosféra.',
    50.0378,
    15.7773,
    'https://www.nahradbach.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-sportovni',
    'Restaurace Sportovní',
    'Pardubice',
    '🌿 PURE',
    'česká kuchyně',
    'Oblíbená restaurace u sportovního areálu, poctivá kuchyně.',
    50.0329,
    15.7845,
    'https://www.sportovni-pce.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-lva',
    'Restaurace U Lva',
    'Ústí nad Orlicí',
    '🌊 CALM',
    'česká kuchyně',
    'Tradiční restaurace v centru města, česká klasika.',
    49.9735,
    16.3942,
    'https://www.ulva-uo.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-kata-litomysl',
    'Restaurace U Kata',
    'Litomyšl',
    '🌮 CHAOS',
    'česká kuchyně / pivnice',
    'Historická hospoda s živou atmosférou, česká klasika.',
    49.8681,
    16.3135,
    'https://www.ukata-litomysl.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-beseda-chrudim',
    'Restaurace Beseda',
    'Chrudim',
    '🌊 CALM',
    'česká kuchyně',
    'Klasická restaurace v centru města, spolehlivá česká klasika.',
    49.9509,
    15.7965,
    'https://www.beseda-chrudim.cz/images/restaurace.jpg',
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;
