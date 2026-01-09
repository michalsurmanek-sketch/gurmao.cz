-- Import restaurací VYSOČINA 1–10 do GURMAO.cz
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
    'restaurant-tri-knizata',
    'Restaurant Tři knížata',
    'Jihlava',
    '🍷 LUXE',
    'fine dining / moderní česká',
    'Nejlepší fine-dining adresa na Vysočině, moderní česká kuchyně, důraz na detail a servis.',
    49.3969,
    15.5906,
    'https://www.triknizata.cz/wp-content/uploads/2022/01/restaurant.jpg',
    NOW()
  ),
  (
    'restaurant-pub-radnicni',
    'Restaurant & Pub Radniční',
    'Jihlava',
    '🌊 CALM',
    'česká kuchyně / pivovar',
    'Spolehlivá česká klasika v centru města, oblíbená na obědy i večerní posezení.',
    49.3964,
    15.5901,
    'https://www.radnicni.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurant-goticky-sal',
    'Restaurant Gotický sál',
    'Jihlava',
    '🍷 LUXE',
    'česká / zážitková gastronomie',
    'Stylová restaurace v historických prostorách, ideální pro slavnostní večeře.',
    49.3975,
    15.5892,
    'https://www.hotel-gustavmahler.cz/wp-content/uploads/2021/03/goticky-sal.jpg',
    NOW()
  ),
  (
    'restaurace-u-ctyr-kamaradu',
    'Restaurace U Čtyř kamarádů',
    'Třebíč',
    '🌿 PURE',
    'česká kuchyně',
    'Poctivá česká kuchyně, velké porce, silná lokální obliba.',
    49.2149,
    15.8812,
    'https://www.uctyrkamardu.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'hotel-joseph-1699-restaurace',
    'Hotel Joseph 1699 – Restaurace',
    'Třebíč',
    '🍷 LUXE',
    'moderní česká / fine dining',
    'Elegantní restaurace v židovské čtvrti, moderní gastronomie a klidná atmosféra.',
    49.2165,
    15.8789,
    'https://www.joseph1699.cz/wp-content/uploads/2022/02/restaurant.jpg',
    NOW()
  ),
  (
    'restaurace-u-palecku',
    'Restaurace U Palečků',
    'Havlíčkův Brod',
    '🌊 CALM',
    'česká kuchyně',
    'Tradiční restaurace s dlouhou historií, spolehlivá kuchyně a klasické chutě.',
    49.6076,
    15.5798,
    'https://www.upalecku.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'motorest-melikana',
    'Motorest Melikana',
    'Kamenice u Jihlavy',
    '🌮 CHAOS',
    'česká kuchyně / motorest',
    'Legendární motorest s velkými porcemi, velmi známý po celé Vysočině.',
    49.3684,
    15.7586,
    'https://www.melikana.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-svejka-zdar',
    'Restaurace U Švejka',
    'Žďár nad Sázavou',
    '🌮 CHAOS',
    'česká kuchyně / pivnice',
    'Oblíbená hospoda s českou klasikou, pivo a živější atmosféra.',
    49.5626,
    15.9398,
    'https://www.usvejka-zdar.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-talsky-mlyn',
    'Restaurace Tálský mlýn',
    'Žďár nad Sázavou',
    '🌊 CALM',
    'česká / zážitková restaurace',
    'Restaurace v přírodě u rybníka, klidné místo s důrazem na atmosféru.',
    49.5486,
    15.9584,
    'https://www.talskymlyn.cz/wp-content/uploads/2021/06/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-slunce',
    'Restaurace U Slunce',
    'Pelhřimov',
    '🌿 PURE',
    'česká kuchyně',
    'Klasická restaurace v centru Pelhřimova, dobré obědy i večeře.',
    49.4316,
    15.2239,
    'https://www.hotel-slunce.cz/images/restaurace.jpg',
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;
