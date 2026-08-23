from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')
original = text

# Retired project must never receive a browser preconnect.
text = text.replace(
    '<link rel="preconnect" href="https://txfuxrezyrgybjvjnhom.supabase.co">',
    '<link rel="preconnect" href="https://jdprdcnxbxfzgrjjfflr.supabase.co">'
)

# The real count is populated from Supabase. Do not publish a stale hardcoded number.
text = text.replace(
    '<div class="hero-count">Prohledáváme <strong>2 480</strong> restaurací po celé ČR</div>',
    '<div class="hero-count">Prohledáváme <strong aria-live="polite">…</strong> restaurací po celé ČR</div>'
)

# app.js owns global header search loading. Loading these modules directly again causes
# duplicate module fetch/initialization paths even though the search runtime has a guard.
text = text.replace('<script src="app.js?v=20260726-unified-search-4"></script>', '<script src="app.js?v=20260823-shared-4"></script>')
text = re.sub(r'\n?<script type="module" src="header-search\.js\?v=[^"]+"></script>', '', text)
text = re.sub(r'\n?<script type="module" src="location-search\.js"></script>', '', text)

# The former mobileSearchBox opener had no data search logic anymore. header-search.js
# now owns both headerSearchToggle and mobileSearchBtn, so remove the obsolete block.
text = re.sub(
    r'\n<script>\s*// Mobile Search Toggle[\s\S]*?</script>\s*\n\s*<script src="footer-legal-toggle\.js"></script>',
    '\n<script src="footer-legal-toggle.js"></script>',
    text,
    count=1
)

# auth-redirect.js imports the shared Supabase client, so a second direct module tag is
# redundant. The old onboarding runtime is a no-op and should not ship on the homepage.
text = re.sub(r'\n?<script type="module" src="supabase-client\.js"></script>', '', text)
text = re.sub(r'\n?<script src="onboarding\.js"></script>', '', text)

# Homepage account CTA must be driven by verified Supabase auth in homepage-runtime.js,
# never by a forgeable/stale localStorage compatibility marker.
text = re.sub(
    r'\n<script>\s*// Homepage: Change CTA for logged-in users[\s\S]*?</script>',
    '',
    text,
    count=1
)

for forbidden in (
    'txfuxrezyrgybjvjnhom.supabase.co',
    'src="header-search.js?v=20260726-unified-4"',
    'src="location-search.js"',
    '// Mobile Search Toggle',
    'src="onboarding.js"',
    '// Homepage: Change CTA for logged-in users',
    'type="module" src="supabase-client.js"'
):
    if forbidden in text:
        raise SystemExit(f'Homepage normalization failed, legacy marker remains: {forbidden}')

if '<script src="app.js?v=20260823-shared-4"></script>' not in text:
    raise SystemExit('Current app.js runtime reference was not established.')
if '<script type="module" src="auth-redirect.js"></script>' not in text:
    raise SystemExit('Homepage auth/page runtime router is missing.')
if 'https://jdprdcnxbxfzgrjjfflr.supabase.co' not in text:
    raise SystemExit('Current Supabase preconnect was not established.')

if text != original:
    path.write_text(text, encoding='utf-8')
    print('index.html normalized')
else:
    print('index.html already normalized')
