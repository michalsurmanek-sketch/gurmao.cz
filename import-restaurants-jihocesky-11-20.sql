-- Import restaurací JIHOČESKÝ KRAJ 11–20 do GURMAO.cz
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
    'restaurace-supina-supinka',
    'Restaurace Šupina & Šupinka',
    'České Budějovice',
    '🌿 PURE',
    'rybí speciality / moderní česká',
    'Restaurace specializující se na ryby a moderní českou kuchyni, svěží koncept.',
    48.9738,
    14.4763,
    'https://www.supina.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'u-cerneho-orla-cb',
    'U Černého orla',
    'České Budějovice',
    '🌮 CHAOS',
    'česká kuchyně / pivnice',
    'Tradiční česká hospoda s pivem a klasickými pokrmy, živá atmosféra.',
    48.9745,
    14.4754,
    'https://www.ucerneho-orla.cz/images/interier.jpg',
    NOW()
  ),
  (
    'restaurace-laibon',
    'Restaurace Laibon',
    'Český Krumlov',
    '🌿 PURE',
    'vegetariánská / zdravá kuchyně',
    'Vegetariánská restaurace s důrazem na bio a lokální suroviny.',
    48.8113,
    14.3152,
    'https://www.laibon.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'krcma-marketa',
    'Krcma Marketa',
    'Český Krumlov',
    '🌮 CHAOS',
    'česká kuchyně / hospoda',
    'Oblíbená hospoda v turistickém centru, české speciality a pivo.',
    48.8116,
    14.3164,
    'https://www.krcmamarketa.cz/images/interier.jpg',
    NOW()
  ),
  (
    'restaurace-konvice',
    'Restaurace Konvice',
    'Český Krumlov',
    '🌊 CALM',
    'česká kuchyně',
    'Příjemná restaurace s klasickou českou kuchyní a klidnou atmosférou.',
    48.8119,
    14.3147,
    'https://www.konvice.com/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-beseda',
    'Restaurace Beseda',
    'Tábor',
    '🌊 CALM',
    'česká kuchyně',
    'Tradiční restaurace v centru Tábora, spolehlivá kuchyně a servis.',
    49.4145,
    14.6592,
    'https://www.besedatabor.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-zejdliku',
    'Restaurace U Žejdlíků',
    'Tábor',
    '🌮 CHAOS',
    'česká kuchyně / pivnice',
    'Hospoda s českou klasikou a pivem, živější atmosféra.',
    49.4151,
    14.6584,
    'https://www.uzejdliku.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-zlateho-lva',
    'Restaurace U Zlatého lva',
    'Jindřichův Hradec',
    '🌊 CALM',
    'česká kuchyně',
    'Klasická restaurace v historickém centru města, poctivá česká kuchyně.',
    49.1440,
    15.0030,
    'https://www.uzlateho-lva.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-grand-jh',
    'Restaurace Grand',
    'Jindřichův Hradec',
    '🍷 LUXE',
    'moderní česká',
    'Elegantní hotelová restaurace s kvalitní kuchyní a moderním menu.',
    49.1437,
    15.0025,
    'https://www.hotelgrand-jh.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-rozmberske',
    'Restaurace Na Rožmberské',
    'Třeboň',
    '🌿 PURE',
    'česká / rybí speciality',
    'Restaurace s důrazem na rybní pokrmy a regionální suroviny z Třeboňska.',
    49.0036,
    14.7710,
    'https://www.narozmbereske.cz/images/restaurace.jpg',
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;
