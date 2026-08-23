-- GURMAO contact messages schema
-- Public submissions go through the submit-contact Edge Function using service_role.

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  email TEXT NOT NULL CHECK (char_length(email) <= 254),
  subject TEXT NOT NULL CHECK (subject IN ('obecne', 'restaurace', 'spoluprace', 'gdpr', 'jine')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 5000),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email_created_at ON public.contact_messages(email, created_at DESC);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can read contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can update contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Only admins can read contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Only admins can update contact messages" ON public.contact_messages;

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

CREATE OR REPLACE FUNCTION public.update_contact_messages_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_contact_messages_updated_at ON public.contact_messages;
CREATE TRIGGER trigger_update_contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contact_messages_updated_at();

COMMENT ON TABLE public.contact_messages IS 'Kontaktní zprávy přijaté přes chráněnou Edge Function.';
COMMENT ON COLUMN public.contact_messages.status IS 'Status zprávy: new, read, replied, archived';