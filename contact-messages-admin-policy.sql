-- Volitelné: Zpřísnění přístupu jen pro konkrétní admin emaily
-- Spusť POUZE pokud chceš omezit přístup ke zprávám jen pro konkrétní uživatele

-- Nejdřív smaž existující policies
DROP POLICY IF EXISTS "Authenticated users can read contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Authenticated users can update contact messages" ON contact_messages;

-- Vytvoř nové policies jen pro adminy
CREATE POLICY "Only admins can read contact messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'michal@gurmao.cz',  -- Zde přidej své admin emaily
      'info@gurmao.cz'
    )
  );

CREATE POLICY "Only admins can update contact messages"
  ON contact_messages
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'michal@gurmao.cz',
      'info@gurmao.cz'
    )
  );
