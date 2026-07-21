-- GURMAO.cz - bezpečná ruční úprava údajů importního kandidáta
-- Spusťte po czech-import-review.sql.

BEGIN;

CREATE OR REPLACE FUNCTION public.update_restaurant_import_candidate(
  p_candidate_id uuid,
  p_name text,
  p_category_label text,
  p_city text,
  p_address text,
  p_postal_code text,
  p_phone text,
  p_website text,
  p_latitude numeric,
  p_longitude numeric
)
RETURNS public.restaurant_import_candidates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_candidate public.restaurant_import_candidates;
  v_name text := NULLIF(btrim(p_name), '');
  v_city text := NULLIF(btrim(p_city), '');
  v_slug_base text;
  v_slug_suffix text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Tuto akci smí provést pouze administrátor.';
  END IF;

  IF v_name IS NULL OR char_length(v_name) > 160 THEN
    RAISE EXCEPTION 'Název restaurace je povinný a může mít nejvýše 160 znaků.';
  END IF;
  IF v_city IS NULL OR char_length(v_city) > 120 THEN
    RAISE EXCEPTION 'Město je povinné a může mít nejvýše 120 znaků.';
  END IF;
  IF char_length(COALESCE(p_category_label, '')) > 120 OR
     char_length(COALESCE(p_address, '')) > 500 OR
     char_length(COALESCE(p_postal_code, '')) > 20 OR
     char_length(COALESCE(p_phone, '')) > 80 OR
     char_length(COALESCE(p_website, '')) > 1000 THEN
    RAISE EXCEPTION 'Některý upravovaný údaj překračuje povolenou délku.';
  END IF;
  IF (p_latitude IS NULL) <> (p_longitude IS NULL) THEN
    RAISE EXCEPTION 'Vyplňte obě souřadnice, nebo obě nechte prázdné.';
  END IF;
  IF p_latitude IS NOT NULL AND
     (p_latitude NOT BETWEEN -90 AND 90 OR p_longitude NOT BETWEEN -180 AND 180) THEN
    RAISE EXCEPTION 'Souřadnice jsou mimo povolený rozsah.';
  END IF;
  IF NULLIF(btrim(p_website), '') IS NOT NULL AND
     btrim(p_website) !~* '^https?://[^[:space:]]+$' THEN
    RAISE EXCEPTION 'Web musí začínat http:// nebo https://.';
  END IF;

  SELECT *
  INTO v_candidate
  FROM public.restaurant_import_candidates
  WHERE id = p_candidate_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kandidát neexistuje.';
  END IF;
  IF v_candidate.candidate_status IN ('imported', 'already_imported') THEN
    RAISE EXCEPTION 'Již zveřejněného kandidáta upravte v běžné správě restaurací.';
  END IF;

  v_slug_base := lower(translate(
    v_name || '-' || v_city,
    'áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ',
    'acdeeinorstuuyzACDEEINORSTUUYZ'
  ));
  v_slug_base := trim(both '-' FROM regexp_replace(v_slug_base, '[^a-z0-9]+', '-', 'g'));
  v_slug_suffix := left(replace(v_candidate.source_external_id, '-', ''), 10);

  UPDATE public.restaurant_import_candidates
  SET
    name = v_name,
    category_label = NULLIF(btrim(p_category_label), ''),
    city = v_city,
    address = NULLIF(btrim(p_address), ''),
    postal_code = NULLIF(btrim(p_postal_code), ''),
    phone = NULLIF(btrim(p_phone), ''),
    website = NULLIF(btrim(p_website), ''),
    latitude = p_latitude,
    longitude = p_longitude,
    proposed_slug = left(v_slug_base, 150) || '-' || v_slug_suffix,
    candidate_status = CASE
      WHEN candidate_status IN ('approved', 'rejected', 'invalid') THEN 'new'
      ELSE candidate_status
    END,
    review_notes = CASE
      WHEN candidate_status IN ('approved', 'rejected', 'invalid')
        THEN concat_ws(E'\n', NULLIF(review_notes, ''), 'Údaje ručně upraveny; vyžaduje nové schválení.')
      ELSE review_notes
    END
  WHERE id = p_candidate_id
  RETURNING * INTO v_candidate;

  RETURN v_candidate;
END;
$$;

REVOKE ALL ON FUNCTION public.update_restaurant_import_candidate(
  uuid, text, text, text, text, text, text, text, numeric, numeric
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_restaurant_import_candidate(
  uuid, text, text, text, text, text, text, text, numeric, numeric
) TO authenticated;

COMMENT ON FUNCTION public.update_restaurant_import_candidate(
  uuid, text, text, text, text, text, text, text, numeric, numeric
) IS 'Administrátorská oprava údajů kandidáta před zveřejněním.';

COMMIT;
