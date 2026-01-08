-- Tabulka pro hodnocení restaurací
-- Spusť tento SQL v Supabase → SQL Editor → New query → Run

CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id TEXT NOT NULL,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, restaurant_id)
);

-- Indexy pro rychlejší vyhledávání
CREATE INDEX IF NOT EXISTS idx_ratings_restaurant ON ratings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created ON ratings(created_at DESC);

-- RLS (Row Level Security) policies
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Všichni mohou číst všechna hodnocení
CREATE POLICY "Anyone can read ratings"
  ON ratings
  FOR SELECT
  TO public
  USING (true);

-- Pouze přihlášení uživatelé mohou vložit hodnocení
CREATE POLICY "Authenticated users can insert ratings"
  ON ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Uživatelé mohou aktualizovat pouze své hodnocení
CREATE POLICY "Users can update own ratings"
  ON ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Uživatelé mohou mazat pouze své hodnocení
CREATE POLICY "Users can delete own ratings"
  ON ratings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger pro aktualizaci updated_at
CREATE OR REPLACE FUNCTION update_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ratings_updated_at
  BEFORE UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_ratings_updated_at();

-- View pro agregované statistiky hodnocení
CREATE OR REPLACE VIEW rating_stats AS
SELECT 
  restaurant_id,
  COUNT(*) as rating_count,
  ROUND(AVG(stars)::numeric, 1) as average_rating,
  COUNT(CASE WHEN stars = 5 THEN 1 END) as five_stars,
  COUNT(CASE WHEN stars = 4 THEN 1 END) as four_stars,
  COUNT(CASE WHEN stars = 3 THEN 1 END) as three_stars,
  COUNT(CASE WHEN stars = 2 THEN 1 END) as two_stars,
  COUNT(CASE WHEN stars = 1 THEN 1 END) as one_star
FROM ratings
GROUP BY restaurant_id;

-- Komentáře pro dokumentaci
COMMENT ON TABLE ratings IS 'Uživatelská hodnocení restaurací (1-5 hvězdiček)';
COMMENT ON COLUMN ratings.stars IS 'Počet hvězdiček: 1-5';
COMMENT ON VIEW rating_stats IS 'Agregované statistiky hodnocení pro každou restauraci';
