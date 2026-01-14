-- Přidání pole pro telefon do tabulky restaurants
-- Zkopíruj tento SQL do Supabase → SQL Editor → New query → Run

ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Přidat index pro rychlejší vyhledávání podle telefonu
CREATE INDEX IF NOT EXISTS idx_restaurants_phone ON restaurants(phone);

-- Komentář k sloupci
COMMENT ON COLUMN restaurants.phone IS 'Telefonní číslo restaurace (formát: +420 xxx xxx xxx)';

-- Příklad UPDATE pro vyplnění telefonních čísel (příklady - upravit dle reality)
-- UPDATE restaurants SET phone = '+420 222 311 234' WHERE slug = 'la-degustation-boheme-bourgeoise';
-- UPDATE restaurants SET phone = '+420 724 123 456' WHERE slug = 'field-restaurant';
