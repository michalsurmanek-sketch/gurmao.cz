import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bboxForRegion,
  categoryLabel,
  findProbableDuplicate,
  isRestaurantCategory,
  normalizeOvertureFeature,
  prepareCandidates,
  slugify
} from './cz-import-core.mjs';

function place(overrides = {}) {
  const { properties: propertyOverrides = {}, ...featureOverrides } = overrides;
  return {
    type: 'Feature',
    id: '08f00-example-zlin-123456',
    geometry: { type: 'Point', coordinates: [17.666, 49.224] },
    properties: {
      names: { primary: 'Bistro U Testu' },
      categories: { primary: 'czech_restaurant' },
      confidence: 0.91,
      operating_status: 'open',
      websites: ['https://example.cz'],
      phones: ['+420 123 456 789'],
      addresses: [{
        country: 'CZ',
        region: 'Zlínský kraj',
        locality: 'Zlín',
        postcode: '760 01',
        freeform: 'Dlouhá 1, 760 01 Zlín'
      }],
      ...propertyOverrides
    },
    ...featureOverrides
  };
}

test('rozpozná restaurační kategorie a nepřijme samotnou kavárnu', () => {
  assert.equal(isRestaurantCategory({ primary: 'italian_restaurant' }), true);
  assert.equal(isRestaurantCategory({ primary: 'bistro' }), true);
  assert.equal(isRestaurantCategory({ primary: 'cafe' }), false);
  assert.equal(categoryLabel('czech_restaurant'), 'česká kuchyně');
});

test('normalizuje platnou Overture restauraci pro Zlínský kraj', () => {
  const result = normalizeOvertureFeature(place(), {
    regionCode: 'CZ072', minConfidence: 0.65, sourceRelease: 'test-release'
  });
  assert.equal(result.ok, true);
  assert.equal(result.candidate.region_code, 'CZ072');
  assert.equal(result.candidate.city, 'Zlín');
  assert.equal(result.candidate.website, 'https://example.cz');
  assert.equal(result.candidate.source_release, 'test-release');
  assert.ok(result.candidate.quality_score >= 80);
  assert.match(result.candidate.proposed_slug, /^bistro-u-testu-zlin-/);

  const withoutConfidence = normalizeOvertureFeature(place({ properties: {
    confidence: null
  }}), { regionCode: 'CZ072' });
  assert.equal(withoutConfidence.ok, true);
  assert.equal(withoutConfidence.candidate.confidence, null);
});

test('odmítne záznam z jiného kraje a trvale zavřený podnik', () => {
  const wrongRegion = normalizeOvertureFeature(place({ properties: {
    addresses: [{ country: 'CZ', region: 'Jihomoravský kraj', locality: 'Brno' }]
  }}), { regionCode: 'CZ072' });
  assert.equal(wrongRegion.ok, false);
  assert.equal(wrongRegion.reason, 'region_mismatch');

  const closed = normalizeOvertureFeature(place({ properties: {
    operating_status: 'permanently_closed'
  }}), { regionCode: 'CZ072' });
  assert.equal(closed.reason, 'closed');
});

test('najde duplicitu podle jména, města nebo blízké polohy', () => {
  const normalized = normalizeOvertureFeature(place(), { regionCode: 'CZ072' }).candidate;
  const duplicate = findProbableDuplicate(normalized, [{
    id: 'existing-id', name: 'Bistro U Testu', city: 'Zlín',
    latitude: 49.2241, longitude: 17.6661
  }]);
  assert.equal(duplicate.restaurant.id, 'existing-id');
});

test('připraví čekárnu a oddělí odmítnuté záznamy', () => {
  const result = prepareCandidates([
    place(),
    place({ id: 'not-food', properties: { categories: { primary: 'clothing_store' } } })
  ], { regionCode: 'CZ072' }, []);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].candidate_status, 'new');
  assert.equal(result.rejected.not_restaurant, 1);
});

test('pomocné hodnoty jsou stabilní', () => {
  assert.equal(slugify('Žlutý Kůň'), 'zluty-kun');
  assert.equal(bboxForRegion('CZ010'), '14.22,49.94,14.71,50.18');
});
