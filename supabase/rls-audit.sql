-- GURMAO.cz – READ ONLY security/schema audit
-- This file contains SELECT statements only. It is intended to be run against
-- the real Gurmao Supabase project before creating or applying a baseline migration.

-- 1) RLS state and ownership for important public tables.
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls,
  pg_get_userbyid(c.relowner) AS owner
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND c.relname IN (
    'restaurants',
    'profiles',
    'saved_restaurants',
    'ratings',
    'reviews',
    'contact_messages',
    'daily_menus',
    'menu_import_queue'
  )
ORDER BY c.relname;

-- 2) All current RLS policies for the same tables.
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'restaurants',
    'profiles',
    'saved_restaurants',
    'ratings',
    'reviews',
    'contact_messages',
    'daily_menus',
    'menu_import_queue'
  )
ORDER BY tablename, cmd, policyname;

-- 3) Grants visible to browser/server roles.
SELECT
  table_schema,
  table_name,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role')
  AND table_name IN (
    'restaurants',
    'profiles',
    'saved_restaurants',
    'ratings',
    'reviews',
    'contact_messages',
    'daily_menus',
    'menu_import_queue'
  )
ORDER BY table_name, grantee, privilege_type;

-- 4) Columns and types. Use this to build a real baseline instead of guessing.
SELECT
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'restaurants',
    'profiles',
    'saved_restaurants',
    'ratings',
    'reviews',
    'contact_messages',
    'daily_menus',
    'menu_import_queue'
  )
ORDER BY table_name, ordinal_position;

-- 5) Primary keys, unique constraints, foreign keys and checks.
SELECT
  conrelid::regclass::text AS table_name,
  conname AS constraint_name,
  CASE contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'c' THEN 'CHECK'
    WHEN 'x' THEN 'EXCLUSION'
    ELSE contype::text
  END AS constraint_type,
  pg_get_constraintdef(oid, true) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conrelid::regclass::text IN (
    'restaurants',
    'profiles',
    'saved_restaurants',
    'ratings',
    'reviews',
    'contact_messages',
    'daily_menus',
    'menu_import_queue'
  )
ORDER BY table_name, constraint_type, constraint_name;

-- 6) Public functions and SECURITY DEFINER review.
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS security_definer,
  p.proconfig AS runtime_config,
  pg_get_userbyid(p.proowner) AS owner
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY p.proname, arguments;

-- 7) Views and their owners. Review any view that exposes user data.
SELECT
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- 8) Storage bucket visibility. Review separately from table RLS.
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
ORDER BY id;

-- Expected security contract after the audit:
-- * restaurants: public SELECT is expected; browser writes are not.
-- * profiles: user reads/updates only own profile; no broad public email exposure.
-- * saved_restaurants: user SELECT/INSERT/DELETE only where user_id = auth.uid().
-- * ratings/reviews: public read only if intentionally exposed; writes only by owner.
-- * contact_messages: no anon/authenticated INSERT; Edge Function writes with service_role.
-- * admin authorization: auth.jwt()->'app_metadata'->>'role' = 'admin'.
-- * no permissive policy may accidentally reopen a table alongside a restrictive-looking policy.
