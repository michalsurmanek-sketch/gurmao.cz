import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const ACTIVE_FILES = [
  'supabase-client.js',
  'app.js',
  'auth-guard.js',
  'login-page.js',
  'header-search.js',
  'restaurace.js',
  'feed-page.js',
  'mapa.js',
  'ai-recommendations.js',
  'collections-page.js',
  'restaurant-detail-page.js',
  'profile-page.js',
  'contact-form-runtime.js',
  'feed.html',
  'kontakt.html',
  'collections.html',
  'profile.html',
  'restaurant.html'
];

async function text(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

async function missing(path) {
  try {
    await access(new URL(`../${path}`, import.meta.url));
    return false;
  } catch {
    return true;
  }
}

test('active public runtime uses only canonical restaurant detail route', async () => {
  for (const file of ACTIVE_FILES) {
    const source = await text(file);
    assert.equal(source.includes('restaurace-detail.html'), false, `${file} still links to restaurace-detail.html`);
    assert.equal(/restaurace-\$\{[^}]+\}\.html/.test(source), false, `${file} still constructs legacy restaurace-<slug>.html`);
  }
});

test('guest collections stay available without authentication redirect', async () => {
  const guard = await text('auth-guard.js');
  const page = await text('collections-page.js');
  assert.match(guard, /page\s*===\s*['"]collections\.html['"]\)\s*return/, 'collections auth guard must allow guest mode');
  assert.match(page, /window\.GurmaoCollections/, 'collections page must use the shared saved-state runtime');
  assert.match(page, /fetchRestaurantsBySlugs/, 'guest collections must resolve locally saved slugs to restaurant data');
  assert.equal(page.includes('unsaveRestaurant'), false, 'collections page must not bypass shared guest/cloud remove logic');
  assert.equal(page.includes('saveRestaurant'), false, 'collections page must not bypass shared guest/cloud restore logic');
});

test('saved-state bootstrap only joins the restaurant slug', async () => {
  const client = await text('supabase-client.js');
  assert.match(client, /restaurants\(slug\)/, 'saved restaurant lookup should fetch only slug relation data');
  assert.equal(client.includes('restaurants(*)'), false, 'saved-state bootstrap must not fetch complete restaurant rows');
});

test('login return destinations are same-origin and role checked', async () => {
  const login = await text('login-page.js');
  const toast = await text('toast.js');
  assert.match(login, /url\.origin\s*!==\s*location\.origin/, 'login return URL must be same-origin');
  assert.match(login, /app_metadata\?\.role\s*!==\s*['"]admin['"]/, 'admin return URL must require admin app_metadata');
  assert.match(login, /localStorage\.removeItem\(['"]gurmao_return_url['"]\)/, 'stored return URL must be consumed');
  assert.match(login, /signInWithOAuth/, 'Google login must use the maintained safe callback path');
  assert.match(login, /redirectTo:\s*callback\.href/, 'Google OAuth must return through login callback');
  assert.match(toast, /localStorage\.removeItem\(['"]gurmao_user['"]\)/, 'login bootstrap must not trust compatibility localStorage as authentication');
});

test('nearest restaurant search uses bounded geographic windows', async () => {
  const source = await text('restaurace.js');
  const start = source.indexOf('async function fetchNearestRows()');
  const end = source.indexOf('\nasync function loadResults', start);
  assert.ok(start >= 0 && end > start, 'fetchNearestRows function must exist');
  const nearest = source.slice(start, end);
  assert.match(nearest, /\.gte\(['"]latitude['"]/, 'nearest query must have latitude lower bound');
  assert.match(nearest, /\.lte\(['"]latitude['"]/, 'nearest query must have latitude upper bound');
  assert.match(nearest, /\.gte\(['"]longitude['"]/, 'nearest query must have longitude lower bound');
  assert.match(nearest, /\.lte\(['"]longitude['"]/, 'nearest query must have longitude upper bound');
  assert.match(nearest, /targetCandidates/, 'nearest query must stop after a bounded candidate target');
  assert.equal(nearest.includes('batchSize = 500'), false, 'nearest query must not page through the entire restaurant table');
});

test('contact page has one protected submission path', async () => {
  const page = await text('kontakt.html');
  const runtime = await text('contact-form-runtime.js');
  const client = await text('supabase-client.js');
  assert.equal(page.includes('submitContactMessage'), false, 'kontakt.html must not submit directly to contact_messages');
  assert.equal(page.includes("from './supabase-client.js'"), false, 'kontakt.html must not contain an inline Supabase form handler');
  assert.match(runtime, /functions\.invoke\(['"]submit-contact['"]/, 'contact runtime must invoke submit-contact Edge Function');
  assert.match(client, /functions\.invoke\(['"]submit-contact['"]/, 'compatibility contact helper must use submit-contact Edge Function');
  assert.equal(/from\(['"]contact_messages['"]\)[\s\S]{0,120}\.insert\(/.test(client), false, 'browser client must not insert contact_messages directly');
});

test('contact form subjects are accepted by the Edge Function', async () => {
  const page = await text('kontakt.html');
  const edge = await text('supabase/functions/submit-contact/index.ts');
  const values = [...page.matchAll(/<option\s+value="([^"]+)"/g)].map(match => match[1]).filter(Boolean);
  assert.ok(values.length >= 3, 'expected contact subject options');
  for (const value of values) assert.ok(edge.includes(`['${value}',`), `submit-contact does not map subject: ${value}`);
});

test('Edge Function JWT policy is explicit', async () => {
  const config = await text('supabase/config.toml');
  const expected = new Map([
    ['submit-contact', 'false'],
    ['google-place-photo', 'false'],
    ['delete-account', 'true'],
    ['discover-menu', 'true'],
    ['sync-opening-hours', 'true']
  ]);
  for (const [name, value] of expected) {
    const pattern = new RegExp(`\\[functions\\.${name.replaceAll('-', '\\-')}\\][\\s\\S]*?verify_jwt\\s*=\\s*${value}(?:\\s|$)`);
    assert.match(config, pattern, `${name} must declare verify_jwt = ${value}`);
  }
});

test('admin Edge Functions enforce app_metadata admin role', async () => {
  for (const file of ['supabase/functions/discover-menu/index.ts','supabase/functions/sync-opening-hours/index.ts']) {
    const source = await text(file);
    assert.match(source, /app_metadata\?\.role\s*!==\s*['"]admin['"]/, `${file} must fail closed for non-admin users`);
    assert.match(source, /auth\.getUser\(\)/, `${file} must verify the authenticated user`);
  }
});

test('public Google photo proxy only serves stored restaurant photo IDs', async () => {
  const source = await text('supabase/functions/google-place-photo/index.ts');
  assert.match(source, /from\(['"]restaurants['"]\)/);
  assert.match(source, /eq\(['"]google_photo_name['"],\s*name\)/);
  assert.match(source, /GOOGLE_PLACES_API_KEY/);
});

test('removed runtime patch layers stay removed', async () => {
  const removed = [
    'runtime-guard.js',
    'hide-price-level.js',
    'restaurant-card-status.js',
    'restaurant-card-actions.js',
    'restaurace-detail.js',
    'rating.js',
    'map-footer-search.js',
    'footer-search.js',
    'daily-menu-ui.js',
    'restaurace-redirect.js',
    'supabase-edge-function-example.ts'
  ];
  for (const file of removed) assert.equal(await missing(file), true, `${file} must not be restored`);
});

test('service worker does not inject deleted runtime patches', async () => {
  const source = await text('service-worker.js');
  for (const name of ['runtime-guard.js','hide-price-level.js','restaurant-card-status.js','restaurant-card-actions.js']) {
    assert.equal(source.includes(name), false, `service worker still references ${name}`);
  }
});

test('shared runtime never monkey-patches Element.innerHTML', async () => {
  const source = await text('app.js');
  assert.equal(source.includes("Object.defineProperty(Element.prototype, 'innerHTML'"), false);
  assert.equal(source.includes('Object.defineProperty(Element.prototype, "innerHTML"'), false);
});

test('active public runtime does not contain the retired Supabase project', async () => {
  for (const file of ACTIVE_FILES) {
    const source = await text(file);
    assert.equal(source.includes('txfuxrezyrgybjvjnhom'), false, `${file} contains retired Supabase project ref`);
  }
});
