import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [sql, html, client, workflow] = await Promise.all([
  readFile(new URL('../chef-import-pipeline.sql', import.meta.url), 'utf8'),
  readFile(new URL('../admin-chef-imports.html', import.meta.url), 'utf8'),
  readFile(new URL('../admin-chef-imports.js', import.meta.url), 'utf8'),
  readFile(new URL('../.github/workflows/discover-chefs.yml', import.meta.url), 'utf8')
]);

test('chef candidate queue is private and admin-only', () => {
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /Only admins can read chef import candidates/);
  assert.match(sql, /USING \(public\.is_admin\(\)\)/);
  assert.match(sql, /GRANT ALL ON public\.chef_import_candidates TO service_role/);
});

test('publishing is available only through protected RPC', () => {
  assert.match(sql, /SECURITY DEFINER/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.publish_chef_import_candidate/);
  assert.match(sql, /IF NOT public\.is_admin\(\)/);
  assert.match(sql, /candidate_status <> 'approved'/);
  assert.match(sql, /NULLIF\(btrim\(v_candidate\.bio\), ''\) IS NULL/);
  assert.doesNotMatch(client, /\.from\(['"]chefs['"]\)\s*\.insert/);
  assert.match(client, /rpc\('publish_chef_import_candidate'/);
});

test('admin requires edit, review and explicit publish actions', () => {
  assert.match(html, /Nic se nezveřejní automaticky/);
  assert.match(client, /rpc\('update_chef_import_candidate'/);
  assert.match(client, /rpc\('review_chef_import_candidate'/);
  assert.match(client, /data-action="publish"/);
});

test('workflow uses existing protected Supabase secrets', () => {
  assert.match(workflow, /secrets\.SUPABASE_URL/);
  assert.match(workflow, /secrets\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(workflow, /--stage/);
});
