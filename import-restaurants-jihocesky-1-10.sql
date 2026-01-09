-- Import restaurací JIHOČESKÝ KRAJ 1–10 do GURMAO.cz
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
    'restaurant-stangl',
    'Restaurant Štangl',
    'České Budějovice',
    '🍷 LUXE',
    'fine dining / moderní česká',
    'Nejvýraznější fine-dining podnik v kraji, moderní česká kuchyně a precizní servis.',
    48.9747,
    14.4746,
    'https://www.restaurantstangl.cz/wp-content/uploads/2022/01/interier.jpg',
    NOW()
  ),
  (
    'solnice',
    'Solnice',
    'České Budějovice',
    '🌊 CALM',
    'česká kuchyně / moderní gastronomie',
    'Stylová restaurace v historickém objektu, moderní pojetí české kuchyně.',
    48.9743,
    14.4758,
    'https://www.solnicecb.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'masne-kramy',
    'Masné krámy',
    'České Budějovice',
    '🌮 CHAOS',
    'česká kuchyně / pivnice',
    'Legendární podnik s českou klasikou a pivem, silná atmosféra a historie.',
    48.9741,
    14.4750,
    'https://www.masne-kramy.cz/images/interier.jpg',
    NOW()
  ),
  (
    'restaurant-singer',
    'Restaurant Singer',
    'České Budějovice',
    '🍷 LUXE',
    'moderní evropská kuchyně',
    'Elegantní restaurace s autorským menu, vhodná pro zážitkové večeře.',
    48.9749,
    14.4741,
    'https://www.hotelsinger.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'le-jardin',
    'Le Jardin',
    'Český Krumlov',
    '🍷 LUXE',
    'fine dining / francouzská',
    'Fine-dining restaurace v hotelu Bellevue, jedna z top adres v Krumlově.',
    48.8124,
    14.3178,
    'https://www.hotelbellevue.cz/images/lejardin.jpg',
    NOW()
  ),
  (
    'papas-living-restaurant',
    'Papa's Living Restaurant',
    'Český Krumlov',
    '🌊 CALM',
    'italská kuchyně',
    'Oblíbená italská restaurace s výhledem na Vltavu, ideální pro turisty i místní.',
    48.8107,
    14.3156,
    'https://www.papaslivingrestaurant.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'krcma-v-satlavske',
    'Krčma v Šatlavské',
    'Český Krumlov',
    '🌮 CHAOS',
    'středověká / česká kuchyně',
    'Autentická krčma bez elektřiny, silný zážitek a tradiční kuchyně.',
    48.8129,
    14.3169,
    'https://www.krcmavsatlavske.cz/images/interier.jpg',
    NOW()
  ),
  (
    'restaurace-u-dvou-kocek',
    'Restaurace U Dvou koček',
    'Tábor',
    '🌊 CALM',
    'česká kuchyně',
    'Stabilní restaurace v historickém centru Tábora, poctivá česká klasika.',
    49.4148,
    14.6587,
    'https://www.udvoukocektabor.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'goldie-hotel-nautilus',
    'Goldie Hotel Nautilus',
    'Tábor',
    '🍷 LUXE',
    'moderní česká / fine dining',
    'Hotelová restaurace s vysokým standardem kuchyně a klidnou atmosférou.',
    49.4142,
    14.6579,
    'https://www.hotelnatilus.cz/images/goldie.jpg',
    NOW()
  ),
  (
    'restaurace-parkan',
    'Restaurace Parkán',
    'Prachatice',
    '🌿 PURE',
    'česká / regionální kuchyně',
    'Oblíbená restaurace s venkovním posezením, regionální chutě a klid.',
    49.0124,
    13.9971,
    'https://www.restauraceparkan.cz/images/restaurace.jpg',
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;
