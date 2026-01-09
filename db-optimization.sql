-- GURMAO.cz - Database Performance Optimization
-- Supabase SQL skripty pro zlepšení výkonu databáze

-- ========================================
-- 1. INDEXY PRO RYCHLEJŠÍ DOTAZY
-- ========================================

-- Index pro filtrování podle vibe
CREATE INDEX IF NOT EXISTS idx_restaurants_vibe 
ON restaurants(vibe);

-- Index pro filtrování podle města
CREATE INDEX IF NOT EXISTS idx_restaurants_city 
ON restaurants(city);

-- Index pro řazení podle data vytvoření (DESC)
CREATE INDEX IF NOT EXISTS idx_restaurants_created_desc 
ON restaurants(created_at DESC);

-- Composite index pro vibe + město (nejčastější kombinace)
CREATE INDEX IF NOT EXISTS idx_restaurants_vibe_city 
ON restaurants(vibe, city);

-- GiST index pro geografické vyhledávání (blízko mě)
CREATE INDEX IF NOT EXISTS idx_restaurants_location 
ON restaurants 
USING gist(geography(ST_MakePoint(longitude, latitude)));

-- GIN index pro full-text search v názvu a popisu
CREATE INDEX IF NOT EXISTS idx_restaurants_search_name 
ON restaurants 
USING gin(to_tsvector('simple', name));

CREATE INDEX IF NOT EXISTS idx_restaurants_search_description 
ON restaurants 
USING gin(to_tsvector('simple', description));

-- ========================================
-- 2. MATERIALIZED VIEW PRO STATISTIKY
-- ========================================

-- Vytvoření materialized view pro rychlé načítání statistik
CREATE MATERIALIZED VIEW IF NOT EXISTS restaurant_stats AS
SELECT 
  r.id,
  r.slug,
  r.name,
  r.vibe,
  r.city,
  COUNT(DISTINCT sr.user_id) as save_count,
  COALESCE(AVG(rat.rating), 0) as avg_rating,
  COUNT(DISTINCT rat.id) as rating_count
FROM restaurants r
LEFT JOIN saved_restaurants sr ON r.slug = sr.restaurant_id
LEFT JOIN ratings rat ON r.slug = rat.restaurant_id
GROUP BY r.id, r.slug, r.name, r.vibe, r.city;

-- Index na materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurant_stats_slug 
ON restaurant_stats(slug);

CREATE INDEX IF NOT EXISTS idx_restaurant_stats_vibe 
ON restaurant_stats(vibe);

-- ========================================
-- 3. REFRESH FUNCTION PRO MATERIALIZED VIEW
-- ========================================

-- Funkce pro refresh statistik
CREATE OR REPLACE FUNCTION refresh_restaurant_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY restaurant_stats;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 4. FULL-TEXT SEARCH OPTIMALIZACE
-- ========================================

-- Přidat tsvector sloupec pro rychlejší full-text search
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Vytvořit trigger pro automatickou aktualizaci search_vector
CREATE OR REPLACE FUNCTION restaurants_search_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.city, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.tag, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Přiřadit trigger k tabulce
DROP TRIGGER IF EXISTS restaurants_search_update ON restaurants;
CREATE TRIGGER restaurants_search_update
  BEFORE INSERT OR UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION restaurants_search_trigger();

-- Index na search_vector
CREATE INDEX IF NOT EXISTS idx_restaurants_search_vector 
ON restaurants 
USING gin(search_vector);

-- Naplnit search_vector pro existující záznamy
UPDATE restaurants 
SET search_vector = 
  setweight(to_tsvector('simple', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(city, '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE(description, '')), 'C') ||
  setweight(to_tsvector('simple', COALESCE(tag, '')), 'D')
WHERE search_vector IS NULL;

-- ========================================
-- 5. ANALYTICKÉ FUNKCE
-- ========================================

-- Funkce pro získání restaurací s pagination
CREATE OR REPLACE FUNCTION get_restaurants_paginated(
  page_size INT DEFAULT 24,
  page_number INT DEFAULT 0,
  vibe_filter TEXT DEFAULT NULL,
  city_filter TEXT DEFAULT NULL,
  search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  name TEXT,
  city TEXT,
  vibe TEXT,
  tag TEXT,
  description TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT 
      r.*,
      COUNT(*) OVER() as total_count
    FROM restaurants r
    WHERE 
      (vibe_filter IS NULL OR r.vibe = vibe_filter)
      AND (city_filter IS NULL OR r.city = city_filter)
      AND (
        search_query IS NULL 
        OR r.search_vector @@ to_tsquery('simple', search_query)
      )
  )
  SELECT 
    f.id,
    f.slug,
    f.name,
    f.city,
    f.vibe,
    f.tag,
    f.description,
    f.latitude,
    f.longitude,
    f.image_url,
    f.created_at,
    f.total_count
  FROM filtered f
  ORDER BY f.created_at DESC
  LIMIT page_size
  OFFSET (page_number * page_size);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6. GEOGRAFICKÉ FUNKCE
-- ========================================

-- Funkce pro vyhledání restaurací v okruhu (km)
CREATE OR REPLACE FUNCTION get_restaurants_nearby(
  user_lat NUMERIC,
  user_lng NUMERIC,
  radius_km NUMERIC DEFAULT 10,
  limit_count INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  name TEXT,
  city TEXT,
  vibe TEXT,
  distance_km NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.slug,
    r.name,
    r.city,
    r.vibe,
    ROUND(
      ST_Distance(
        ST_MakePoint(user_lng, user_lat)::geography,
        ST_MakePoint(r.longitude, r.latitude)::geography
      ) / 1000,
      2
    ) as distance_km
  FROM restaurants r
  WHERE 
    r.latitude IS NOT NULL 
    AND r.longitude IS NOT NULL
    AND ST_DWithin(
      ST_MakePoint(user_lng, user_lat)::geography,
      ST_MakePoint(r.longitude, r.latitude)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. PERFORMANCE MONITORING
-- ========================================

-- View pro sledování pomalých dotazů
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100 -- dotazy pomalejší než 100ms
ORDER BY mean_time DESC
LIMIT 20;

-- ========================================
-- 8. MAINTENANCE SKRIPTY
-- ========================================

-- Funkce pro pravidelnou údržbu
CREATE OR REPLACE FUNCTION maintenance_routine()
RETURNS void AS $$
BEGIN
  -- Vacuum analyze pro optimalizaci
  VACUUM ANALYZE restaurants;
  VACUUM ANALYZE saved_restaurants;
  VACUUM ANALYZE ratings;
  
  -- Refresh materialized view
  PERFORM refresh_restaurant_stats();
  
  -- Reindex pokud potřeba
  REINDEX TABLE CONCURRENTLY restaurants;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 9. VERIFY INDEXES
-- ========================================

-- Query pro kontrolu, které indexy se používají
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ========================================
-- 10. USAGE STATISTICS
-- ========================================

-- Vytvoření view pro statistiky používání
CREATE OR REPLACE VIEW restaurant_usage_stats AS
SELECT
  vibe,
  COUNT(*) as total_restaurants,
  COUNT(DISTINCT city) as cities_count,
  AVG(
    CASE 
      WHEN latitude IS NOT NULL AND longitude IS NOT NULL 
      THEN 1 
      ELSE 0 
    END
  ) * 100 as gps_coverage_percent
FROM restaurants
GROUP BY vibe
ORDER BY total_restaurants DESC;

-- ========================================
-- HOTOVO!
-- ========================================

-- Konečný report
SELECT 
  'Indexes created' as status,
  COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'restaurants';

COMMENT ON TABLE restaurants IS 'Optimized with full-text search, geo indexes, and materialized views';
