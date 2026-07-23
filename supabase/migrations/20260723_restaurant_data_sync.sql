-- GURMAO: metadata pro automatickou synchronizaci provozních údajů restaurací
alter table public.restaurants
  add column if not exists data_auto_enabled boolean not null default true,
  add column if not exists data_last_checked timestamptz,
  add column if not exists data_last_updated timestamptz,
  add column if not exists data_source text,
  add column if not exists data_confidence numeric(4,3),
  add column if not exists data_sync_error text;

alter table public.restaurants
  drop constraint if exists restaurants_data_confidence_check;

alter table public.restaurants
  add constraint restaurants_data_confidence_check
  check (data_confidence is null or (data_confidence >= 0 and data_confidence <= 1));

create index if not exists restaurants_data_auto_enabled_idx
  on public.restaurants (data_auto_enabled)
  where data_auto_enabled = true;

create index if not exists restaurants_data_last_checked_idx
  on public.restaurants (data_last_checked);

comment on column public.restaurants.data_source is
  'Zdroj poslední automatické aktualizace: website, jsonld, google, osm nebo import.';
comment on column public.restaurants.data_confidence is
  'Důvěryhodnost automaticky získaných údajů v rozsahu 0 až 1.';
