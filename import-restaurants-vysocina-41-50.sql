-- Import restaurací VYSOČINA 41–50 do GURMAO.cz (FINÁLNÍ BALÍK)
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
    'restaurace-u-dvou-kohoutu',
    'Restaurace U Dvou kohoutů',
    'Polná',
    '🌊 CALM',
    'česká kuchyně',
    'Tradiční restaurace v centru města, spolehlivá kuchyně a rodinná atmosféra.',
    49.4886,
    15.7189,
    'https://www.udvoukouhoutu.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-cerny-kun',
    'Restaurace Černý kůň',
    'Přibyslav',
    '🌮 CHAOS',
    'česká kuchyně / pivnice',
    'Oblíbená hospoda s českou klasikou a živější atmosférou.',
    49.5785,
    15.7396,
    'https://www.cernykun.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-modry-hrozen',
    'Restaurace Modrý hrozen',
    'Telč',
    '🍷 LUXE',
    'moderní česká / vinařská',
    'Restaurace s kvalitním vinným lístkem v UNESCO městě, moderní gastronomie.',
    49.1838,
    15.4531,
    'https://www.modryhrozen.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-cecha',
    'Restaurace U Čecha',
    'Havlíčkův Brod',
    '🌿 PURE',
    'česká kuchyně',
    'Poctivá česká restaurace s dlouholetou tradicí a domácí atmosférou.',
    49.6084,
    15.5804,
    'https://www.ucecha-hb.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-ranc-u-jizby',
    'Restaurace Ranč u Jizby',
    'Třešť',
    '🌿 PURE',
    'česká / grilování',
    'Venkovská restaurace s grilovanými specialitami a přírodní atmosférou.',
    49.2891,
    15.4782,
    'https://www.rancujizby.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-staroceska-hospoda',
    'Restaurace Staročeská hospoda',
    'Jihlava',
    '🌮 CHAOS',
    'česká kuchyně / hospoda',
    'Pivnice s tradiční atmosférou a klasickými českými pokrmy.',
    49.3968,
    15.5903,
    'https://www.staroceskahospoda.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-stara-posta',
    'Restaurace Stará pošta',
    'Velké Meziříčí',
    '🌊 CALM',
    'česká kuchyně',
    'Klasická restaurace v historické budově, kvalitní servis a klidné prostředí.',
    49.3558,
    16.0126,
    'https://www.staraposta-vm.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-u-andela',
    'Restaurace U Anděla',
    'Moravské Budějovice',
    '🌊 CALM',
    'česká kuchyně',
    'Spolehlivá restaurace s českou klasikou, oblíbená na obědy i večeře.',
    49.0514,
    15.8073,
    'https://www.uandela-mb.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-na-ruzku',
    'Restaurace Na Růžku',
    'Moravské Budějovice',
    '🌿 PURE',
    'česká / regionální kuchyně',
    'Rodinná restaurace s důrazem na tradiční recepty a domácí atmosféru.',
    49.0521,
    15.8064,
    'https://www.naruzku.cz/images/restaurace.jpg',
    NOW()
  ),
  (
    'restaurace-zlata-hvezda-zdar',
    'Restaurace Zlatá hvězda',
    'Žďár nad Sázavou',
    '🍷 LUXE',
    'moderní česká',
    'Elegantní restaurace s moderním pojetím, kvalitní kuchyně a stylové prostředí.',
    49.5629,
    15.9395,
    'https://www.zlatahvezda-zdar.cz/images/restaurace.jpg',
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;
