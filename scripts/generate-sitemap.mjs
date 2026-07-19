const SUPABASE_URL = 'https://jdprdcnxbxfzgrjjfflr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yVoMprXKwKGu1kIKc3p9ew_TQflIOib';
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

function urlEntry(location, lastmod, changefreq = 'weekly', priority = '0.7') {
  return [
    '  <url>',
    `    <loc>${location}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>'
  ].join('\n');
}

const today = new Date().toISOString().slice(0, 10);
const staticPages = [
  ['/', 'weekly', '1.0'],
  ['/restaurace.html', 'daily', '0.9'],
  ['/mapa.html', 'daily', '0.9'],
  ['/feed.html', 'daily', '0.8'],
  ['/kuchar.html', 'weekly', '0.7'],
  ['/ai.html', 'weekly', '0.7'],
  ['/gear.html', 'weekly', '0.6'],
  ['/kontakt.html', 'monthly', '0.4'],
  ['/legal.html', 'yearly', '0.2']
];

const [restaurants, chefs] = await Promise.all([
  fetchAll('restaurants', 'slug,updated_at'),
  fetchAll('chefs', 'slug')
]);

const entries = staticPages.map(([path, frequency, priority]) =>
  urlEntry(`${SITE_URL}${path}`, today, frequency, priority)
);

for (const restaurant of restaurants) {
  const slug = encodeURIComponent(restaurant.slug);
  const lastmod = restaurant.updated_at?.slice(0, 10) || today;
  entries.push(urlEntry(`${SITE_URL}/restaurace-detail.html?id=${slug}`, lastmod, 'weekly', '0.7'));
}

for (const chef of chefs) {
  entries.push(urlEntry(`${SITE_URL}/kuchar-detail.html?id=${encodeURIComponent(chef.slug)}`, today, 'monthly', '0.5'));
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
import { writeFile } from 'node:fs/promises';
