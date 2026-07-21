#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';
import {
  REGIONS,
  bboxForRegion,
  parseImportLimit,
  prepareCandidates
} from './cz-import-core.mjs';

function parseArgs(argv) {
  const args = {};
  for (const argument of argv) {
    if (!argument.startsWith('--')) continue;
    const [key, ...value] = argument.slice(2).split('=');
    args[key] = value.length ? value.join('=') : true;
  }
  return args;
}

function usage() {
  return `Použití:
  node scripts/import-czech-restaurants.mjs --print-bbox --region=CZ072
  node scripts/import-czech-restaurants.mjs --input=data.geojson --region=CZ072 [--report=report.json]
  node scripts/import-czech-restaurants.mjs --input=data.geojson --region=CZ072 --stage

Volby:
  --stage                 Uloží kandidáty do neveřejné čekárny (nikdy je nepublikuje).
  --min-confidence=0.65   Nejnižší přijímaná důvěryhodnost Overture.
  --source-release=...    Verze Overture release uvedená v reportu a dávce.
  --limit=500             Omezí počet kandidátů, vhodné pro první zkoušku.
  --report=path.json      Cesta pro kontrolní report.
`;
}

async function readFeatures(path) {
  const content = await readFile(path, 'utf8');
  const trimmed = content.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.type === 'FeatureCollection') return parsed.features || [];
    if (parsed.type === 'Feature') return [parsed];
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Overture CLI může vrátit také GeoJSONSeq/NDJSON, zpracujeme jej po řádcích.
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.replace(/^\x1e/, '').trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Neplatný JSON na řádku ${index + 1}: ${error.message}`);
      }
    });
}

function supabaseConfig(requireServiceRole) {
  const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const readKey = serviceKey || process.env.SUPABASE_ANON_KEY || '';
  if (requireServiceRole && (!url || !serviceKey)) {
    throw new Error('Pro --stage nastavte SUPABASE_URL a SUPABASE_SERVICE_ROLE_KEY.');
  }
  return { url, serviceKey, readKey };
}

async function request(config, path, options = {}) {
  const key = options.write ? config.serviceKey : config.readKey;
  if (!config.url || !key) throw new Error('Chybí Supabase URL nebo API klíč.');
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 1000);
    throw new Error(`Supabase ${response.status}: ${detail}`);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function readExistingRestaurants(config) {
  if (!config.url || !config.readKey) return { rows: [], checked: false };
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const query = new URLSearchParams({
      select: 'id,name,city,latitude,longitude,source_type,source_external_id',
      limit: String(pageSize),
      offset: String(offset)
    });
    const page = await request(config, `restaurants?${query}`);
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return { rows, checked: true };
}

async function createBatch(config, metadata) {
  const rows = await request(config, 'restaurant_import_batches', {
    method: 'POST',
    write: true,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      source_type: 'overture_places',
      source_reference: metadata.sourceReference,
      region_code: metadata.regionCode,
      status: 'running',
      total_records: metadata.totalRecords,
      notes: 'Automatický import do neveřejné čekárny; bez publikace na web.'
    })
  });
  if (!rows?.[0]?.id) throw new Error('Supabase nevrátil ID importní dávky.');
  return rows[0].id;
}

async function stageCandidates(config, batchId, candidates) {
  const chunkSize = 100;
  for (let index = 0; index < candidates.length; index += chunkSize) {
    const chunk = candidates.slice(index, index + chunkSize).map((candidate) => ({
      ...candidate,
      import_batch_id: batchId
    }));
    await request(config,
      'restaurant_import_candidates?on_conflict=source_type,source_external_id', {
        method: 'POST',
        write: true,
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(chunk)
      });
  }
}

async function finishBatch(config, batchId, values) {
  const query = new URLSearchParams({ id: `eq.${batchId}` });
  await request(config, `restaurant_import_batches?${query}`, {
    method: 'PATCH',
    write: true,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(values)
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  const regionCode = String(args.region || '').toUpperCase();
  if (!REGIONS[regionCode]) throw new Error(`Vyberte platný kraj: ${Object.keys(REGIONS).join(', ')}`);
  if (args['print-bbox']) {
    console.log(bboxForRegion(regionCode));
    return;
  }
  if (!args.input) throw new Error(`Chybí --input.\n\n${usage()}`);

  const minConfidence = Number(args['min-confidence'] ?? 0.65);
  if (!Number.isFinite(minConfidence) || minConfidence < 0 || minConfidence > 1) {
    throw new Error('--min-confidence musí být číslo od 0 do 1.');
  }
  const limit = parseImportLimit(args.limit);

  const features = await readFeatures(args.input);
  const config = supabaseConfig(Boolean(args.stage));
  const existing = await readExistingRestaurants(config);
  const prepared = prepareCandidates(features, {
    regionCode,
    minConfidence,
    sourceRelease: args['source-release'] || null
  }, existing.rows);
  const candidates = prepared.candidates.slice(0, limit);

  const statusCounts = candidates.reduce((counts, item) => {
    counts[item.candidate_status] = (counts[item.candidate_status] || 0) + 1;
    return counts;
  }, {});
  const report = {
    created_at: new Date().toISOString(),
    mode: args.stage ? 'staged' : 'dry-run',
    source: 'Overture Places',
    source_release: args['source-release'] || null,
    region_code: regionCode,
    region_name: REGIONS[regionCode].name,
    min_confidence: minConfidence,
    input_features: features.length,
    accepted_candidates: candidates.length,
    candidate_statuses: statusCounts,
    rejected: prepared.rejected,
    database_duplicate_check: existing.checked,
    sample: candidates.slice(0, 20).map(({ raw_source, ...candidate }) => candidate)
  };

  let batchId = null;
  if (args.stage) {
    batchId = await createBatch(config, {
      sourceReference: `Overture ${args['source-release'] || 'latest'} / ${regionCode}`,
      regionCode,
      totalRecords: features.length
    });
    try {
      await stageCandidates(config, batchId, candidates);
      await finishBatch(config, batchId, {
        status: 'completed',
        imported_records: candidates.length,
        skipped_records: features.length - candidates.length,
        error_records: 0,
        completed_at: new Date().toISOString(),
        notes: JSON.stringify({ candidate_statuses: statusCounts, rejected: prepared.rejected })
      });
    } catch (error) {
      await finishBatch(config, batchId, {
        status: 'failed',
        error_records: 1,
        completed_at: new Date().toISOString(),
        notes: error.message.slice(0, 1000)
      }).catch(() => {});
      throw error;
    }
    report.import_batch_id = batchId;
  }

  const reportPath = args.report || `import-report-${regionCode}.json`;
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    mode: report.mode,
    region: `${regionCode} – ${REGIONS[regionCode].name}`,
    input: report.input_features,
    candidates: report.accepted_candidates,
    statuses: statusCounts,
    report: reportPath,
    batch_id: batchId
  }, null, 2));
}

main().catch((error) => {
  console.error(`Import selhal: ${error.message}`);
  process.exitCode = 1;
});
