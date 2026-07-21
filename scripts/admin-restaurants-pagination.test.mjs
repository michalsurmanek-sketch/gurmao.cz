import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const adminHtml = await readFile(new URL('../admin.html', import.meta.url), 'utf8');

test('restaurant total uses an exact database count', () => {
  assert.match(adminHtml, /select\('id', \{ count: 'exact', head: true \}\)/);
  assert.match(adminHtml, /stat-restaurants'\)\.textContent = totalCount/);
  assert.doesNotMatch(adminHtml, /stat-restaurants'\)\.textContent = data\.length/);
});

test('restaurant list is loaded in server-side pages', () => {
  assert.match(adminHtml, /const RESTAURANTS_PAGE_SIZE = 50/);
  assert.match(adminHtml, /\.range\(from, to\)/);
  assert.match(adminHtml, /id="restaurantsPagination"/);
  assert.match(adminHtml, /function changeRestaurantsPage\(page\)/);
});

test('restaurant search runs against the database', () => {
  assert.match(adminHtml, /restaurantsQuery\.or\(/);
  assert.match(adminHtml, /restaurantsSearchTimer = setTimeout\(\(\) => loadRestaurants\(1\), 250\)/);
});

test('city and atmosphere filters run against the full database', () => {
  assert.match(adminHtml, /id="filterRestaurantCity"/);
  assert.match(adminHtml, /id="filterRestaurantVibe"/);
  assert.match(adminHtml, /restaurantsQuery\.eq\('city', restaurantCityFilter\)/);
  assert.match(adminHtml, /restaurantsQuery\.eq\('vibe', restaurantVibeFilter\)/);
  assert.match(adminHtml, /from \+ 999/);
});

test('restaurant filters can be cleared together', () => {
  assert.match(adminHtml, /id="resetRestaurantFilters"/);
  assert.match(adminHtml, /restaurantCityFilter = ''/);
  assert.match(adminHtml, /restaurantVibeFilter = ''/);
});
