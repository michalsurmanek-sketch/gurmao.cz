-- GURMAO: doplňující údaje z Google Places
alter table public.restaurants
  add column if not exists google_rating numeric(2,1),
  add column if not exists google_review_count integer,
  add column if not exists google_primary_type text,
  add column if not exists google_photo_name text,
  add column if not exists price_level text;

create index if not exists restaurants_google_rating_idx
  on public.restaurants (google_rating desc)
  where google_rating is not null;

comment on column public.restaurants.google_photo_name is
  'Google Places photo resource name. Fotografie se má načítat přes serverový proxy endpoint, ne přímým odkazem s API klíčem.';
