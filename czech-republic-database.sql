-- GURMAO.cz - databázový základ pro pokrytí celé České republiky
-- Spusťte jednou v Supabase Dashboard -> SQL Editor.
-- Migrace je idempotentní a nemaže žádná existující data.

BEGIN;

-- 14 krajů České republiky. Kódy odpovídají NUTS 3.
CREATE TABLE IF NOT EXISTS public.czech_regions (
  code text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  sort_order smallint NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.czech_regions (code, name, slug, sort_order)
VALUES
  ('CZ010', 'Hlavní město Praha', 'hlavni-mesto-praha', 1),
  ('CZ020', 'Středočeský kraj', 'stredocesky-kraj', 2),
  ('CZ031', 'Jihočeský kraj', 'jihocesky-kraj', 3),
  ('CZ032', 'Plzeňský kraj', 'plzensky-kraj', 4),
  ('CZ041', 'Karlovarský kraj', 'karlovarsky-kraj', 5),
  ('CZ042', 'Ústecký kraj', 'ustecky-kraj', 6),
  ('CZ051', 'Liberecký kraj', 'liberecky-kraj', 7),
  ('CZ052', 'Královéhradecký kraj', 'kralovehradecky-kraj', 8),
  ('CZ053', 'Pardubický kraj', 'pardubicky-kraj', 9),
  ('CZ063', 'Kraj Vysočina', 'kraj-vysocina', 10),
  ('CZ064', 'Jihomoravský kraj', 'jihomoravsky-kraj', 11),
  ('CZ071', 'Olomoucký kraj', 'olomoucky-kraj', 12),
  ('CZ072', 'Zlínský kraj', 'zlinsky-kraj', 13),
  ('CZ080', 'Moravskoslezský kraj', 'moravskoslezsky-kraj', 14)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order;

-- Každý hromadný import bude dohledatelný a půjde zkontrolovat nebo vrátit.
CREATE TABLE IF NOT EXISTS public.restaurant_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_reference text,
  region_code text REFERENCES public.czech_regions(code),
  status text NOT NULL DEFAULT 'draft',
  total_records integer NOT NULL DEFAULT 0,
  imported_records integer NOT NULL DEFAULT 0,
  skipped_records integer NOT NULL DEFAULT 0,
  error_records integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT restaurant_import_batches_status_check
    CHECK (status IN ('draft', 'running', 'completed', 'failed', 'cancelled')),
  CONSTRAINT restaurant_import_batches_counts_check
    CHECK (
      total_records >= 0 AND
      imported_records >= 0 AND
      skipped_records >= 0 AND
      error_records >= 0
    )
);

-- Územní hierarchie, původ dat a kontrola kvality restaurace.
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS region_code text REFERENCES public.czech_regions(code),
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS district_code text,
  ADD COLUMN IF NOT EXISTS municipality_code text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS source_external_id text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES public.restaurant_import_batches(id),
  ADD COLUMN IF NOT EXISTS verification_status text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS quality_score smallint,
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Zachování stávajících restaurací a jejich současného workflow review -> ready.
UPDATE public.restaurants
SET
  country_code = COALESCE(NULLIF(country_code, ''), 'CZ'),
  source_type = COALESCE(NULLIF(source_type, ''), 'legacy_import'),
  verification_status = COALESCE(NULLIF(verification_status, ''), 'review'),
  quality_score = COALESCE(quality_score, 0);

ALTER TABLE public.restaurants
  ALTER COLUMN country_code SET DEFAULT 'CZ',
  ALTER COLUMN country_code SET NOT NULL,
  ALTER COLUMN source_type SET DEFAULT 'manual',
  ALTER COLUMN source_type SET NOT NULL,
  ALTER COLUMN verification_status SET DEFAULT 'review',
  ALTER COLUMN verification_status SET NOT NULL,
  ALTER COLUMN quality_score SET DEFAULT 0,
  ALTER COLUMN quality_score SET NOT NULL;

-- Kontrolní omezení přidáváme pouze pokud ještě neexistují.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'restaurants_country_code_check'
      AND conrelid = 'public.restaurants'::regclass
  ) THEN
    ALTER TABLE public.restaurants
      ADD CONSTRAINT restaurants_country_code_check
      CHECK (country_code = 'CZ');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'restaurants_verification_status_check'
      AND conrelid = 'public.restaurants'::regclass
  ) THEN
    ALTER TABLE public.restaurants
      ADD CONSTRAINT restaurants_verification_status_check
      CHECK (verification_status IN (
        'review', 'ready', 'verified', 'rejected', 'closed', 'unverified', 'pending'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'restaurants_quality_score_check'
      AND conrelid = 'public.restaurants'::regclass
  ) THEN
    ALTER TABLE public.restaurants
      ADD CONSTRAINT restaurants_quality_score_check
      CHECK (quality_score BETWEEN 0 AND 100);
  END IF;
END
$$;

-- Automaticky přepočítá kvalitu záznamu a vyhledávací index.
CREATE OR REPLACE FUNCTION public.set_restaurant_national_metadata()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.country_code := upper(COALESCE(NULLIF(btrim(NEW.country_code), ''), 'CZ'));
  NEW.source_type := COALESCE(NULLIF(btrim(NEW.source_type), ''), 'manual');
  NEW.verification_status := COALESCE(NULLIF(btrim(NEW.verification_status), ''), 'review');

  NEW.quality_score :=
    CASE WHEN NULLIF(btrim(NEW.name), '') IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN NULLIF(btrim(NEW.city), '') IS NOT NULL THEN 8 ELSE 0 END +
    CASE WHEN NULLIF(btrim(NEW.region_code), '') IS NOT NULL THEN 8 ELSE 0 END +
    CASE WHEN NULLIF(btrim(NEW.district_code), '') IS NOT NULL THEN 5 ELSE 0 END +
    CASE WHEN NULLIF(btrim(NEW.address), '') IS NOT NULL THEN 12 ELSE 0 END +
    CASE WHEN NULLIF(btrim(NEW.postal_code), '') IS NOT NULL THEN 4 ELSE 0 END +
    CASE WHEN NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN 8 ELSE 0 END +
    CASE WHEN NULLIF(btrim(NEW.description), '') IS NOT NULL THEN 8 ELSE 0 END +
    CASE WHEN NULLIF(btrim(NEW.tag), '') IS NOT NULL THEN 7 ELSE 0 END +
    CASE WHEN NULLIF(btrim(NEW.image_url), '') IS NOT NULL THEN 8 ELSE 0 END +
    CASE WHEN NULLIF(btrim(NEW.phone), '') IS NOT NULL THEN 5 ELSE 0 END +
    CASE WHEN NULLIF(btrim(NEW.website), '') IS NOT NULL THEN 7 ELSE 0 END +
    CASE WHEN NULLIF(btrim(NEW.source_url), '') IS NOT NULL THEN 5 ELSE 0 END +
    CASE WHEN NULLIF(btrim(NEW.source_external_id), '') IS NOT NULL THEN 3 ELSE 0 END +
    CASE WHEN NEW.verified_at IS NOT NULL THEN 2 ELSE 0 END;

  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.tag, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.city, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.district, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.address, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'D');

  RETURN NEW;
END;
$$;

-- Nahrazuje také starší samostatný trigger z db-optimization.sql, aby se
-- search_vector po výpočtu nepřepsal méně úplnou verzí.
DROP TRIGGER IF EXISTS restaurants_search_update ON public.restaurants;
DROP TRIGGER IF EXISTS restaurants_national_metadata ON public.restaurants;
CREATE TRIGGER restaurants_national_metadata
  BEFORE INSERT OR UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.set_restaurant_national_metadata();

-- Přepočet všech existujících záznamů po prvním spuštění migrace.
UPDATE public.restaurants
SET quality_score = quality_score;

-- Rychlé filtrování podle území, stavu, kvality a zdroje.
CREATE INDEX IF NOT EXISTS idx_restaurants_region_city
  ON public.restaurants(region_code, city);
CREATE INDEX IF NOT EXISTS idx_restaurants_district_code
  ON public.restaurants(district_code);
CREATE INDEX IF NOT EXISTS idx_restaurants_municipality_code
  ON public.restaurants(municipality_code);
CREATE INDEX IF NOT EXISTS idx_restaurants_verification_status
  ON public.restaurants(verification_status);
CREATE INDEX IF NOT EXISTS idx_restaurants_quality_score
  ON public.restaurants(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_restaurants_import_batch
  ON public.restaurants(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_search_vector
  ON public.restaurants USING gin(search_vector);

CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_source_identity
  ON public.restaurants(source_type, source_external_id)
  WHERE source_external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_import_batches_status
  ON public.restaurant_import_batches(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_batches_region
  ON public.restaurant_import_batches(region_code, created_at DESC);

-- Přehled pokrytí pro budoucí administrační obrazovku.
CREATE OR REPLACE VIEW public.restaurant_coverage AS
SELECT
  rg.code AS region_code,
  rg.name AS region_name,
  rg.slug AS region_slug,
  r.district,
  r.district_code,
  r.city,
  count(r.id)::integer AS total_restaurants,
  count(r.id) FILTER (
    WHERE r.verification_status IN ('ready', 'verified')
  )::integer AS publishable_restaurants,
  round(COALESCE(avg(r.quality_score), 0), 1) AS average_quality_score,
  max(r.last_checked_at) AS last_checked_at
FROM public.czech_regions rg
LEFT JOIN public.restaurants r ON r.region_code = rg.code
GROUP BY rg.code, rg.name, rg.slug, rg.sort_order, r.district, r.district_code, r.city
ORDER BY rg.sort_order, r.district, r.city;

-- Veřejné čtení seznamu krajů; importní dávky zůstávají neveřejné.
ALTER TABLE public.czech_regions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read Czech regions" ON public.czech_regions;
CREATE POLICY "Public can read Czech regions"
  ON public.czech_regions
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.czech_regions TO anon, authenticated;
GRANT SELECT ON public.restaurant_coverage TO authenticated;

ALTER TABLE public.restaurant_import_batches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.restaurant_import_batches FROM anon, authenticated;
GRANT ALL ON public.restaurant_import_batches TO service_role;

COMMENT ON TABLE public.czech_regions IS 'Číselník 14 krajů České republiky.';
COMMENT ON TABLE public.restaurant_import_batches IS 'Dohledatelné dávky hromadných importů restaurací.';
COMMENT ON COLUMN public.restaurants.region_code IS 'Kód kraje NUTS 3, například CZ072.';
COMMENT ON COLUMN public.restaurants.district_code IS 'Kód okresu nebo správní jednotky z RÚIAN.';
COMMENT ON COLUMN public.restaurants.municipality_code IS 'Kód obce z RÚIAN.';
COMMENT ON COLUMN public.restaurants.source_external_id IS 'Stabilní identifikátor záznamu ve zdrojové databázi.';
COMMENT ON COLUMN public.restaurants.quality_score IS 'Automatické skóre úplnosti záznamu od 0 do 100.';

COMMIT;

-- Kontrola po spuštění:
-- SELECT * FROM public.czech_regions ORDER BY sort_order;
-- SELECT verification_status, count(*) FROM public.restaurants GROUP BY verification_status;
-- SELECT * FROM public.restaurant_coverage WHERE total_restaurants > 0;
