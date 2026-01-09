-- Import restaurací VYSOČINA 21–30 do GURMAO.cz
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
    'restaurace-na-stare-radnici',
    'Restaurace Na Staré radnici',
    'Jihlava',
    '🌊 CALM',
    'česká kuchyně / restaurace',
    'Klasická restaurace v historickém centru, spolehlivá kuchyně a klidné posezení.',
    49.3966,
    15.5898,
    'https://www.nastareradnici.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-hospodarsky-dvur',
    'Restaurace Hospodářský dvůr',
    'Jihlava',
    '🌿 PURE',
    'česká / venkovská kuchyně',
    'Restaurace v přírodním stylu s důrazem na tradiční recepty a domácí atmosféru.',
    49.4072,
    15.5661,
    'https://www.hospodarskydvur.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-zlate-hvezdy',
    'Restaurace U Zlaté hvězdy',
    'Třebíč',
    '🌊 CALM',
    'česká kuchyně',
    'Tradiční podnik v centru Třebíče, oblíbený na obědy i večeře.',
    49.2141,
    15.8819,
    'https://www.uzlatehvezdy-trebic.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-adam',
    'Restaurace Adam',
    'Třebíč',
    '🍷 LUXE',
    'moderní česká / fine dining',
    'Moderní restaurace s důrazem na prezentaci a kvalitu, vhodná i pro slavnostní příležitosti.',
    49.2157,
    15.8798,
    'https://www.hoteladamtrebic.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-tri-krizu',
    'Restaurace U Tří křížů',
    'Velké Meziříčí',
    '🌮 CHAOS',
    'česká kuchyně / pivnice',
    'Živější podnik s českou klasikou a pivní atmosférou, oblíbený mezi místními.',
    49.3551,
    16.0138,
    'https://www.utrikerizu.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-selsky-dvur',
    'Restaurace Selský dvůr',
    'Velké Meziříčí',
    '🌿 PURE',
    'česká / regionální kuchyně',
    'Venkovská restaurace s tradičními jídly, klidné prostředí a domácí atmosféra.',
    49.3652,
    16.0014,
    'https://www.selskydvurvm.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-hrosika',
    'Restaurace U Hrošíka',
    'Nové Město na Moravě',
    '🌊 CALM',
    'česká kuchyně',
    'Menší rodinná restaurace, poctivá kuchyně a pohodové posezení.',
    49.5608,
    16.0740,
    'https://www.uhrosika.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-kovarne',
    'Restaurace Na Kovárně',
    'Nové Město na Moravě',
    '🌿 PURE',
    'česká / regionální kuchyně',
    'Restaurace s rustikálním interiérem, zaměřená na tradiční recepty a lokální suroviny.',
    49.5632,
    16.0731,
    'https://www.nakovarne.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-ruze',
    'Restaurace U Růže',
    'Humpolec',
    '🌊 CALM',
    'česká kuchyně',
    'Stabilní restaurace v centru města, oblíbená na obědy i večeře.',
    49.5414,
    15.3607,
    'https://www.uruze-humpolec.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-kotyza',
    'Restaurace Kotyza',
    'Humpolec',
    '🌮 CHAOS',
    'česká kuchyně / pivnice',
    'Tradiční hospoda s českou klasikou a živější atmosférou, silně lokální podnik.',
    49.5419,
    15.3619,
    'https://www.kotyza.cz/images/restaurace.jpg',
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;
