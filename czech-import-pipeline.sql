-- GURMAO.cz - neveřejná čekárna automatických importů
-- Spusťte po migraci czech-republic-database.sql.
-- Kandidáti se tímto skriptem NEPUBLIKUJÍ do tabulky restaurants.

BEGIN;

CREATE TABLE IF NOT EXISTS public.restaurant_import_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_batch_id uuid NOT NULL
    REFERENCES public.restaurant_import_batches(id) ON DELETE CASCADE,
  source_type text NOT NULL DEFAULT 'overture_places',
  source_external_id text NOT NULL,
  source_release text,
  source_url text,
  name text NOT NULL,
  proposed_slug text NOT NULL,
  category text,
  category_label text,
  region_code text NOT NULL REFERENCES public.czech_regions(code),
  district text,
  district_code text,
  municipality_code text,
  city text,
  postal_code text,
  address text,
  latitude numeric,
  longitude numeric,
  phone text,
  website text,
  confidence numeric,
  operating_status text,
  quality_score smallint NOT NULL DEFAULT 0,
  candidate_status text NOT NULL DEFAULT 'new',
  duplicate_restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE SET NULL,
  review_notes text,
  raw_source jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT restaurant_import_candidates_source_unique
    UNIQUE (source_type, source_external_id),
  CONSTRAINT restaurant_import_candidates_status_check
    CHECK (candidate_status IN (
      'new', 'probable_duplicate', 'already_imported',
      'approved', 'rejected', 'imported', 'invalid'
    )),
  CONSTRAINT restaurant_import_candidates_quality_check
    CHECK (quality_score BETWEEN 0 AND 100),
  CONSTRAINT restaurant_import_candidates_confidence_check
    CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  CONSTRAINT restaurant_import_candidates_coordinates_check
    CHECK (
      (latitude IS NULL AND longitude IS NULL) OR
      (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
    )
);

CREATE INDEX IF NOT EXISTS idx_import_candidates_batch
  ON public.restaurant_import_candidates(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_import_candidates_review_queue
  ON public.restaurant_import_candidates(region_code, candidate_status, quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_import_candidates_duplicate
  ON public.restaurant_import_candidates(duplicate_restaurant_id)
  WHERE duplicate_restaurant_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.touch_restaurant_import_candidate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restaurant_import_candidates_touch
  ON public.restaurant_import_candidates;
CREATE TRIGGER restaurant_import_candidates_touch
  BEFORE UPDATE ON public.restaurant_import_candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_restaurant_import_candidate();

ALTER TABLE public.restaurant_import_candidates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.restaurant_import_candidates FROM anon, authenticated;
GRANT ALL ON public.restaurant_import_candidates TO service_role;

COMMENT ON TABLE public.restaurant_import_candidates IS
  'Neveřejná čekárna restaurací z automatických importů před ruční kontrolou.';
COMMENT ON COLUMN public.restaurant_import_candidates.raw_source IS
  'Původní Overture feature pro dohledání a opakovanou kontrolu.';
COMMENT ON COLUMN public.restaurant_import_candidates.duplicate_restaurant_id IS
  'Existující restaurace, se kterou se kandidát pravděpodobně překrývá.';

COMMIT;

-- Kontrola po spuštění:
-- SELECT candidate_status, count(*)
-- FROM public.restaurant_import_candidates
-- GROUP BY candidate_status;
