-- GURMAO.cz - bezpečná čekárna pro kandidáty kuchařů z oficiálních webů
-- Spusťte jednou v produkčním Supabase SQL Editoru.

BEGIN;

CREATE TABLE IF NOT EXISTS public.chef_import_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  normalized_name text NOT NULL,
  name text NOT NULL,
  proposed_slug text NOT NULL,
  source_url text NOT NULL,
  bio text,
  vibe text,
  signature_style text,
  image_url text,
  instagram_url text,
  tiktok_url text,
  facebook_url text,
  youtube_url text,
  confidence numeric(4,3),
  evidence text,
  candidate_status text NOT NULL DEFAULT 'new',
  duplicate_chef_id uuid REFERENCES public.chefs(id) ON DELETE SET NULL,
  published_chef_id uuid REFERENCES public.chefs(id) ON DELETE SET NULL,
  review_notes text,
  raw_source jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chef_import_candidates_source_unique UNIQUE (restaurant_id, normalized_name, source_url),
  CONSTRAINT chef_import_candidates_status_check CHECK (
    candidate_status IN ('new', 'probable_duplicate', 'approved', 'rejected', 'imported', 'invalid')
  ),
  CONSTRAINT chef_import_candidates_confidence_check CHECK (
    confidence IS NULL OR (confidence >= 0 AND confidence <= 1)
  )
);

CREATE INDEX IF NOT EXISTS chef_import_candidates_review_idx
  ON public.chef_import_candidates(candidate_status, confidence DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS chef_import_candidates_restaurant_idx
  ON public.chef_import_candidates(restaurant_id);
CREATE INDEX IF NOT EXISTS chef_import_candidates_duplicate_idx
  ON public.chef_import_candidates(duplicate_chef_id)
  WHERE duplicate_chef_id IS NOT NULL;

DROP TRIGGER IF EXISTS chef_import_candidates_touch ON public.chef_import_candidates;
CREATE TRIGGER chef_import_candidates_touch
  BEFORE UPDATE ON public.chef_import_candidates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.chef_import_candidates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chef_import_candidates FROM anon, authenticated;
GRANT ALL ON public.chef_import_candidates TO service_role;
GRANT SELECT ON public.chef_import_candidates TO authenticated;

DROP POLICY IF EXISTS "Only admins can read chef import candidates"
  ON public.chef_import_candidates;
CREATE POLICY "Only admins can read chef import candidates"
  ON public.chef_import_candidates
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.review_chef_import_candidate(
  p_candidate_id uuid,
  p_status text,
  p_notes text DEFAULT NULL
)
RETURNS public.chef_import_candidates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_candidate public.chef_import_candidates;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Tuto akci smí provést pouze administrátor.';
  END IF;
  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Povolený stav je pouze approved nebo rejected.';
  END IF;

  UPDATE public.chef_import_candidates
  SET candidate_status = p_status,
      review_notes = COALESCE(NULLIF(btrim(p_notes), ''), review_notes),
      reviewed_at = now(),
      reviewed_by = auth.uid()
  WHERE id = p_candidate_id
    AND candidate_status <> 'imported'
  RETURNING * INTO v_candidate;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kandidát neexistuje nebo už byl zveřejněn.';
  END IF;
  RETURN v_candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_chef_import_candidate(
  p_candidate_id uuid,
  p_name text,
  p_bio text DEFAULT NULL,
  p_vibe text DEFAULT NULL,
  p_signature_style text DEFAULT NULL,
  p_image_url text DEFAULT NULL,
  p_instagram_url text DEFAULT NULL,
  p_tiktok_url text DEFAULT NULL,
  p_facebook_url text DEFAULT NULL,
  p_youtube_url text DEFAULT NULL
)
RETURNS public.chef_import_candidates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_candidate public.chef_import_candidates;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Tuto akci smí provést pouze administrátor.';
  END IF;
  IF NULLIF(btrim(p_name), '') IS NULL THEN
    RAISE EXCEPTION 'Jméno kuchaře je povinné.';
  END IF;

  UPDATE public.chef_import_candidates
  SET name = btrim(p_name),
      bio = NULLIF(btrim(p_bio), ''),
      vibe = NULLIF(btrim(p_vibe), ''),
      signature_style = NULLIF(btrim(p_signature_style), ''),
      image_url = NULLIF(btrim(p_image_url), ''),
      instagram_url = NULLIF(btrim(p_instagram_url), ''),
      tiktok_url = NULLIF(btrim(p_tiktok_url), ''),
      facebook_url = NULLIF(btrim(p_facebook_url), ''),
      youtube_url = NULLIF(btrim(p_youtube_url), ''),
      candidate_status = CASE WHEN candidate_status = 'approved' THEN 'new' ELSE candidate_status END,
      reviewed_at = NULL,
      reviewed_by = NULL
  WHERE id = p_candidate_id
    AND candidate_status <> 'imported'
  RETURNING * INTO v_candidate;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kandidát neexistuje nebo už byl zveřejněn.';
  END IF;
  RETURN v_candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_chef_import_candidate(
  p_candidate_id uuid,
  p_force_duplicate boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_candidate public.chef_import_candidates;
  v_chef_id uuid;
  v_slug text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Tuto akci smí provést pouze administrátor.';
  END IF;

  SELECT * INTO v_candidate
  FROM public.chef_import_candidates
  WHERE id = p_candidate_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Kandidát neexistuje.'; END IF;
  IF v_candidate.published_chef_id IS NOT NULL THEN RETURN v_candidate.published_chef_id; END IF;
  IF v_candidate.candidate_status <> 'approved' THEN
    RAISE EXCEPTION 'Kandidát musí být před zveřejněním schválen.';
  END IF;
  IF v_candidate.duplicate_chef_id IS NOT NULL AND NOT p_force_duplicate THEN
    RAISE EXCEPTION 'Kandidát má možnou duplicitu. Nejdřív ji zkontrolujte.';
  END IF;
  IF NULLIF(btrim(v_candidate.bio), '') IS NULL THEN
    RAISE EXCEPTION 'Před zveřejněním doplňte ověřené krátké bio.';
  END IF;

  v_slug := left(v_candidate.proposed_slug, 180);
  IF EXISTS (SELECT 1 FROM public.chefs WHERE slug = v_slug) THEN
    v_slug := left(v_slug, 160) || '-' || left(replace(v_candidate.id::text, '-', ''), 12);
  END IF;

  INSERT INTO public.chefs (
    name, slug, restaurant_id, vibe, signature_style, bio, image_url,
    instagram_url, tiktok_url, facebook_url, youtube_url
  ) VALUES (
    v_candidate.name, v_slug, v_candidate.restaurant_id, v_candidate.vibe,
    v_candidate.signature_style, v_candidate.bio, v_candidate.image_url,
    v_candidate.instagram_url, v_candidate.tiktok_url, v_candidate.facebook_url,
    v_candidate.youtube_url
  ) RETURNING id INTO v_chef_id;

  UPDATE public.chef_import_candidates
  SET candidate_status = 'imported',
      published_chef_id = v_chef_id,
      review_notes = 'Schváleno a zveřejněno administrátorem.',
      reviewed_at = now(),
      reviewed_by = auth.uid()
  WHERE id = v_candidate.id;

  RETURN v_chef_id;
END;
$$;

REVOKE ALL ON FUNCTION public.review_chef_import_candidate(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_chef_import_candidate(uuid, text, text, text, text, text, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_chef_import_candidate(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_chef_import_candidate(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_chef_import_candidate(uuid, text, text, text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_chef_import_candidate(uuid, boolean) TO authenticated;

COMMENT ON TABLE public.chef_import_candidates IS
  'Neveřejná administrátorská čekárna kuchařů nalezených výhradně na oficiálních webech restaurací.';

COMMIT;
