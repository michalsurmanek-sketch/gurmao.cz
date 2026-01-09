-- Import restaurací PARDUBICKÝ KRAJ 41–50 do GURMAO.cz (FINÁLNÍ BALÍK)
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
    'restaurace-u-bileho-konicka',
    'Restaurace U Bílého koníčka',
    'Pardubice',
    '🌊 CALM',
    'česká kuchyně',
    'Tradiční restaurace s českou klasikou, klidná rodinná atmosféra.',
    50.0364,
    15.7797,
    'https://www.ubilehokonicka.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-slunce-svitavy',
    'Restaurace U Slunce',
    'Svitavy',
    '🌿 PURE',
    'česká / regionální kuchyně',
    'Rodinná restaurace s důrazem na lokální suroviny a tradiční recepty.',
    49.7561,
    16.4688,
    'https://www.uslunce-svitavy.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-vetrniku',
    'Restaurace Na Větrníku',
    'Litomyšl',
    '🌿 PURE',
    'česká kuchyně',
    'Restaurace s venkovním posezením, poctivá kuchyně a klid.',
    49.8695,
    16.3114,
    'https://www.navetrníku.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'pizzerie-u-toma',
    'Pizzerie U Toma',
    'Pardubice',
    '🌿 PURE',
    'italská kuchyně / pizza',
    'Oblíbená pizzerie s italskou kuchyní a rodinnou atmosférou.',
    50.0381,
    15.7786,
    'https://www.utoma.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-zvonu',
    'Restaurace U Zvonu',
    'Chrudim',
    '🌊 CALM',
    'česká kuchyně',
    'Klasická restaurace v centru města, česká klasika a klidné prostředí.',
    49.9503,
    15.7968,
    'https://www.uzvonu-chrudim.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-stara-hospoda-vm',
    'Restaurace Stará Hospoda',
    'Vysoké Mýto',
    '🌮 CHAOS',
    'česká kuchyně / hospoda',
    'Tradiční hospoda s živou atmosférou a českou klasikou.',
    49.9552,
    16.1632,
    'https://www.starahospoda-vm.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-hradu-lanskroun',
    'Restaurace U Hradu',
    'Lanškroun',
    '🌊 CALM',
    'česká kuchyně',
    'Oblíbená restaurace v centru města, spolehlivá česká kuchyně.',
    49.9118,
    16.6115,
    'https://www.uhradu-lanskroun.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-capa',
    'Restaurace U Čápa',
    'Ústí nad Orlicí',
    '🌿 PURE',
    'česká / regionální kuchyně',
    'Rodinná restaurace s tradičními pokrmy a domácí atmosférou.',
    49.9732,
    16.3947,
    'https://www.ucapa.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-namesti-hlinsko',
    'Restaurace Na Náměstí',
    'Hlinsko',
    '🌊 CALM',
    'česká kuchyně',
    'Klasická restaurace na hlavním náměstí, česká klasika.',
    49.7621,
    15.9067,
    'https://www.nanamesti-hlinsko.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-zlaty-kriz',
    'Restaurace Zlatý Kříž',
    'Pardubice',
    '🍷 LUXE',
    'moderní česká',
    'Elegantní restaurace s kvalitní kuchyní a stylovou atmosférou.',
    50.0369,
    15.7792,
    'https://www.zlatykriz.cz/images/restaurace.jpg',
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;
