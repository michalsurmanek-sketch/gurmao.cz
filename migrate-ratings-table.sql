-- Migrace tabulky ratings pro recenze
-- Tento SQL přidá potřebné sloupce, pokud ještě neexistují
-- Spusť v Supabase SQL Editor

-- Přidat sloupec pro text recenze
ALTER TABLE ratings 
ADD COLUMN IF NOT EXISTS comment TEXT;

-- Přidat sloupec pro titulek recenze
ALTER TABLE ratings 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Přidat sloupec pro jméno uživatele (cache)
ALTER TABLE ratings 
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Přejmenovat stars na rating (pokud existuje stars)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ratings' AND column_name = 'stars'
  ) THEN
    ALTER TABLE ratings RENAME COLUMN stars TO rating;
  END IF;
END $$;

-- Odstranit UNIQUE constraint pokud existuje
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ratings_user_id_restaurant_id_key'
  ) THEN
    ALTER TABLE ratings DROP CONSTRAINT ratings_user_id_restaurant_id_key;
  END IF;
END $$;

-- Aktualizovat check constraint pokud je potřeba
DO $$
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname LIKE 'ratings_stars_check%'
  ) THEN
    ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_stars_check;
  END IF;
  
  -- Add new constraint if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname LIKE 'ratings_rating_check%'
  ) THEN
    ALTER TABLE ratings ADD CONSTRAINT ratings_rating_check CHECK (rating >= 1 AND rating <= 5);
  END IF;
END $$;

-- Nastavit comment jako NOT NULL pouze pro nové záznamy
-- (pro existující záznamy se zachová NULL)
ALTER TABLE ratings 
ALTER COLUMN comment DROP NOT NULL;

-- Info
SELECT 'Migrace dokončena! Tabulka ratings je připravena pro recenze.' as status;
