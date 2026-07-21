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

test('úprava kandidáta používá samostatné administrátorské RPC', async () => {
  const editSql = await readFile(new URL('../czech-import-candidate-edit.sql', import.meta.url), 'utf8');
  assert.match(editSql, /FUNCTION public\.update_restaurant_import_candidate/);
  assert.match(editSql, /SECURITY DEFINER/);
  assert.match(editSql, /IF NOT public\.is_admin\(\)/);
  assert.match(editSql, /candidate_status IN \('approved', 'rejected', 'invalid'\)/);
  assert.match(editSql, /REVOKE ALL ON FUNCTION public\.update_restaurant_import_candidate/);
  assert.match(client, /rpc\('update_restaurant_import_candidate'/);
  assert.doesNotMatch(client, /from\(['"]restaurant_import_candidates['"]\)\s*\.update/);
  assert.match(html, /data-action="edit"|id="editDialog"/);
});

test('administrace používá pouze kontrolovaná RPC, ne přímý INSERT do restaurants', () => {
  assert.match(client, /rpc\('review_restaurant_import_candidate'/);
  assert.match(client, /rpc\('publish_restaurant_import_candidate'/);
  assert.doesNotMatch(client, /from\(['"]restaurants['"]\)\s*\.insert/);
  assert.match(client, /function escapeHtml/);
  assert.match(client, /function safeUrl/);
  assert.match(client, /candidate\.suggested_vibe/);
  assert.match(client, /candidate\.suggested_description/);
  assert.match(client, /candidate\.suggested_image_url/);
});

test('stránka je chráněná admin guardem a dostupná z obou admin navigací', () => {
  assert.match(html, /src="admin-guard\.js"/);
  assert.match(html, /meta name="robots" content="noindex,nofollow"/);
  assert.match(admin, /admin-imports\.html/);
  assert.match(adminContact, /admin-imports\.html/);
});
