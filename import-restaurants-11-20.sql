-- Import restaurací 11-20 do GURMAO.cz
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
    'entree',
    'Entrée',
    'Praha',
    '🔥 DRAMA',
    'modern fine dining',
    'Výrazná moderní gastronomie šéfkuchaře Přemka Forejta, postavená na emocích, kontrastech a silných chutích.',
    50.08390,
    14.43050,
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    NOW()
  ),
  (
    'casa-de-carli',
    'Casa De Carli',
    'Praha',
    '🍷 LUXE',
    'italská kuchyně / fine dining',
    'Elegantní italská restaurace s autentickými surovinami, precizní kuchyní a klidnou atmosférou.',
    50.08260,
    14.42030,
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80',
    NOW()
  ),
  (
    'u-mateje',
    'U Matěje',
    'Praha',
    '🌿 PURE',
    'moderní česká kuchyně',
    'Moderní česká gastronomie založená na lokálních surovinách, sezónnosti a čistých chutích.',
    50.11290,
    14.40870,
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    NOW()
  ),
  (
    'la-finestra-in-cucina',
    'La Finestra in Cucina',
    'Praha',
    '🍷 LUXE',
    'italská kuchyně / fine dining',
    'Špičková italská kuchyně s důrazem na maso, víno a prvotřídní servis v elegantním prostředí.',
    50.08820,
    14.41840,
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    NOW()
  ),
  (
    'stul',
    'Stůl',
    'Praha',
    '🖤 DARK',
    'modern fine dining',
    'Intimní restaurace s otevřenou kuchyní, kde se host stává součástí dění a zážitku.',
    50.09560,
    14.45230,
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80',
    NOW()
  ),
  (
    'next-door-by-imperial',
    'Next Door by Imperial',
    'Praha',
    '🌊 CALM',
    'moderní česká kuchyně',
    'Elegantní restaurace navazující na tradici Café Imperial, s lehčím a modernějším pojetím české kuchyně.',
    50.08930,
    14.43210,
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    NOW()
  ),
  (
    'cafe-imperial',
    'Café Imperial',
    'Praha',
    '🌊 CALM',
    'česká & mezinárodní kuchyně',
    'Legendární podnik se secesním interiérem a dlouhodobě stabilní vysokou kvalitou kuchyně.',
    50.08910,
    14.43240,
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    NOW()
  ),
  (
    'divinis',
    'Divinis',
    'Praha',
    '🍷 LUXE',
    'italská kuchyně / fine dining',
    'Tradiční italská kuchyně v moderním podání s důrazem na jednoduchost a kvalitu surovin.',
    50.08610,
    14.41890,
    'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800&q=80',
    NOW()
  ),
  (
    'borgo-agnese',
    'Borgo Agnese',
    'Brno',
    '🍷 LUXE',
    'italská kuchyně / fine dining',
    'Jedna z nejlepších italských restaurací mimo Prahu, vyhlášená precizní kuchyní a vínem.',
    49.19180,
    16.60740,
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80',
    NOW()
  ),
  (
    'bar-atelier',
    'Bar Atelier',
    'Brno',
    '🔥 DRAMA',
    'bistro / modern cuisine',
    'Kreativní brněnské bistro s otevřenou kuchyní, silnými chutěmi a neformální atmosférou.',
    49.19960,
    16.60890,
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
    NOW()
  );

-- Display all restaurants
SELECT slug, name, city, vibe, tag FROM restaurants ORDER BY created_at DESC;
