-- GURMAO.cz - automatické návrhy obsahu pro importované restaurace
-- Spusťte po czech-import-pipeline.sql a czech-import-review.sql.

BEGIN;

ALTER TABLE public.restaurant_import_candidates
  ADD COLUMN IF NOT EXISTS suggested_vibe text,
  ADD COLUMN IF NOT EXISTS suggested_description text,
  ADD COLUMN IF NOT EXISTS suggested_image_url text,
  ADD COLUMN IF NOT EXISTS suggestions_generated_at timestamptz;

COMMENT ON COLUMN public.restaurant_import_candidates.suggested_vibe IS
  'Automaticky navržená atmosféra Gurmao; před zveřejněním ji kontroluje administrátor.';
COMMENT ON COLUMN public.restaurant_import_candidates.suggested_description IS
  'Faktický návrh krátkého popisu z importovaných údajů.';
COMMENT ON COLUMN public.restaurant_import_candidates.suggested_image_url IS
  'Návrh obrázku pouze z metadat oficiálního webu restaurace.';
COMMENT ON COLUMN public.restaurant_import_candidates.suggestions_generated_at IS
  'Čas posledního vytvoření automatických návrhů.';

COMMIT;
