-- Import restaurací VYSOČINA 31–40 do GURMAO.cz
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
    'restaurace-pivovarska-basta',
    'Restaurace Pivovarská bašta',
    'Jihlava',
    '🌮 CHAOS',
    'česká kuchyně / pivovar',
    'Pivní restaurace s vlastním pivem, živá atmosféra a tradiční česká klasika.',
    49.3954,
    15.5912,
    'https://www.pivovarskabasta.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-kata',
    'Restaurace U Kata',
    'Jihlava',
    '🌊 CALM',
    'česká kuchyně',
    'Historická restaurace s dlouhou tradicí, české speciality a klidné prostředí.',
    49.3971,
    15.5894,
    'https://www.ukata.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-zeleny-strom',
    'Restaurace Zelený strom',
    'Žďár nad Sázavou',
    '🌿 PURE',
    'česká / regionální kuchyně',
    'Rodinná restaurace s důrazem na lokální suroviny a tradiční recepty.',
    49.5634,
    15.9402,
    'https://www.zelenystrom-zdar.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-pilska-nadrez',
    'Restaurace Pilská nádrž',
    'Žďár nad Sázavou',
    '🌊 CALM',
    'česká kuchyně / výletní restaurace',
    'Restaurace u přehrady s krásným výhledem, oblíbená na víkendové výlety.',
    49.5892,
    15.9276,
    'https://www.pilskanadrez.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-vysocine',
    'Restaurace Na Vysočině',
    'Bystřice nad Pernštejnem',
    '🌿 PURE',
    'česká kuchyně',
    'Klasická restaurace s domácí kuchyní, lokálně velmi oblíbená.',
    49.5225,
    16.2649,
    'https://www.navysocine.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-sokolovna',
    'Restaurace Sokolovna',
    'Bystřice nad Pernštejnem',
    '🌮 CHAOS',
    'česká kuchyně / pivnice',
    'Hospoda s živou atmosférou, oblíbená na pivo a české klasiky.',
    49.5231,
    16.2638,
    'https://www.sokolovna-bystrice.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-bowling-morava',
    'Restaurace Bowling Morava',
    'Třebíč',
    '🌮 CHAOS',
    'česká kuchyně / zábavní centrum',
    'Restaurace s bowlingem, zábavní atmosféra a široké menu.',
    49.2172,
    15.8826,
    'https://www.bowlingmorava.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-kaplicky',
    'Restaurace U Kapličky',
    'Pacov',
    '🌊 CALM',
    'česká kuchyně',
    'Menší rodinná restaurace, poctivá kuchyně a klidné prostředí.',
    49.4712,
    15.0019,
    'https://www.ukaplicpacov.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-krakonos',
    'Restaurace Krakonoš',
    'Havlíčkův Brod',
    '🌿 PURE',
    'česká / regionální kuchyně',
    'Tradiční restaurace se zaměřením na domácí kuchyni a lokální suroviny.',
    49.6089,
    15.5823,
    'https://www.krakonos-hb.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-statku',
    'Restaurace Na Statku',
    'Ledeč nad Sázavou',
    '🌿 PURE',
    'česká / venkovská kuchyně',
    'Venkovská restaurace s rustikálním prostředím a tradičními pokrmy.',
    49.6912,
    15.2719,
    'https://www.nastatku-ledec.cz/images/restaurace.jpg',
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;
