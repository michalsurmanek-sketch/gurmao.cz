import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractChefCandidates,
  extractChefCandidatesFromText,
  extractRelevantChefLinks
} from './discover-chefs.mjs';

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

test('finds only same-origin team and chef pages', () => {
  const html = `
    <a href="/o-nas">O nás</a>
    <a href="/menu">Menu</a>
    <a href="https://other.example/team">Team</a>
    <a href="/nas-tym#kuchyne">Náš tým</a>`;
  assert.deepEqual(extractRelevantChefLinks(html, 'https://example.cz/'), [
    'https://example.cz/o-nas',
    'https://example.cz/nas-tym'
  ]);
});

test('extracts an explicit chef and full name from official profile text', () => {
  const html = `
    <main>
      <h1>Náš tým</h1>
      <article><h2>Šéfkuchař: Jan Novák</h2><p>Jan vede kuchyni od roku 2019 a pracuje s lokálními surovinami.</p></article>
      <article><h2>Fotograf: Petr Svoboda</h2></article>
    </main>`;
  const candidates = extractChefCandidatesFromText(html, 'https://example.cz/nas-tym', restaurant);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].name, 'Jan Novák');
  assert.equal(candidates[0].confidence, 0.72);
  assert.match(candidates[0].evidence, /Šéfkuchař: Jan Novák/);
});

test('does not accept generic chef wording without a person name', () => {
  const html = '<p>Náš šéfkuchař připravuje každý den nové menu.</p>';
  assert.deepEqual(extractChefCandidatesFromText(html, 'https://example.cz/o-nas', restaurant), []);
});
