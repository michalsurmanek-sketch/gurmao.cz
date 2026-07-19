-- Přístup ke zprávám podle serverem spravované role v app_metadata.

-- Nejdřív smaž existující policies
DROP POLICY IF EXISTS "Authenticated users can read contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Authenticated users can update contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Only admins can read contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Only admins can update contact messages" ON contact_messages;

-- Vytvoř nové policies jen pro adminy
CREATE POLICY "Only admins can read contact messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Only admins can update contact messages"
  ON contact_messages
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
