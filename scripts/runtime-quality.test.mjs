import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const ACTIVE_FILES = [
  'app.js',
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

test('contact page has one protected submission path', async () => {
  const page = await text('kontakt.html');
  const runtime = await text('contact-form-runtime.js');
  assert.equal(page.includes('submitContactMessage'), false, 'kontakt.html must not submit directly to contact_messages');
  assert.equal(page.includes("from './supabase-client.js'"), false, 'kontakt.html must not contain an inline Supabase form handler');
  assert.match(runtime, /functions\.invoke\(['"]submit-contact['"]/, 'contact runtime must invoke submit-contact Edge Function');
});

test('contact form subjects are accepted by the Edge Function', async () => {
  const page = await text('kontakt.html');
  const edge = await text('supabase/functions/submit-contact/index.ts');
  const values = [...page.matchAll(/<option\s+value="([^"]+)"/g)].map(match => match[1]).filter(Boolean);
  assert.ok(values.length >= 3, 'expected contact subject options');
  for (const value of values) {
    assert.ok(edge.includes(`['${value}',`), `submit-contact does not map subject: ${value}`);
  }
});

test('removed runtime patch layers stay removed', async () => {
  const removed = [
    'runtime-guard.js',
    'hide-price-level.js',
    'restaurant-card-status.js',
    'restaurant-card-actions.js',
    'restaurace-detail.js',
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

test('active public runtime does not contain the retired Supabase project', async () => {
  for (const file of ACTIVE_FILES.filter(file => file !== 'app.js')) {
    const source = await text(file);
    assert.equal(source.includes('txfuxrezyrgybjvjnhom'), false, `${file} contains retired Supabase project ref`);
  }
});
