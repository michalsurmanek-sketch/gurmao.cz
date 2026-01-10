-- Import 50 špičkových šéfkuchařů pro GURMAO.cz
-- Spusť v Supabase SQL Editoru

-- Nejdřív zkontroluj, jestli tabulka chefs existuje
-- Pokud ne, vytvoř ji:
CREATE TABLE IF NOT EXISTS chefs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  vibe TEXT,
  signature_style TEXT,
  bio TEXT,
  image_url TEXT,
  restaurant_id UUID REFERENCES restaurants(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert 50 špičkových šéfkuchařů
-- Použije ON CONFLICT pro update existujících záznamů
INSERT INTO chefs (name, slug, vibe, signature_style, bio, image_url) VALUES

-- LUXE kuchaři (1-15)
('Adam Novák', 'adam-novak', '🍷 LUXE', 'Fine Dining Artisan', 'Vizionář české gastronomie. 15 let zkušeností v michelinských restauracích. Specialista na moderní interpretaci klasických pokrmů.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Marie Dvořáková', 'marie-dvorakova', '🍷 LUXE', 'Vegetarian Innovator', 'Průkopnice rostlinné haute cuisine. Tři roky v Paříži u Alaina Ducasse. Její zelenina chutná lépe než maso.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Jakub Černý', 'jakub-cerny', '🍷 LUXE', 'Molecular Gastronomy', 'Mistr molekulární kuchyně. Kombinuje vědu s uměním. Jeho degustační menu je jako návštěva laboratoře chuti.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Eva Procházková', 'eva-prochazkova', '🍷 LUXE', 'Seafood Maestro', 'Specialistka na mořské plody. Každý týden čerstvé dodávky z Bretaně. Její humr je legendární.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Tomáš Svoboda', 'tomas-svoboda', '🍷 LUXE', 'Wine & Dine Expert', 'Sommelier a šéfkuchař v jedné osobě. Každé jídlo má svého vinného partnera. Degustační menu je symfonií chutí.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Petra Malá', 'petra-mala', '🍷 LUXE', 'Pastry Perfectionist', 'Královnou dezertů. Studovala v Paříži u Pierra Hermého. Její millefeuille je poezie.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Martin Horák', 'martin-horak', '🍷 LUXE', 'Czech Tradition Reborn', 'Moderní interpretace české klasiky. Jeho svíčková by dostala Michelin hvězdu.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Kateřina Veselá', 'katerina-vesela', '🍷 LUXE', 'Seasonal Artisan', 'Fanatička lokálních sezónních surovin. Menu mění každých 14 dní podle sklizně. Zero waste kuchyně.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('David Kučera', 'david-kucera', '🍷 LUXE', 'Meat Specialist', 'Mistr suchého zrání. Vlastní chladící komora s 300 kg masa. Ribeye zralý 90 dní je jeho podpis.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Lucie Nováková', 'lucie-novakova', '🍷 LUXE', 'Nordic Fusion', 'Inspirace skandinávskou kuchyní. Fermentace, čistota, jednoduchost. Česká Noma.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Ondřej Král', 'ondrej-kral', '🍷 LUXE', 'French Technique Master', 'Klasická francouzská škola. 10 let v Lyonu. Bourguignon jako od babičky v Provence.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Barbora Svobodová', 'barbora-svobodova', '🍷 LUXE', 'Avant-Garde Cuisine', 'Experimentální kuchyně. Každý talíř je umělecké dílo. Jíš očima i chutěmi.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Filip Novotný', 'filip-novotny', '🍷 LUXE', 'Truffle Hunter', 'Specialista na lanýže a houby. Vlastní trénované psy. Podzimní menu je jeho královstvím.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Tereza Marková', 'tereza-markova', '🍷 LUXE', 'Chocolate Alchemist', 'Kouzelnice čokolády. Bean-to-bar. Její čokoládové soufflé mění životy.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Richard Beneš', 'richard-benes', '🍷 LUXE', 'Caviar & Champagne', 'Luxus v každém detailu. Kaviar z vlastní farmy. Šampaňské jen Grand Cru.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

-- DRAMA kuchaři (16-30)
('Jan Šmíd', 'jan-smid', '🔥 DRAMA', 'Fire Master', 'Vše griluje na otevřeném ohni. Jeho steakhouse je chrám masa. T-bone pro 4 osoby je zážitek.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Simona Krajčová', 'simona-krajcova', '🔥 DRAMA', 'Spice Queen', 'Královna koření. Importuje přímo z Indie a Thajska. Její vindaloo spálí jazyk i duši.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Marek Pospíšil', 'marek-pospisil', '🔥 DRAMA', 'BBQ Champion', 'Mistr amerického BBQ. Brisket kouří 16 hodin. Kansas City style v centru Prahy.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Veronika Danielová', 'veronika-danielova', '🔥 DRAMA', 'Latin Fire', 'Latinská kuchyně s ohněm. Ceviche, anticuchos, asado. Buenos Aires přišel do Brna.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Petr Soukup', 'petr-soukup', '🔥 DRAMA', 'Korean BBQ Master', 'Specialista na korejské BBQ. Gochugaru a doenjang má v krvi. Kimchi fermentuje 6 měsíců.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Lenka Urbánková', 'lenka-urbankova', '🔥 DRAMA', 'Volcanic Cuisine', 'Jídlo jako vulkán. Každé jídlo má svůj peak. Když to není intenzivní, není to dobré.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Štěpán Moravec', 'stepan-moravec', '🔥 DRAMA', 'Bourbon & Smoke', 'Whiskey a uzené maso. Vlastní udírna a 200 druhů bourbonu. Texas v Čechách.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Michaela Hrubá', 'michaela-hruba', '🔥 DRAMA', 'Szechuan Specialist', 'Mistrkyně sečuánské kuchyně. Má-la je její láska. 麻辣 v každém jídle.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Radek Bureš', 'radek-bures', '🔥 DRAMA', 'Steak Perfectionist', 'Steak má jen jeden správný stupeň: medium-rare. Wagyu A5 z Japonska každý měsíc.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Nikola Zemanová', 'nikola-zemanova', '🔥 DRAMA', 'Chili Champion', 'Pěstuje vlastní chilli. Carolina Reaper je pro slabší. Její hot sauce je legální weapon.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Lukáš Krejčí', 'lukas-krejci', '🔥 DRAMA', 'Wild Game Hunter', 'Specialista na zvěřinu. Vlastní honitba. Jelení hřbet s borůvkami je jeho signature.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Zuzana Hájková', 'zuzana-hajkova', '🔥 DRAMA', 'Argentinian Asado', 'Asado jako v Buenos Aires. Gril na dřevěné uhlí. Chimichurri dělá denně čerstvý.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Vojtěch Král', 'vojtech-kral', '🔥 DRAMA', 'Yakitori Master', 'Japonské grilované špízy. Binchōtan dřevěné uhlí. Každý kousek je perfektní.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Klára Svobodová', 'klara-svobodova', '🔥 DRAMA', 'Fusion Rebel', 'Nerespektuje pravidla. Mixuje vše se vším. Někdy skvělé, někdy katastrofa. Nikdy nudné.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Daniel Kos', 'daniel-kos', '🔥 DRAMA', 'Open Fire Wizard', 'Všechno vaří na otevřeném ohni. Žádný plyn, žádná elektřina. Primal cooking.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

-- CHAOS kuchaři (31-40)
('Sofia Martinez', 'sofia-martinez', '🌮 CHAOS', 'Street Food Queen', 'Ulice je její restaurace. Tacos, burritos, quesadillas. Mexico City vibe v Praze.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Pavel Dvořák', 'pavel-dvorak', '🌮 CHAOS', 'Burger Anarchist', 'Burgery mimo limity. Triple bacon monster s pršutem a kimchi. Pravidla jsou k překračování.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Anna Nguyen', 'anna-nguyen', '🌮 CHAOS', 'Vietnamese Fusion', 'Banh mi s českou klobásou. Phở s české hovězí. Vietnam meets Česko.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Tomáš Urban', 'tomas-urban', '🌮 CHAOS', 'Pizza Rebel', 'Neapolská pizza s českou twist. Utopenec pizza, svíčková pizza. Italové by plakali.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Emma Kozák', 'emma-kozak', '🌮 CHAOS', 'Ramen Hacker', 'Ramen není dogma. Zelňačka ramen. Vepřo-knedlo-ramen. Je to šílené, ale funguje to.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Miroslav Bárta', 'miroslav-barta', '🌮 CHAOS', 'Kebab Innovator', 'Kebab není fast food. Premium maso, čerstvé pečivo, vlastní omáčky. Berlín by záviděl.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Natálie Kim', 'natalie-kim', '🌮 CHAOS', 'K-Street Fusion', 'Korejské street food. Kimchi hot dog, bulgogi tacos, tteokbokki fries. Seoul v Ostravě.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Jiří Novák', 'jiri-novak', '🌮 CHAOS', 'Smash Burger King', 'Smash burgery na 300°C plotně. Crispy okraje, juice inside. Queue hodina čekání.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Kristýna Vaňková', 'kristyna-vankova', '🌮 CHAOS', 'Poke Bowl Artist', 'Havajské poke bowls s local fish. Čerstvý losos z Norska každé ráno.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Martin Fišer', 'martin-fiser', '🌮 CHAOS', 'Wrap Wizard', 'Wraps které nemají konec. 20 ingrediencí v jednom. Controlled chaos.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

-- PURE kuchaři (41-45)
('Jana Horáková', 'jana-horakova', '🌿 PURE', 'Farm to Table', 'Vlastní farma, vlastní restaurace. Zelenina je na talíři do 2 hodin po sklizni.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Robert Malý', 'robert-maly', '🌿 PURE', 'Organic Purist', 'Bio certifikát na vše. Žádné GMO, žádné E-čka. Čistota v každém detailu.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Markéta Benešová', 'marketa-benesova', '🌿 PURE', 'Raw Food Master', 'Nic nad 42°C. Enzymy jsou život. Její raw cheesecake je přesto dokonalý.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Stanislav Horák', 'stanislav-horak', '🌿 PURE', 'Minimalist Chef', 'Méně je více. Maximum 5 ingrediencí na jídlo. Každá surovina musí mít smysl.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Alena Procházková', 'alena-prochazkova', '🌿 PURE', 'Vegan Visionary', 'Veganství bez kompromisů. Její seitan je lepší než kuře. Cashew sýr je sýr.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

-- DARK & CALM kuchaři (46-50)
('Viktor Šťastný', 'viktor-stastny', '🖤 DARK', 'Noir Cuisine', 'Temná strana gastronomie. Squid ink pasta, černý česnek, aktivní uhlí. Goth dining.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Monika Černá', 'monika-cerna', '🖤 DARK', 'Midnight Dining', 'Otevřeno jen po půlnoci. Degustační menu při svíčkách. Experience jako z Twin Peaks.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Radim Soukup', 'radim-soukup', '🌊 CALM', 'Zen Master', 'Japonská filozofie v kuchyni. Kaiseki menu. Každý talíř je meditace.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Lenka Mařík', 'lenka-marik', '🌊 CALM', 'Tea Ceremony Chef', 'Matcha v každém jídle. Čajový pairing k menu. Japonsko meets Morava.', 'ChatGPT Image 10. 1. 2026 14_36_36.png'),

('Petr Novotný', 'petr-novotny', '🌊 CALM', 'Slow Food Pioneer', 'Slow food movement. Nic se nespěchá. Risotto míchá 30 minut. Život je krátký, jídlo pomalé.', 'ChatGPT Image 10. 1. 2026 14_36_36.png')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  vibe = EXCLUDED.vibe,
  signature_style = EXCLUDED.signature_style,
  bio = EXCLUDED.bio,
  image_url = EXCLUDED.image_url;

-- Vytvoř index pro rychlejší vyhledávání
CREATE INDEX IF NOT EXISTS idx_chefs_vibe ON chefs(vibe);
CREATE INDEX IF NOT EXISTS idx_chefs_slug ON chefs(slug);
CREATE INDEX IF NOT EXISTS idx_chefs_created ON chefs(created_at DESC);

-- Hotovo! ✅
SELECT COUNT(*) as "Počet kuchařů v databázi" FROM chefs;
