-- ⚡ KRITICKÁ OPTIMALIZACE - Spusť v Supabase SQL Editoru
-- Tyto indexy zrychlí dotazy na restaurace až 100x

-- 1. Index pro řazení (order by created_at DESC)
CREATE INDEX IF NOT EXISTS idx_restaurants_created_desc 
ON restaurants(created_at DESC);

-- 2. Index pro filtrování podle vibe
CREATE INDEX IF NOT EXISTS idx_restaurants_vibe 
ON restaurants(vibe);

-- 3. Index pro vyhledávání podle města
CREATE INDEX IF NOT EXISTS idx_restaurants_city 
ON restaurants(city);

-- 4. Composite index pro vibe + město (nejčastější kombinace)
CREATE INDEX IF NOT EXISTS idx_restaurants_vibe_city 
ON restaurants(vibe, city);

-- 5. Full-text search index pro název
CREATE INDEX IF NOT EXISTS idx_restaurants_search_name 
ON restaurants USING gin(to_tsvector('simple', name));

-- ✅ HOTOVO! Zkontroluj vytvořené indexy:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'restaurants';
