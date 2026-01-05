-- Restaurace 81-90 pro GURMAO.cz
-- 🌊 CALM převedeno: #82 Kolkovna Celnice → PURE, #86 Bellevue → LUXE, #88 Oblaca → PURE

INSERT INTO restaurants (slug, name, city, vibe, tag, description, latitude, longitude, image_url)
VALUES
  ('u-pinkasu', 'U Pinkasů', 'Praha', '🌮 CHAOS', 'česká kuchyně / pivnice', 'Historická pražská pivnice s tradiční kuchyní a legendárním tankovým pivem.', 50.08160, 14.41990, 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80'),
  ('kolkovna-celnice', 'Kolkovna Celnice', 'Praha', '🌿 PURE', 'česká kuchyně / pivovar', 'Prostorná restaurace s českou klasikou, vhodná i pro větší skupiny.', 50.08880, 14.43110, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80'),
  ('luka-lu', 'Luka Lu', 'Praha', '🌮 CHAOS', 'balkánská kuchyně', 'Energická balkánská restaurace plná chutí, masa, vína a hlučné atmosféry.', 50.08690, 14.42180, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80'),
  ('maitrea', 'Maitrea', 'Praha', '🌿 PURE', 'vegetariánská / veganská kuchyně', 'Klidná vegetariánská restaurace v centru Prahy s harmonickým prostředím.', 50.08790, 14.42030, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80'),
  ('le-grill', 'Le Grill', 'Praha', '🍷 LUXE', 'fine dining / hotelová restaurace', 'Luxusní restaurace v hotelu Grand Mark s mezinárodní kuchyní a precizním servisem.', 50.08720, 14.43380, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'),
  ('bellevue', 'Bellevue', 'Praha', '🍷 LUXE', 'fine dining / moderní kuchyně', 'Elegantní restaurace s výhledem na Vltavu a vysoce kultivovanou gastronomií.', 50.09150, 14.41480, 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800&q=80'),
  ('asian-temple', 'Asian Temple', 'Praha', '🔥 DRAMA', 'asijská fusion kuchyně', 'Velkolepý asijský podnik kombinující výrazný interiér, kuchyni a barový život.', 50.09020, 14.42690, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'),
  ('oblaca', 'Oblaca', 'Praha', '🌿 PURE', 'moderní česká kuchyně', 'Restaurace ve výšce s panoramatickým výhledem na Prahu a klidným tempem.', 50.08120, 14.40870, 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'),
  ('la-rotonde', 'La Rotonde', 'Praha', '🍷 LUXE', 'fine dining / francouzská kuchyně', 'Hotelová restaurace s francouzským základem a důrazem na eleganci.', 50.08430, 14.42590, 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&q=80'),
  ('salmon-blue', 'Salmon Blue', 'Praha', '🌿 PURE', 'rybí kuchyně / bistro', 'Specializovaný podnik na ryby a mořské plody s jednoduchým, čistým konceptem.', 50.08980, 14.42110, 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80')
ON CONFLICT (slug) DO NOTHING
RETURNING slug, name, city, vibe;
