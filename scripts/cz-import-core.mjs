const CZECHIA_BBOX = [12.09, 48.55, 18.86, 51.06];

export const REGIONS = Object.freeze({
  CZ010: {
    name: 'Hlavní město Praha',
    bbox: [14.22, 49.94, 14.71, 50.18],
    aliases: ['CZ010', 'CZ-10', 'Hlavní město Praha', 'Praha', 'Prague']
  },
  CZ020: {
    name: 'Středočeský kraj',
    bbox: [13.39, 49.45, 15.65, 50.62],
    aliases: ['CZ020', 'CZ-20', 'Středočeský kraj', 'Stredocesky kraj', 'Central Bohemian Region']
  },
  CZ031: {
    name: 'Jihočeský kraj',
    bbox: [13.52, 48.55, 15.61, 49.67],
    aliases: ['CZ031', 'CZ-31', 'Jihočeský kraj', 'Jihocesky kraj', 'South Bohemian Region']
  },
  CZ032: {
    name: 'Plzeňský kraj',
    bbox: [12.09, 48.94, 13.86, 50.11],
    aliases: ['CZ032', 'CZ-32', 'Plzeňský kraj', 'Plzensky kraj', 'Plzeň Region', 'Pilsen Region']
  },
  CZ041: {
    name: 'Karlovarský kraj',
    bbox: [12.09, 49.88, 13.31, 50.46],
    aliases: ['CZ041', 'CZ-41', 'Karlovarský kraj', 'Karlovy Vary Region']
  },
  CZ042: {
    name: 'Ústecký kraj',
    bbox: [12.92, 50.10, 14.65, 51.06],
    aliases: ['CZ042', 'CZ-42', 'Ústecký kraj', 'Ustecky kraj', 'Ústí nad Labem Region', 'Usti nad Labem Region']
  },
  CZ051: {
    name: 'Liberecký kraj',
    bbox: [14.67, 50.55, 15.64, 51.03],
    aliases: ['CZ051', 'CZ-51', 'Liberecký kraj', 'Liberecky kraj', 'Liberec Region']
  },
  CZ052: {
    name: 'Královéhradecký kraj',
    bbox: [15.08, 50.03, 16.60, 50.82],
    aliases: ['CZ052', 'CZ-52', 'Královéhradecký kraj', 'Kralovehradecky kraj', 'Hradec Králové Region', 'Hradec Kralove Region']
  },
  CZ053: {
    name: 'Pardubický kraj',
    bbox: [15.35, 49.55, 16.88, 50.22],
    aliases: ['CZ053', 'CZ-53', 'Pardubický kraj', 'Pardubicky kraj', 'Pardubice Region']
  },
  CZ063: {
    name: 'Kraj Vysočina',
    bbox: [14.89, 48.94, 16.42, 49.86],
    aliases: ['CZ063', 'CZ-63', 'Kraj Vysočina', 'Kraj Vysocina', 'Vysočina Region', 'Vysocina Region']
  },
  CZ064: {
    name: 'Jihomoravský kraj',
    bbox: [15.54, 48.60, 17.65, 49.63],
    aliases: ['CZ064', 'CZ-64', 'Jihomoravský kraj', 'Jihomoravsky kraj', 'South Moravian Region']
  },
  CZ071: {
    name: 'Olomoucký kraj',
    bbox: [16.70, 49.26, 17.92, 50.45],
    aliases: ['CZ071', 'CZ-71', 'Olomoucký kraj', 'Olomoucky kraj', 'Olomouc Region']
  },
  CZ072: {
    name: 'Zlínský kraj',
    bbox: [17.10, 48.84, 18.42, 49.55],
    aliases: ['CZ072', 'CZ-72', 'Zlínský kraj', 'Zlinsky kraj', 'Zlín Region', 'Zlin Region']
  },
  CZ080: {
    name: 'Moravskoslezský kraj',
    bbox: [17.14, 49.39, 18.86, 50.33],
    aliases: ['CZ080', 'CZ-80', 'Moravskoslezský kraj', 'Moravian-Silesian Region']
  }
});

const RESTAURANT_CATEGORY_NAMES = new Set([
  'restaurant', 'bistro', 'brasserie', 'buffet_restaurant', 'barbecue_restaurant',
  'burger_restaurant', 'canteen', 'cafeteria', 'diner', 'doner_kebab',
  'food_court', 'gastropub', 'pizzeria', 'pizza_restaurant', 'steakhouse',
  'tapas_bar', 'breakfast_and_brunch_restaurant'
]);

function parseMaybeJson(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed || !['[', '{'].includes(trimmed[0])) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function asArray(value) {
  const parsed = parseMaybeJson(value);
  if (parsed == null) return [];
  return Array.isArray(parsed) ? parsed : [parsed];
}

function scalar(value) {
  const parsed = parseMaybeJson(value);
  if (parsed == null) return '';
  if (typeof parsed === 'string' || typeof parsed === 'number') return String(parsed).trim();
  if (Array.isArray(parsed)) return scalar(parsed[0]);
  if (typeof parsed === 'object') {
    return scalar(parsed.primary ?? parsed.name ?? parsed.value ?? parsed.code ?? '');
  }
  return '';
}

export function normalizeText(value) {
  return scalar(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('cs')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function slugify(value) {
  return normalizeText(value).replace(/\s+/g, '-').replace(/^-|-$/g, '') || 'restaurace';
}

function categoryValues(categories) {
  const parsed = parseMaybeJson(categories);
  if (!parsed) return [];
  if (typeof parsed === 'string') return [parsed];
  if (Array.isArray(parsed)) return parsed.flatMap(categoryValues);
  return [parsed.primary, ...(asArray(parsed.alternate)), parsed.basic_category]
    .flatMap(categoryValues)
    .filter(Boolean);
}

export function isRestaurantCategory(categories) {
  return categoryValues(categories).some((rawCategory) => {
    const category = normalizeText(rawCategory).replace(/\s+/g, '_');
    return RESTAURANT_CATEGORY_NAMES.has(category) || category.endsWith('_restaurant');
  });
}

function primaryCategory(categories) {
  const parsed = parseMaybeJson(categories);
  return scalar(parsed?.primary ?? categoryValues(parsed)[0]);
}

export function categoryLabel(category) {
  const normalized = normalizeText(category).replace(/\s+/g, '_');
  const labels = [
    [/czech/, 'česká kuchyně'], [/italian|pizza/, 'italská kuchyně / pizza'],
    [/vietnamese/, 'vietnamská kuchyně'], [/thai/, 'thajská kuchyně'],
    [/chinese/, 'čínská kuchyně'], [/japanese|sushi/, 'japonská kuchyně / sushi'],
    [/indian/, 'indická kuchyně'], [/mexican|taco/, 'mexická kuchyně'],
    [/burger/, 'burgery'], [/vegan/, 'veganská kuchyně'],
    [/vegetarian/, 'vegetariánská kuchyně'], [/seafood|fish/, 'ryby / mořské plody'],
    [/steak|meat|barbecue|grill/, 'maso / gril'], [/bistro/, 'bistro'],
    [/gastropub|brasserie/, 'gastropub'], [/breakfast|brunch/, 'snídaně / brunch']
  ];
  return labels.find(([pattern]) => pattern.test(normalized))?.[1] ||
    normalized.replace(/_restaurant$/, '').replace(/_/g, ' ');
}

function addressCountry(address, properties) {
  return scalar(address?.country ?? address?.country_code ?? properties?.country);
}

function isCzechCountry(value) {
  if (!value) return true;
  return ['cz', 'cze', 'cesko', 'czechia', 'czech republic'].includes(normalizeText(value));
}

function regionMatches(value, regionCode) {
  const normalized = normalizeText(value);
  if (!normalized) return false;
  return REGIONS[regionCode].aliases.some((alias) => normalizeText(alias) === normalized);
}

function pointInBbox(longitude, latitude, bbox) {
  return longitude >= bbox[0] && longitude <= bbox[2] && latitude >= bbox[1] && latitude <= bbox[3];
}

function firstWebUrl(value) {
  return asArray(value)
    .map((item) => scalar(item?.url ?? item))
    .find((item) => /^https?:\/\//i.test(item)) || null;
}

function firstPhone(value) {
  return asArray(value).map((item) => scalar(item?.number ?? item)).find(Boolean) || null;
}

function qualityScore(candidate) {
  const points = [
    [candidate.name, 15], [candidate.city, 10], [candidate.region_code, 10],
    [candidate.address, 15], [candidate.postal_code, 5], [candidate.category, 10],
    [candidate.phone, 5], [candidate.website, 5]
  ].reduce((sum, [value, weight]) => sum + (value ? weight : 0), 0);
  const coordinates = candidate.latitude != null && candidate.longitude != null ? 15 : 0;
  const confidence = candidate.confidence == null ? 0 : Math.round(candidate.confidence * 10);
  return Math.min(100, points + coordinates + confidence);
}

function rejection(reason, detail = null) {
  return { ok: false, reason, detail };
}

export function normalizeOvertureFeature(feature, options) {
  const { regionCode, minConfidence = 0.65, sourceRelease = null } = options;
  const region = REGIONS[regionCode];
  if (!region) throw new Error(`Neznámý kód kraje: ${regionCode}`);

  const properties = parseMaybeJson(feature?.properties) || feature || {};
  const id = scalar(properties.id ?? feature?.id);
  const name = scalar(parseMaybeJson(properties.names)?.primary ?? properties.name);
  const categories = parseMaybeJson(properties.categories);
  const confidenceValue = properties.confidence == null || properties.confidence === ''
    ? Number.NaN
    : Number(properties.confidence);
  const confidence = Number.isFinite(confidenceValue) ? confidenceValue : null;
  const status = normalizeText(properties.operating_status);

  if (!id) return rejection('missing_source_id');
  if (!name) return rejection('missing_name');
  if (!isRestaurantCategory(categories)) return rejection('not_restaurant');
  if (status.includes('closed')) return rejection('closed');
  if (confidence != null && confidence < minConfidence) return rejection('low_confidence');

  const geometry = parseMaybeJson(feature?.geometry ?? properties.geometry);
  const longitude = Number(geometry?.coordinates?.[0]);
  const latitude = Number(geometry?.coordinates?.[1]);
  if (geometry?.type !== 'Point' || !Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return rejection('missing_coordinates');
  }
  if (!pointInBbox(longitude, latitude, CZECHIA_BBOX) || !pointInBbox(longitude, latitude, region.bbox)) {
    return rejection('outside_region_bbox');
  }

  const addresses = asArray(properties.addresses).map(parseMaybeJson).filter(Boolean);
  const address = addresses.find((item) => isCzechCountry(addressCountry(item, properties))) || addresses[0] || {};
  if (!isCzechCountry(addressCountry(address, properties))) return rejection('outside_czechia');

  const city = scalar(address.locality ?? address.city ?? address.town ?? properties.city);
  const addressRegion = scalar(address.region ?? address.region_code ?? address.state ?? properties.region);
  const pragueFallback = regionCode === 'CZ010' && ['praha', 'prague'].some((cityName) => normalizeText(city).startsWith(cityName));
  if (!regionMatches(addressRegion, regionCode) && !pragueFallback) {
    return rejection('region_mismatch', addressRegion || null);
  }

  const category = primaryCategory(categories);
  const suffix = id.replace(/[^a-zA-Z0-9]/g, '').slice(-10).toLocaleLowerCase() || 'overture';
  const candidate = {
    source_type: 'overture_places',
    source_external_id: id,
    source_release: sourceRelease,
    source_url: 'https://docs.overturemaps.org/guides/places/',
    name,
    proposed_slug: `${slugify(name)}-${slugify(city)}-${suffix}`.slice(0, 180),
    category,
    category_label: categoryLabel(category),
    region_code: regionCode,
    district: scalar(address.county ?? address.district) || null,
    district_code: scalar(address.county_code ?? address.district_code) || null,
    municipality_code: scalar(address.locality_code ?? address.municipality_code) || null,
    city: city || null,
    postal_code: scalar(address.postcode ?? address.postal_code) || null,
    address: scalar(address.freeform ?? address.formatted_address) || null,
    latitude,
    longitude,
    phone: firstPhone(properties.phones),
    website: firstWebUrl(properties.websites),
    confidence,
    operating_status: scalar(properties.operating_status) || null,
    raw_source: { type: 'Feature', id, properties, geometry }
  };
  candidate.quality_score = qualityScore(candidate);
  return { ok: true, candidate };
}

export function haversineMeters(a, b) {
  const earthRadius = 6_371_000;
  const radians = (degrees) => degrees * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function tokenSimilarity(left, right) {
  const a = new Set(normalizeText(left).split(' ').filter(Boolean));
  const b = new Set(normalizeText(right).split(' ').filter(Boolean));
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / new Set([...a, ...b]).size;
}

export function findProbableDuplicate(candidate, restaurants) {
  for (const restaurant of restaurants) {
    if (restaurant.source_type === candidate.source_type &&
        restaurant.source_external_id === candidate.source_external_id) {
      return { restaurant, reason: 'same_source_id' };
    }

    const sameName = normalizeText(restaurant.name) === normalizeText(candidate.name);
    const sameCity = normalizeText(restaurant.city) === normalizeText(candidate.city);
    if (sameName && sameCity) return { restaurant, reason: 'same_name_and_city' };

    const coordinatesAvailable = [restaurant.latitude, restaurant.longitude, candidate.latitude, candidate.longitude]
      .every((value) => Number.isFinite(Number(value)));
    if (coordinatesAvailable) {
      const distance = haversineMeters(candidate, {
        latitude: Number(restaurant.latitude), longitude: Number(restaurant.longitude)
      });
      if (distance <= 75 && (sameName || tokenSimilarity(restaurant.name, candidate.name) >= 0.8)) {
        return { restaurant, reason: `nearby_name_match_${Math.round(distance)}m` };
      }
    }
  }
  return null;
}

export function prepareCandidates(features, options, existingRestaurants = []) {
  const candidates = [];
  const rejected = {};
  const sourceIds = new Set();

  for (const feature of features) {
    const result = normalizeOvertureFeature(feature, options);
    if (!result.ok) {
      rejected[result.reason] = (rejected[result.reason] || 0) + 1;
      continue;
    }
    const candidate = result.candidate;
    if (sourceIds.has(candidate.source_external_id)) {
      rejected.duplicate_in_source = (rejected.duplicate_in_source || 0) + 1;
      continue;
    }
    sourceIds.add(candidate.source_external_id);

    const duplicate = findProbableDuplicate(candidate, existingRestaurants);
    candidate.candidate_status = duplicate?.reason === 'same_source_id'
      ? 'already_imported'
      : duplicate ? 'probable_duplicate' : 'new';
    candidate.duplicate_restaurant_id = duplicate?.restaurant?.id || null;
    candidate.review_notes = duplicate ? `Automatická shoda: ${duplicate.reason}` : null;
    candidates.push(candidate);
  }

  return { candidates, rejected };
}

export function bboxForRegion(regionCode) {
  const region = REGIONS[regionCode];
  if (!region) throw new Error(`Neznámý kód kraje: ${regionCode}`);
  return region.bbox.join(',');
}
