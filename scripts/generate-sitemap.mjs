import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile } from 'node:fs/promises';

const execFileAsync = promisify(execFile);
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jdprdcnxbxfzgrjjfflr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_yVoMprXKwKGu1kIKc3p9ew_TQflIOib';
const SITE_URL = 'https://gurmao.cz';
const headers = { apikey: SUPABASE_KEY, Accept: 'application/json' };

async function fetchAll(table, select) {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    url.searchParams.set('select', select);
    url.searchParams.set('slug', 'not.is.null');
    url.searchParams.set('limit', String(pageSize));
    url.searchParams.set('offset', String(offset));
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`${table}: ${response.status} ${await response.text()}`);
    const page = await response.json();
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

function xmlEscape(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[character]);
}

function urlEntry(location, { lastmod = '', changefreq = 'weekly', priority = '0.7' } = {}) {
  const lines = ['  <url>', `    <loc>${xmlEscape(location)}</loc>`];
  if (lastmod) lines.push(`    <lastmod>${xmlEscape(lastmod)}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) lines.push(`    <priority>${priority}</priority>`);
  lines.push('  </url>');
  return lines.join('\n');
}

async function gitLastmod(relativePath) {
  try {
    const { stdout } = await execFileAsync('git', ['log', '-1', '--format=%cs', '--', relativePath], {
      cwd: new URL('../', import.meta.url)
    });
    const value = stdout.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
  } catch {
    return '';
  }
}

const staticPages = [
  ['/', 'index.html', 'weekly', '1.0'],
  ['/restaurace.html', 'restaurace.html', 'daily', '0.9'],
  ['/mapa.html', 'mapa.html', 'daily', '0.9'],
  ['/feed.html', 'feed.html', 'daily', '0.8'],
  ['/kuchar.html', 'kuchar.html', 'weekly', '0.7'],
  ['/ai.html', 'ai.html', 'weekly', '0.7'],
  ['/kontakt.html', 'kontakt.html', 'monthly', '0.4']
];

const [restaurants, chefs] = await Promise.all([
  fetchAll('restaurants', 'slug,updated_at'),
  fetchAll('chefs', 'slug')
]);

const entries = [];
for (const [path, file, changefreq, priority] of staticPages) {
  entries.push(urlEntry(`${SITE_URL}${path}`, {
    lastmod: await gitLastmod(file),
    changefreq,
    priority
  }));
}

for (const restaurant of restaurants) {
  const slug = encodeURIComponent(restaurant.slug);
  entries.push(urlEntry(`${SITE_URL}/restaurant.html?slug=${slug}`, {
    lastmod: restaurant.updated_at?.slice(0, 10) || '',
    changefreq: 'weekly',
    priority: '0.7'
  }));
}

for (const chef of chefs) {
  entries.push(urlEntry(`${SITE_URL}/kuchar-detail.html?id=${encodeURIComponent(chef.slug)}`, {
    changefreq: 'monthly',
    priority: '0.5'
  }));
}

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries,
  '</urlset>',
  ''
].join('\n');

await writeFile(new URL('../sitemap.xml', import.meta.url), xml, 'utf8');
console.log(`Generated sitemap.xml with ${entries.length} URLs.`);
