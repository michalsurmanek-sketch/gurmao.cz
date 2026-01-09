-- Import restaurací PARDUBICKÝ KRAJ 11–20 do GURMAO.cz
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
    'restaurace-u-maleho-josefa',
    'Restaurace U Malého Josefa',
    'Pardubice',
    '🌿 PURE',
    'česká / domácí kuchyně',
    'Rodinná restaurace s důrazem na tradiční recepty a domácí atmosféru.',
    50.0368,
    15.7789,
    'https://www.umalehojosefa.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-cafe-racek',
    'Restaurace Café Ráček',
    'Pardubice',
    '🌊 CALM',
    'česká / mezinárodní kuchyně',
    'Oblíbená restaurace s kavárnou, široké menu a příjemná atmosféra.',
    50.0385,
    15.7795,
    'https://www.caferacek.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-bowling-u-jelena',
    'Restaurace Bowling U Jelena',
    'Pardubice',
    '🌮 CHAOS',
    'česká kuchyně / bowling',
    'Restaurace s bowlingem, zábavní atmosféra a široké menu.',
    50.0348,
    15.7801,
    'https://www.bowlingjelena.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-cerneho-orla-chrudim',
    'Restaurace U Černého orla',
    'Chrudim',
    '🌊 CALM',
    'česká kuchyně',
    'Tradiční restaurace v centru města, spolehlivá česká klasika.',
    49.9505,
    15.7961,
    'https://www.ucerneho-orla-chrudim.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'pizzerie-da-vinci',
    'Pizzerie Da Vinci',
    'Chrudim',
    '🌿 PURE',
    'italská kuchyně / pizza',
    'Oblíbená italská restaurace s pizzou a pastami, rodinná atmosféra.',
    49.9520,
    15.7939,
    'https://www.davinci-chrudim.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-klasterni',
    'Restaurace Klášterní',
    'Litomyšl',
    '🌊 CALM',
    'česká kuchyně',
    'Restaurace v historických prostorách, česká klasika a klidné prostředí.',
    49.8679,
    16.3132,
    'https://www.klasterni-litomysl.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-cerneho-kone',
    'Restaurace U Černého koně',
    'Litomyšl',
    '🌮 CHAOS',
    'česká kuchyně / hospoda',
    'Tradiční hospoda s živější atmosférou a českou klasikou.',
    49.8683,
    16.3121,
    'https://www.ucernehokone.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-radnice-vm',
    'Restaurace U Radnice',
    'Vysoké Mýto',
    '🌊 CALM',
    'česká kuchyně',
    'Klasická restaurace na náměstí, spolehlivá kuchyně.',
    49.9548,
    16.1635,
    'https://www.uradnice-vm.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-statku-svitavy',
    'Restaurace Na Statku',
    'Svitavy',
    '🌿 PURE',
    'česká / venkovská kuchyně',
    'Venkovská restaurace s rustikálním interiérem a tradičními pokrmy.',
    49.7563,
    16.4686,
    'https://www.nastatku-svitavy.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-tri-vezicky',
    'Restaurace Tři věžičky',
    'Svitavy',
    '🌊 CALM',
    'česká kuchyně',
    'Oblíbená restaurace v centru města, česká klasika a klidná atmosféra.',
    49.7559,
    16.4693,
    'https://www.trivezicky.cz/images/restaurace.jpg',
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;
