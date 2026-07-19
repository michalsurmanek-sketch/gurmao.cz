-- GURMAO security migration
-- Run once in Supabase Dashboard -> SQL Editor, then log out and back in.

-- Admin authorization belongs in server-controlled app_metadata.
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE email = 'michalsurmanek@seznam.cz';

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can update contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Only admins can read contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Only admins can update contact messages" ON public.contact_messages;

CREATE POLICY "Only admins can read contact messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Only admins can update contact messages"
  ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
