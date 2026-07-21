import assert from 'node:assert/strict';
import test from 'node:test';
import { extractChefCandidates } from './discover-chefs.mjs';

const restaurant = { id: '11111111-1111-1111-1111-111111111111', name: 'Test restaurace' };

test('extracts a chef only from structured official data', () => {
  const html = `<script type="application/ld+json">${JSON.stringify({
    '@type': 'Restaurant',
    chef: {
      '@type': 'Person',
      name: 'Jana Nováková',
      jobTitle: 'Šéfkuchařka',
      description: 'Vede kuchyni restaurace od roku 2020.',
      image: '/team/jana.jpg',
      sameAs: ['https://instagram.com/jana.chef']
    }
  })}</script>`;
  const [candidate] = extractChefCandidates(html, 'https://example.cz/', restaurant);
  assert.equal(candidate.name, 'Jana Nováková');
  assert.equal(candidate.restaurant_id, restaurant.id);
  assert.equal(candidate.confidence, 0.95);
  assert.equal(candidate.image_url, 'https://example.cz/team/jana.jpg');
  assert.equal(candidate.instagram_url, 'https://instagram.com/jana.chef');
});

test('rejects unrelated people without a chef role', () => {
  const html = `<script type="application/ld+json">${JSON.stringify({
    '@type': 'Person',
    name: 'Petr Svoboda',
    jobTitle: 'Fotograf'
  })}</script>`;
  assert.deepEqual(extractChefCandidates(html, 'https://example.cz/', restaurant), []);
});

test('rejects unsafe image and social URLs', () => {
  const html = `<script type="application/ld+json">${JSON.stringify({
    '@type': 'Person',
    name: 'Karel Dvořák',
    jobTitle: 'Executive Chef',
    image: 'http://127.0.0.1/private.jpg',
    sameAs: ['javascript:alert(1)']
  })}</script>`;
  const [candidate] = extractChefCandidates(html, 'https://example.cz/', restaurant);
  assert.equal(candidate.image_url, null);
  assert.equal(candidate.instagram_url, null);
});
