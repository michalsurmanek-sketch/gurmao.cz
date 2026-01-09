-- ⚡ OPRAVA RATING SYSTÉMU - Vytvoření chybějících tabulek a views
-- Spusť v Supabase SQL Editoru, pak můžeš zapnout ratings zpět

-- 1. Ujisti se, že existuje tabulka ratings
CREATE TABLE IF NOT EXISTS ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, user_id) -- Jeden uživatel může hodnotit restauraci jen 1x
);

-- 2. Index pro rychlejší dotazy
CREATE INDEX IF NOT EXISTS idx_ratings_restaurant ON ratings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created ON ratings(created_at DESC);

-- 3. Vytvoř MATERIALIZED VIEW pro statistiky (řeší 404 errory!)
DROP MATERIALIZED VIEW IF EXISTS rating_stats;
CREATE MATERIALIZED VIEW rating_stats AS
SELECT 
  restaurant_id,
  COUNT(*)::integer as rating_count,
  ROUND(AVG(stars)::numeric, 2) as average_rating,
  COUNT(*) FILTER (WHERE stars = 5)::integer as five_stars,
  COUNT(*) FILTER (WHERE stars = 4)::integer as four_stars,
  COUNT(*) FILTER (WHERE stars = 3)::integer as three_stars,
  COUNT(*) FILTER (WHERE stars = 2)::integer as two_stars,
  COUNT(*) FILTER (WHERE stars = 1)::integer as one_star,
  MAX(created_at) as last_rated_at
FROM ratings
GROUP BY restaurant_id;

-- 4. Index na materialized view
CREATE UNIQUE INDEX idx_rating_stats_restaurant ON rating_stats(restaurant_id);

-- 5. Funkce pro refresh view (volat po každém novém ratingu)
CREATE OR REPLACE FUNCTION refresh_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY rating_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger pro automatický refresh (volitelné - může být pomalé)
-- UNCOMMENT pokud chceš auto-refresh:
-- DROP TRIGGER IF EXISTS trigger_refresh_rating_stats ON ratings;
-- CREATE TRIGGER trigger_refresh_rating_stats
-- AFTER INSERT OR UPDATE OR DELETE ON ratings
-- FOR EACH STATEMENT
-- EXECUTE FUNCTION refresh_rating_stats();

-- 7. RLS (Row Level Security) policies
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Každý může číst ratings
CREATE POLICY "Anyone can read ratings"
  ON ratings FOR SELECT
  USING (true);

-- Jen přihlášení mohou vložit rating
CREATE POLICY "Authenticated users can insert ratings"
  ON ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Uživatel může upravit jen své vlastní
CREATE POLICY "Users can update own ratings"
  ON ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- Uživatel může smazat jen své vlastní
CREATE POLICY "Users can delete own ratings"
  ON ratings FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Udělat view public readable
GRANT SELECT ON rating_stats TO anon, authenticated;

-- ✅ HOTOVO! Nyní můžeš:
-- 1. Odkomentovat rating.js v feed.html
-- 2. Rating systém bude fungovat BEZ errors
-- 3. Pro refresh statistik zavolej: REFRESH MATERIALIZED VIEW CONCURRENTLY rating_stats;

SELECT 
  'Rating systém připraven!' as status,
  COUNT(*) as existing_ratings
FROM ratings;
