-- GURMAO.cz - bod 3: bezpečná kontrola a zveřejnění importních kandidátů
-- Spusťte po czech-republic-database.sql a czech-import-pipeline.sql.

BEGIN;

-- Kandidáty a importní dávky smí číst pouze administrátor.
GRANT SELECT ON public.restaurant_import_candidates TO authenticated;
GRANT SELECT ON public.restaurant_import_batches TO authenticated;

DROP POLICY IF EXISTS "Only admins can read import candidates"
  ON public.restaurant_import_candidates;
CREATE POLICY "Only admins can read import candidates"
  ON public.restaurant_import_candidates
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can read import batches"
  ON public.restaurant_import_batches;
CREATE POLICY "Only admins can read import batches"
  ON public.restaurant_import_batches
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Schválení nebo odmítnutí kandidáta bez možnosti měnit zdrojová data.
CREATE OR REPLACE FUNCTION public.review_restaurant_import_candidate(
  p_candidate_id uuid,
  p_status text,
  p_notes text DEFAULT NULL
)
RETURNS public.restaurant_import_candidates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_candidate public.restaurant_import_candidates;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Tuto akci smí provést pouze administrátor.';
  END IF;

  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Povolený stav je pouze approved nebo rejected.';
  END IF;

  UPDATE public.restaurant_import_candidates
  SET
    candidate_status = p_status,
    review_notes = COALESCE(NULLIF(btrim(p_notes), ''), review_notes)
  WHERE id = p_candidate_id
    AND candidate_status NOT IN ('imported', 'already_imported')
  RETURNING * INTO v_candidate;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kandidát neexistuje nebo už byl importován.';
  END IF;

  RETURN v_candidate;
END;
$$;

-- Jediná cesta z čekárny do veřejné tabulky restaurants.
CREATE OR REPLACE FUNCTION public.publish_restaurant_import_candidate(
  p_candidate_id uuid,
  p_vibe text,
  p_description text,
  p_image_url text DEFAULT NULL,
  p_force_duplicate boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_candidate public.restaurant_import_candidates;
  v_restaurant_id uuid;
  v_slug text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Tuto akci smí provést pouze administrátor.';
  END IF;

  IF p_vibe NOT IN ('🍷 LUXE', '🔥 DRAMA', '🌮 CHAOS', '🌿 PURE', '🖤 DARK', '🌊 CALM') THEN
    RAISE EXCEPTION 'Vyberte jednu z podporovaných atmosfér Gurmao.';
  END IF;

  IF NULLIF(btrim(p_description), '') IS NULL THEN
    RAISE EXCEPTION 'Před zveřejněním doplňte krátký popis restaurace.';
  END IF;

  SELECT *
  INTO v_candidate
  FROM public.restaurant_import_candidates
  WHERE id = p_candidate_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kandidát neexistuje.';
  END IF;

  -- Opakované zavolání nevytvoří druhou restauraci.
  SELECT id
  INTO v_restaurant_id
  FROM public.restaurants
  WHERE source_type = v_candidate.source_type
    AND source_external_id = v_candidate.source_external_id
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.restaurant_import_candidates
    SET
      candidate_status = 'imported',
      duplicate_restaurant_id = v_restaurant_id,
      review_notes = 'Zdrojový záznam už byl zveřejněn.'
    WHERE id = v_candidate.id;
    RETURN v_restaurant_id;
  END IF;

  IF v_candidate.candidate_status <> 'approved' THEN
    RAISE EXCEPTION 'Kandidát musí být před zveřejněním schválen.';
  END IF;

  IF v_candidate.city IS NULL OR btrim(v_candidate.city) = '' THEN
    RAISE EXCEPTION 'Kandidát nemá vyplněné město.';
  END IF;

  IF v_candidate.duplicate_restaurant_id IS NOT NULL AND NOT p_force_duplicate THEN
    RAISE EXCEPTION 'Kandidát má možnou duplicitu. Nejdřív ji zkontrolujte.';
  END IF;

  v_slug := left(v_candidate.proposed_slug, 180);
  IF EXISTS (SELECT 1 FROM public.restaurants WHERE slug = v_slug) THEN
    v_slug := left(v_slug, 160) || '-' ||
      left(replace(v_candidate.id::text, '-', ''), 12);
  END IF;

  INSERT INTO public.restaurants (
    slug,
    name,
    city,
    vibe,
    tag,
    description,
    latitude,
    longitude,
    image_url,
    phone,
    website,
    address,
    country_code,
    region_code,
    district,
    district_code,
    municipality_code,
    postal_code,
    source_type,
    source_external_id,
    source_url,
    import_batch_id,
    verification_status,
    verified_at,
    last_checked_at
  ) VALUES (
    v_slug,
    v_candidate.name,
    v_candidate.city,
    p_vibe,
    COALESCE(v_candidate.category_label, v_candidate.category, 'restaurace'),
    btrim(p_description),
    v_candidate.latitude,
    v_candidate.longitude,
    NULLIF(btrim(p_image_url), ''),
    v_candidate.phone,
    v_candidate.website,
    v_candidate.address,
    'CZ',
    v_candidate.region_code,
    v_candidate.district,
    v_candidate.district_code,
    v_candidate.municipality_code,
    v_candidate.postal_code,
    v_candidate.source_type,
    v_candidate.source_external_id,
    v_candidate.source_url,
    v_candidate.import_batch_id,
    'ready',
    now(),
    now()
  )
  RETURNING id INTO v_restaurant_id;

  UPDATE public.restaurant_import_candidates
  SET
    candidate_status = 'imported',
    duplicate_restaurant_id = v_restaurant_id,
    review_notes = 'Schváleno a zveřejněno administrátorem.'
  WHERE id = v_candidate.id;

  RETURN v_restaurant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.review_restaurant_import_candidate(uuid, text, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_restaurant_import_candidate(uuid, text, text, text, boolean)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_restaurant_import_candidate(uuid, text, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_restaurant_import_candidate(uuid, text, text, text, boolean)
  TO authenticated;

COMMENT ON FUNCTION public.review_restaurant_import_candidate(uuid, text, text) IS
  'Administrátorské schválení nebo odmítnutí kandidáta bez změny zdrojových dat.';
COMMENT ON FUNCTION public.publish_restaurant_import_candidate(uuid, text, text, text, boolean) IS
  'Kontrolované zveřejnění schváleného kandidáta do restaurants.';

COMMIT;

-- Kontrola po spuštění:
-- SELECT candidate_status, count(*)
-- FROM public.restaurant_import_candidates
-- GROUP BY candidate_status;
