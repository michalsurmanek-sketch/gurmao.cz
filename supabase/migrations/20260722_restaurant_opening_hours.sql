-- GURMAO: strukturovaná otevírací doba restaurací
-- Spusťte v Supabase SQL Editoru nebo přes Supabase migrations.

alter table public.restaurants
  add column if not exists opening_hours jsonb not null default '{}'::jsonb,
  add column if not exists special_opening_hours jsonb not null default '[]'::jsonb,
  add column if not exists opening_hours_source text,
  add column if not exists opening_hours_verified_at timestamptz,
  add column if not exists opening_hours_verified_by uuid,
  add column if not exists google_place_id text;

comment on column public.restaurants.opening_hours is
  'Pravidelná otevírací doba. Klíče mon,tue,wed,thu,fri,sat,sun. Hodnota je text např. "11:00-14:00, 17:00-22:00"; prázdný řetězec nebo "closed" znamená zavřeno.';
comment on column public.restaurants.special_opening_hours is
  'Výjimky podle data: [{"date":"2026-12-24","closed":true},{"date":"2026-12-31","hours":"11:00-18:00"}].';
comment on column public.restaurants.opening_hours_source is
  'owner, admin, website, google, osm nebo import';

alter table public.restaurants
  drop constraint if exists restaurants_opening_hours_source_check;

alter table public.restaurants
  add constraint restaurants_opening_hours_source_check
  check (
    opening_hours_source is null or
    opening_hours_source in ('owner','admin','website','google','osm','import')
  );

create index if not exists restaurants_google_place_id_idx
  on public.restaurants (google_place_id)
  where google_place_id is not null;

create index if not exists restaurants_opening_hours_verified_at_idx
  on public.restaurants (opening_hours_verified_at);

create or replace function public.is_valid_opening_hours(value jsonb)
returns boolean
language sql
immutable
as $$
  select
    jsonb_typeof(value) = 'object'
    and not exists (
      select 1
      from jsonb_object_keys(value) as key
      where key not in ('mon','tue','wed','thu','fri','sat','sun')
    )
    and not exists (
      select 1
      from jsonb_each(value) as day(key, hours)
      where jsonb_typeof(hours) <> 'string'
         or length(hours #>> '{}') > 80
    );
$$;

alter table public.restaurants
  drop constraint if exists restaurants_opening_hours_format_check;

alter table public.restaurants
  add constraint restaurants_opening_hours_format_check
  check (public.is_valid_opening_hours(opening_hours));

-- Přístup pro veřejné čtení zůstává řízen existující RLS politikou tabulky restaurants.
-- Zápis otevírací doby má probíhat pouze přes administraci / service role.

-- Ukázkový zápis kompatibilní s kartami restaurací:
-- update public.restaurants
-- set opening_hours = '{
--   "mon":"11:00-22:00",
--   "tue":"11:00-22:00",
--   "wed":"11:00-22:00",
--   "thu":"11:00-22:00",
--   "fri":"11:00-23:00",
--   "sat":"12:00-23:00",
--   "sun":"closed"
-- }'::jsonb,
-- opening_hours_source = 'admin',
-- opening_hours_verified_at = now()
-- where slug = 'nazev-restaurace';
