-- Import restaurací PARDUBICKÝ KRAJ 1–10 do GURMAO.cz
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
    'restaurace-dama-a-pan',
    'Restaurace Dáma a Pán',
    'Pardubice',
    '🍷 LUXE',
    'fine dining / moderní česká',
    'Nejvýznamnější fine-dining adresa v kraji, moderní česká kuchyně s mezinárodním přesahem.',
    50.0343,
    15.7812,
    'https://www.damaapan.cz/wp-content/uploads/2021/05/interier.jpg',
    NOW()
  ),
  (
    'restaurace-u-dvou-kohoutu-pardubice',
    'Restaurace U Dvou kohoutů',
    'Pardubice',
    '🌊 CALM',
    'česká kuchyně',
    'Tradiční restaurace v centru města, spolehlivá česká klasika.',
    50.0375,
    15.7768,
    'https://www.udvoukohoutu.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-palube',
    'Restaurace Na Palubě',
    'Pardubice',
    '🌊 CALM',
    'česká / mezinárodní kuchyně',
    'Oblíbená restaurace u řeky, široké menu a příjemná atmosféra.',
    50.0392,
    15.7754,
    'https://www.napalube.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'pivovarska-restaurace-zelena-hora',
    'Pivovarská restaurace Zelená Hora',
    'Pardubice',
    '🌮 CHAOS',
    'česká kuchyně / pivovar',
    'Pivovarnická restaurace s vlastním pivem, živá atmosféra.',
    50.0361,
    15.7823,
    'https://www.zelenahora.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-tri-sedlaku',
    'Restaurace U Tří sedláků',
    'Chrudim',
    '🌊 CALM',
    'česká kuchyně',
    'Klasická restaurace v centru Chrudimi, poctivá česká kuchyně.',
    49.9512,
    15.7953,
    'https://www.utrisedlaku.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-modra-ruze',
    'Restaurace Modrá Růže',
    'Chrudim',
    '🍷 LUXE',
    'moderní česká',
    'Elegantní restaurace s moderním menu a kvalitním servisem.',
    49.9518,
    15.7947,
    'https://www.modraruze-chrudim.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-stara-skola',
    'Restaurace Stará škola',
    'Litomyšl',
    '🌊 CALM',
    'česká kuchyně',
    'Oblíbená restaurace v UNESCO městě, česká klasika a klidné prostředí.',
    49.8686,
    16.3126,
    'https://www.staraskola-litomysl.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-zlateho-kohouta',
    'Restaurace U Zlatého kohouta',
    'Litomyšl',
    '🍷 LUXE',
    'moderní česká / fine dining',
    'Hotelová restaurace s vysokým standardem, kvalitní kuchyně.',
    49.8692,
    16.3118,
    'https://www.uzlatehokohouta.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-rychte',
    'Restaurace Na Rychtě',
    'Vysoké Mýto',
    '🌊 CALM',
    'česká kuchyně',
    'Tradiční restaurace v historickém centru, spolehlivá kuchyně.',
    49.9551,
    16.1628,
    'https://www.narycht.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-hroznu',
    'Restaurace U Hroznu',
    'Ústí nad Orlicí',
    '🌿 PURE',
    'česká / regionální kuchyně',
    'Poctivá česká restaurace s důrazem na lokální suroviny.',
    49.9738,
    16.3936,
    'https://www.uhroznu.cz/images/restaurace.jpg',
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;
