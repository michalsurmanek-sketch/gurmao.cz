# Admin role – aktuální postup

Historický obsah tohoto souboru byl odstraněn, protože obsahoval konkrétní účet a starý jednorázový setup.

Aktuální pravidla jsou v `ADMIN_SETUP.md`:

- admin role pouze v serverových `app_metadata`,
- cílového uživatele identifikovat podle jeho Auth UUID v právě připojeném Gurmao projektu,
- frontend i Edge Functions kontrolují `user.app_metadata.role === 'admin'`,
- skutečná oprávnění musí vynucovat také RLS/backend,
- žádný hardcoded osobní e-mail, `user_metadata` ani `localStorage` nesmí udělovat admin práva.

Před změnou produkční role vždy ověř správný Supabase projekt a po změně nechej uživatele získat nový access token.
