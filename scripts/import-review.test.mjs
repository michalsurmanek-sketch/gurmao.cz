import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [sql, html, client, admin, adminContact] = await Promise.all([
  readFile(new URL('../czech-import-review.sql', import.meta.url), 'utf8'),
  readFile(new URL('../admin-imports.html', import.meta.url), 'utf8'),
  readFile(new URL('../admin-imports.js', import.meta.url), 'utf8'),
  readFile(new URL('../admin.html', import.meta.url), 'utf8'),
  readFile(new URL('../admin-contact.html', import.meta.url), 'utf8')
]);

test('SQL funkce ověřují administrátora a nejsou veřejně spustitelné', () => {
  assert.match(sql, /SECURITY DEFINER/g);
  assert.match(sql, /IF NOT public\.is_admin\(\)/g);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.review_restaurant_import_candidate/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.publish_restaurant_import_candidate/);
  assert.match(sql, /candidate_status <> 'approved'/);
});

test('administrace používá pouze kontrolovaná RPC, ne přímý INSERT do restaurants', () => {
  assert.match(client, /rpc\('review_restaurant_import_candidate'/);
  assert.match(client, /rpc\('publish_restaurant_import_candidate'/);
  assert.doesNotMatch(client, /from\(['"]restaurants['"]\)\s*\.insert/);
  assert.match(client, /function escapeHtml/);
  assert.match(client, /function safeUrl/);
});

test('stránka je chráněná admin guardem a dostupná z obou admin navigací', () => {
  assert.match(html, /src="admin-guard\.js"/);
  assert.match(html, /meta name="robots" content="noindex,nofollow"/);
  assert.match(admin, /admin-imports\.html/);
  assert.match(adminContact, /admin-imports\.html/);
});
