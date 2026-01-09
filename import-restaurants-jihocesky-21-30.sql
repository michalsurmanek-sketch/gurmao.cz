-- Import restaurací JIHOČESKÝ KRAJ 21–30 do GURMAO.cz
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
    'restaurace-supina-trebon',
    'Restaurace Supina',
    'Třeboň',
    '🌊 CALM',
    'česká / rybí speciality',
    'Stylová restaurace s důrazem na ryby z Třeboňska, moderní přístup.',
    49.0042,
    14.7702,
    'https://www.supina-trebon.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-bily-konicek',
    'Restaurace Bílý koníček',
    'Třeboň',
    '🍷 LUXE',
    'moderní česká / fine dining',
    'Elegantní restaurace v hotelu, kvalitní kuchyně a lázeňská atmosféra.',
    49.0038,
    14.7715,
    'https://www.bilykonicek.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'hospoda-u-rychtare',
    'Hospoda U Rychtáře',
    'Písek',
    '🌮 CHAOS',
    'česká kuchyně / pivnice',
    'Tradiční hospoda s českou klasikou, živá atmosféra a dobré pivo.',
    49.3088,
    14.1477,
    'https://www.urychtare.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-kamenneho-mostu',
    'Restaurace U Kamenného mostu',
    'Písek',
    '🌊 CALM',
    'česká kuchyně',
    'Oblíbená restaurace u nejstaršího mostu v ČR, klidné prostředí.',
    49.3094,
    14.1469,
    'https://www.ukamennehomotupisek.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurant-jidelna',
    'Restaurant Jídelna',
    'Strakonice',
    '🌿 PURE',
    'moderní česká',
    'Moderní bistro s důrazem na čerstvé suroviny a lehkou kuchyni.',
    49.2614,
    13.9023,
    'https://www.jidelnastrakonice.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-kapra',
    'Restaurace U Kapra',
    'Strakonice',
    '🌊 CALM',
    'česká kuchyně',
    'Klasická restaurace s českou kuchyní, stabilní kvalita.',
    49.2608,
    13.9017,
    'https://www.ukaprastrakonice.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-zamecka',
    'Restaurace Zámecká',
    'Hluboká nad Vltavou',
    '🍷 LUXE',
    'moderní česká / fine dining',
    'Luxusní restaurace s výhledem na zámek, vysoký standard kuchyně.',
    49.0522,
    14.4344,
    'https://www.zameckahluboka.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-cerneho-vola',
    'Restaurace U Černého vola',
    'Vodňany',
    '🌊 CALM',
    'česká kuchyně',
    'Tradiční restaurace v centru města, poctivá česká klasika.',
    49.1478,
    14.1758,
    'https://www.ucernehovola.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-stare-poste',
    'Restaurace Na Staré poště',
    'Prachatice',
    '🌊 CALM',
    'česká kuchyně',
    'Historická restaurace v centru Prachatic, české speciality.',
    49.0131,
    13.9978,
    'https://www.nastareposte-prachatice.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'penzion-restaurace-u-andela',
    'Penzion a restaurace U Anděla',
    'Vimperk',
    '🌿 PURE',
    'česká / domácí kuchyně',
    'Rodinná restaurace s domácí atmosférou a regionálními recepty.',
    49.0524,
    13.7718,
    'https://www.uandela-vimperk.cz/images/restaurace.jpg',
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;
