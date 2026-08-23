-- GURMAO security hardening
-- Apply to the production Supabase project after reviewing current schema state.
-- Admin authorization uses server-controlled app_metadata.role = 'admin'.

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can read contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can update contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Only admins can read contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Only admins can update contact messages" ON public.contact_messages;

-- Public clients never write contact messages directly. The submit-contact Edge Function
-- validates requests and inserts with the service role.
REVOKE INSERT, DELETE ON public.contact_messages FROM anon, authenticated;
GRANT SELECT, UPDATE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

CREATE POLICY "Only admins can read contact messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Only admins can update contact messages"
  ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- The previous public SECURITY DEFINER helper is no longer needed.
DROP FUNCTION IF EXISTS public.is_admin();
