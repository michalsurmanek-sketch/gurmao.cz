-- GURMAO numeric rating schema.
-- Source-of-truth shape used by supabase-client.js and rating.js.
-- Text reviews belong in public.reviews, not in this table.
-- For an existing production table, use a reviewed migration instead of running this file blindly.

CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  stars SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_restaurant_id ON public.ratings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON public.ratings(user_id);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read ratings" ON public.ratings;
DROP POLICY IF EXISTS "Authenticated users can insert ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can delete own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can read own ratings" ON public.ratings;

-- Individual user-rating rows are private. Public consumers use rating_stats below.
REVOKE ALL ON public.ratings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;

CREATE POLICY "Users can read own ratings"
  ON public.ratings
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Authenticated users can insert ratings"
  ON public.ratings
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own ratings"
  ON public.ratings
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own ratings"
  ON public.ratings
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.update_ratings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_ratings_updated_at ON public.ratings;
CREATE TRIGGER trigger_update_ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ratings_updated_at();

-- Aggregate-only public surface. It exposes no user_id values.
CREATE OR REPLACE VIEW public.rating_stats AS
SELECT
  restaurant_id,
  COUNT(*)::BIGINT AS rating_count,
  ROUND(AVG(stars)::NUMERIC, 1) AS average_rating,
  COUNT(*) FILTER (WHERE stars = 5)::BIGINT AS five_stars,
  COUNT(*) FILTER (WHERE stars = 4)::BIGINT AS four_stars,
  COUNT(*) FILTER (WHERE stars = 3)::BIGINT AS three_stars,
  COUNT(*) FILTER (WHERE stars = 2)::BIGINT AS two_stars,
  COUNT(*) FILTER (WHERE stars = 1)::BIGINT AS one_star
FROM public.ratings
GROUP BY restaurant_id;

REVOKE ALL ON public.rating_stats FROM PUBLIC;
GRANT SELECT ON public.rating_stats TO anon, authenticated;

COMMENT ON TABLE public.ratings IS 'Soukromé číselné hodnocení uživatele pro restauraci (1–5).';
COMMENT ON COLUMN public.ratings.stars IS 'Počet hvězdiček 1–5.';
COMMENT ON VIEW public.rating_stats IS 'Veřejné agregované statistiky bez identifikátoru uživatele.';
