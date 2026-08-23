-- GURMAO.cz — conservative database indexes
--
-- This file intentionally contains indexes only. The previous version created
-- materialized views and RPC functions that mixed restaurant slugs with UUID
-- foreign keys and could become publicly callable through the Data API.
--
-- Prefer converting reviewed changes into a Supabase CLI migration before
-- production use. Run EXPLAIN (ANALYZE, BUFFERS) against real queries first.

-- Public restaurant directory: pagination, filters and ranking.
CREATE INDEX IF NOT EXISTS idx_restaurants_slug
  ON public.restaurants (slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_restaurants_city
  ON public.restaurants (city)
  WHERE city IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_restaurants_vibe
  ON public.restaurants (vibe)
  WHERE vibe IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_restaurants_tag
  ON public.restaurants (tag)
  WHERE tag IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_restaurants_created_at_desc
  ON public.restaurants (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_restaurants_google_ranking
  ON public.restaurants (google_rating DESC NULLS LAST, google_review_count DESC NULLS LAST)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_restaurants_city_vibe_rating
  ON public.restaurants (city, vibe, google_rating DESC NULLS LAST)
  WHERE slug IS NOT NULL;

-- Map/nearby mode still computes distance in the browser, but this partial index
-- helps the database discard rows without coordinates before transferring data.
CREATE INDEX IF NOT EXISTS idx_restaurants_coordinates_present
  ON public.restaurants (id)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Per-user saved restaurants.
CREATE INDEX IF NOT EXISTS idx_saved_restaurants_user_created
  ON public.saved_restaurants (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_restaurants_restaurant
  ON public.saved_restaurants (restaurant_id);

-- Numeric ratings and text reviews are separate data models.
CREATE INDEX IF NOT EXISTS idx_ratings_restaurant
  ON public.ratings (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_ratings_user
  ON public.ratings (user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_created
  ON public.reviews (restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_user
  ON public.reviews (user_id);

-- Today's menu lookup on cards and restaurant detail.
CREATE INDEX IF NOT EXISTS idx_daily_menus_restaurant_date
  ON public.daily_menus (restaurant_id, menu_date DESC);

-- Admin inbox and anti-spam lookup for contact messages.
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created
  ON public.contact_messages (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_messages_email_created
  ON public.contact_messages (email, created_at DESC);

-- No SECURITY DEFINER functions, public RPCs, materialized views, VACUUM or
-- REINDEX are created here. Operational maintenance belongs in an explicit,
-- reviewed maintenance process rather than a copy/paste optimization script.
