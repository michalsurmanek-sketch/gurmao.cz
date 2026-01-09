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
INSERT INTO chefs (name, slug, vibe, signature_style, bio, image_url) VALUES

-- LUXE kuchaři (1-15)
('Adam Novák', 'adam-novak', '🍷 LUXE', 'Fine Dining Artisan', 'Vizionář české gastronomie. 15 let zkušeností v michelinských restauracích. Specialista na moderní interpretaci klasických pokrmů.', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800'),

('Marie Dvořáková', 'marie-dvorakova', '🍷 LUXE', 'Vegetarian Innovator', 'Průkopnice rostlinné haute cuisine. Tři roky v Paříži u Alaina Ducasse. Její zelenina chutná lépe než maso.', 'https://images.unsplash.com/photo-1607631568010-a87852c512a3?w=800'),

('Jakub Černý', 'jakub-cerny', '🍷 LUXE', 'Molecular Gastronomy', 'Mistr molekulární kuchyně. Kombinuje vědu s uměním. Jeho degustační menu je jako návštěva laboratoře chuti.', 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=800'),

('Eva Procházková', 'eva-prochazkova', '🍷 LUXE', 'Seafood Maestro', 'Specialistka na mořské plody. Každý týden čerstvé dodávky z Bretaně. Její humr je legendární.', 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=800'),

('Tomáš Svoboda', 'tomas-svoboda', '🍷 LUXE', 'Wine & Dine Expert', 'Sommelier a šéfkuchař v jedné osobě. Každé jídlo má svého vinného partnera. Degustační menu je symfonií chutí.', 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800'),

('Petra Malá', 'petra-mala', '🍷 LUXE', 'Pastry Perfectionist', 'Královnou dezertů. Studovala v Paříži u Pierra Hermého. Její millefeuille je poezie.', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800'),

('Martin Horák', 'martin-horak', '🍷 LUXE', 'Czech Tradition Reborn', 'Moderní interpretace české klasiky. Jeho svíčková by dostala Michelin hvězdu.', 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=800'),

('Kateřina Veselá', 'katerina-vesela', '🍷 LUXE', 'Seasonal Artisan', 'Fanatička lokálních sezónních surovin. Menu mění každých 14 dní podle sklizně. Zero waste kuchyně.', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800'),

('David Kučera', 'david-kucera', '🍷 LUXE', 'Meat Specialist', 'Mistr suchého zrání. Vlastní chladící komora s 300 kg masa. Ribeye zralý 90 dní je jeho podpis.', 'https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?w=800'),

('Lucie Nováková', 'lucie-novakova', '🍷 LUXE', 'Nordic Fusion', 'Inspirace skandinávskou kuchyní. Fermentace, čistota, jednoduchost. Česká Noma.', 'https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=800'),

('Ondřej Král', 'ondrej-kral', '🍷 LUXE', 'French Technique Master', 'Klasická francouzská škola. 10 let v Lyonu. Bourguignon jako od babičky v Provence.', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'),

('Barbora Svobodová', 'barbora-svobodova', '🍷 LUXE', 'Avant-Garde Cuisine', 'Experimentální kuchyně. Každý talíř je umělecké dílo. Jíš očima i chutěmi.', 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=800'),

('Filip Novotný', 'filip-novotny', '🍷 LUXE', 'Truffle Hunter', 'Specialista na lanýže a houby. Vlastní trénované psy. Podzimní menu je jeho královstvím.', 'https://images.unsplash.com/photo-1560624052-449f5ddf0c31?w=800'),

('Tereza Marková', 'tereza-markova', '🍷 LUXE', 'Chocolate Alchemist', 'Kouzelnice čokolády. Bean-to-bar. Její čokoládové soufflé mění životy.', 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800'),

('Richard Beneš', 'richard-benes', '🍷 LUXE', 'Caviar & Champagne', 'Luxus v každém detailu. Kaviar z vlastní farmy. Šampaňské jen Grand Cru.', 'https://images.unsplash.com/photo-1558507652-2d9626c4e67a?w=800'),

-- DRAMA kuchaři (16-30)
('Jan Šmíd', 'jan-smid', '🔥 DRAMA', 'Fire Master', 'Vše griluje na otevřeném ohni. Jeho steakhouse je chrám masa. T-bone pro 4 osoby je zážitek.', 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800'),

('Simona Krajčová', 'simona-krajcova', '🔥 DRAMA', 'Spice Queen', 'Královna koření. Importuje přímo z Indie a Thajska. Její vindaloo spálí jazyk i duši.', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800'),

('Marek Pospíšil', 'marek-pospisil', '🔥 DRAMA', 'BBQ Champion', 'Mistr amerického BBQ. Brisket kouří 16 hodin. Kansas City style v centru Prahy.', 'https://images.unsplash.com/photo-1558507652-2d9626c4e67a?w=800'),

('Veronika Danielová', 'veronika-danielova', '🔥 DRAMA', 'Latin Fire', 'Latinská kuchyně s ohněm. Ceviche, anticuchos, asado. Buenos Aires přišel do Brna.', 'https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?w=800'),

('Petr Soukup', 'petr-soukup', '🔥 DRAMA', 'Korean BBQ Master', 'Specialista na korejské BBQ. Gochugaru a doenjang má v krvi. Kimchi fermentuje 6 měsíců.', 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=800'),

('Lenka Urbánková', 'lenka-urbankova', '🔥 DRAMA', 'Volcanic Cuisine', 'Jídlo jako vulkán. Každé jídlo má svůj peak. Když to není intenzivní, není to dobré.', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800'),

('Štěpán Moravec', 'stepan-moravec', '🔥 DRAMA', 'Bourbon & Smoke', 'Whiskey a uzené maso. Vlastní udírna a 200 druhů bourbonu. Texas v Čechách.', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'),

('Michaela Hrubá', 'michaela-hruba', '🔥 DRAMA', 'Szechuan Specialist', 'Mistrkyně sečuánské kuchyně. Má-la je její láska. 麻辣 v každém jídle.', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800'),

('Radek Bureš', 'radek-bures', '🔥 DRAMA', 'Steak Perfectionist', 'Steak má jen jeden správný stupeň: medium-rare. Wagyu A5 z Japonska každý měsíc.', 'https://images.unsplash.com/photo-1560624052-449f5ddf0c31?w=800'),

('Nikola Zemanová', 'nikola-zemanova', '🔥 DRAMA', 'Chili Champion', 'Pěstuje vlastní chilli. Carolina Reaper je pro slabší. Její hot sauce je legální weapon.', 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=800'),

('Lukáš Krejčí', 'lukas-krejci', '🔥 DRAMA', 'Wild Game Hunter', 'Specialista na zvěřinu. Vlastní honitba. Jelení hřbet s borůvkami je jeho signature.', 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800'),

('Zuzana Hájková', 'zuzana-hajkova', '🔥 DRAMA', 'Argentinian Asado', 'Asado jako v Buenos Aires. Gril na dřevěné uhlí. Chimichurri dělá denně čerstvý.', 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800'),

('Vojtěch Král', 'vojtech-kral', '🔥 DRAMA', 'Yakitori Master', 'Japonské grilované špízy. Binchōtan dřevěné uhlí. Každý kousek je perfektní.', 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=800'),

('Klára Svobodová', 'klara-svobodova', '🔥 DRAMA', 'Fusion Rebel', 'Nerespektuje pravidla. Mixuje vše se vším. Někdy skvělé, někdy katastrofa. Nikdy nudné.', 'https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?w=800'),

('Daniel Kos', 'daniel-kos', '🔥 DRAMA', 'Open Fire Wizard', 'Všechno vaří na otevřeném ohni. Žádný plyn, žádná elektřina. Primal cooking.', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800'),

-- CHAOS kuchaři (31-40)
('Sofia Martinez', 'sofia-martinez', '🌮 CHAOS', 'Street Food Queen', 'Ulice je její restaurace. Tacos, burritos, quesadillas. Mexico City vibe v Praze.', 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=800'),

('Pavel Dvořák', 'pavel-dvorak', '🌮 CHAOS', 'Burger Anarchist', 'Burgery mimo limity. Triple bacon monster s pršutem a kimchi. Pravidla jsou k překračování.', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'),

('Anna Nguyen', 'anna-nguyen', '🌮 CHAOS', 'Vietnamese Fusion', 'Banh mi s českou klobásou. Phở s české hovězí. Vietnam meets Česko.', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800'),

('Tomáš Urban', 'tomas-urban', '🌮 CHAOS', 'Pizza Rebel', 'Neapolská pizza s českou twist. Utopenec pizza, svíčková pizza. Italové by plakali.', 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=800'),

('Emma Kozák', 'emma-kozak', '🌮 CHAOS', 'Ramen Hacker', 'Ramen není dogma. Zelňačka ramen. Vepřo-knedlo-ramen. Je to šílené, ale funguje to.', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800'),

('Miroslav Bárta', 'miroslav-barta', '🌮 CHAOS', 'Kebab Innovator', 'Kebab není fast food. Premium maso, čerstvé pečivo, vlastní omáčky. Berlín by záviděl.', 'https://images.unsplash.com/photo-1560624052-449f5ddf0c31?w=800'),

('Natálie Kim', 'natalie-kim', '🌮 CHAOS', 'K-Street Fusion', 'Korejské street food. Kimchi hot dog, bulgogi tacos, tteokbokki fries. Seoul v Ostravě.', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800'),

('Jiří Novák', 'jiri-novak', '🌮 CHAOS', 'Smash Burger King', 'Smash burgery na 300°C plotně. Crispy okraje, juice inside. Queue hodina čekání.', 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800'),

('Kristýna Vaňková', 'kristyna-vankova', '🌮 CHAOS', 'Poke Bowl Artist', 'Havajské poke bowls s local fish. Čerstvý losos z Norska každé ráno.', 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800'),

('Martin Fišer', 'martin-fiser', '🌮 CHAOS', 'Wrap Wizard', 'Wraps které nemají konec. 20 ingrediencí v jednom. Controlled chaos.', 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=800'),

-- PURE kuchaři (41-45)
('Jana Horáková', 'jana-horakova', '🌿 PURE', 'Farm to Table', 'Vlastní farma, vlastní restaurace. Zelenina je na talíři do 2 hodin po sklizni.', 'https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?w=800'),

('Robert Malý', 'robert-maly', '🌿 PURE', 'Organic Purist', 'Bio certifikát na vše. Žádné GMO, žádné E-čka. Čistota v každém detailu.', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800'),

('Markéta Benešová', 'marketa-benesova', '🌿 PURE', 'Raw Food Master', 'Nic nad 42°C. Enzymy jsou život. Její raw cheesecake je přesto dokonalý.', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800'),

('Stanislav Horák', 'stanislav-horak', '🌿 PURE', 'Minimalist Chef', 'Méně je více. Maximum 5 ingrediencí na jídlo. Každá surovina musí mít smysl.', 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=800'),

('Alena Procházková', 'alena-prochazkova', '🌿 PURE', 'Vegan Visionary', 'Veganství bez kompromisů. Její seitan je lepší než kuře. Cashew sýr je sýr.', 'https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=800'),

-- DARK & CALM kuchaři (46-50)
('Viktor Šťastný', 'viktor-stastny', '🖤 DARK', 'Noir Cuisine', 'Temná strana gastronomie. Squid ink pasta, černý česnek, aktivní uhlí. Goth dining.', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'),

('Monika Černá', 'monika-cerna', '🖤 DARK', 'Midnight Dining', 'Otevřeno jen po půlnoci. Degustační menu při svíčkách. Experience jako z Twin Peaks.', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800'),

('Radim Soukup', 'radim-soukup', '🌊 CALM', 'Zen Master', 'Japonská filozofie v kuchyni. Kaiseki menu. Každý talíř je meditace.', 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=800'),

('Lenka Mařík', 'lenka-marik', '🌊 CALM', 'Tea Ceremony Chef', 'Matcha v každém jídle. Čajový pairing k menu. Japonsko meets Morava.', 'https://images.unsplash.com/photo-1560624052-449f5ddf0c31?w=800'),

('Petr Novotný', 'petr-novotny', '🌊 CALM', 'Slow Food Pioneer', 'Slow food movement. Nic se nespěchá. Risotto míchá 30 minut. Život je krátký, jídlo pomalé.', 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800');

-- Vytvoř index pro rychlejší vyhledávání
CREATE INDEX IF NOT EXISTS idx_chefs_vibe ON chefs(vibe);
CREATE INDEX IF NOT EXISTS idx_chefs_slug ON chefs(slug);
CREATE INDEX IF NOT EXISTS idx_chefs_created ON chefs(created_at DESC);

-- Hotovo! ✅
SELECT COUNT(*) as "Počet kuchařů v databázi" FROM chefs;
