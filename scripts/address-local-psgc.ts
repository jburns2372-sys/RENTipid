import { PrismaClient } from '@prisma/client';
import {
  assertLocalDatabaseUrl,
  databaseName,
  LOCAL_ADDRESS_DATABASE,
} from './address-local-common';

const API_BASE = 'https://psgc.cloud/api';
const SOURCE = 'PSGC_CLOUD';
const SOURCE_VERSION = 'PSA_PSGC_Q2_2026';
const EXPECTED_DB_ARG = `--expected-db=${LOCAL_ADDRESS_DATABASE}`;
const prisma = new PrismaClient();

interface SourceEntry { code: string; name: string }
interface BulkBarangay extends SourceEntry {
  city_municipality?: { code?: string };
  cityMunicipality?: { code?: string };
}
interface SubdivisionRow {
  psgcCode: string;
  name: string;
  geographicLevel: string;
  parentPsgcCode: string | null;
  isActive: boolean;
  source: string;
  sourceVersion: string;
  syncedAt: Date;
}

async function fetchList(path: string, attempts = 8): Promise<SourceEntry[]> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE}${path}`, { signal: AbortSignal.timeout(120000) });
      if (!response.ok) {
        if (response.status === 429 && attempt < attempts) {
          const retryAfter = Number(response.headers.get('retry-after'));
          const delay = Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : Math.min(15000, 500 * (2 ** attempt));
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`PSGC request failed with HTTP ${response.status}.`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('PSGC response was not an array.');
      return data as SourceEntry[];
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw lastError;
}

async function synchronizeBulkBarangays(): Promise<number | null> {
  try {
    const response = await fetchList('/v2/barangays', 10) as BulkBarangay[];
    if (response.length < 40000) return null;
    const syncedAt = new Date();
    const mapped = response.map((entry) => ({
      psgcCode: entry.code,
      name: entry.name.trim(),
      geographicLevel: 'BARANGAY',
      parentPsgcCode: entry.city_municipality?.code || entry.cityMunicipality?.code || null,
      isActive: true,
      source: SOURCE,
      sourceVersion: SOURCE_VERSION,
      syncedAt,
    }));
    if (mapped.some((entry) => !entry.parentPsgcCode)) return null;
    await insertRows(mapped);
    return mapped.length;
  } catch {
    return null;
  }
}

function rows(entries: SourceEntry[], geographicLevel: string): SubdivisionRow[] {
  const syncedAt = new Date();
  return entries.map((entry) => ({
    psgcCode: entry.code,
    name: entry.name.trim(),
    geographicLevel,
    parentPsgcCode: null,
    isActive: true,
    source: SOURCE,
    sourceVersion: SOURCE_VERSION,
    syncedAt,
  }));
}

async function insertRows(data: SubdivisionRow[]): Promise<void> {
  for (let offset = 0; offset < data.length; offset += 500) {
    await prisma.psgcSubdivision.createMany({
      data: data.slice(offset, offset + 500),
      skipDuplicates: true,
    });
  }
}

async function registryReady(): Promise<boolean> {
  try {
    const [regions, cities, barangays, qcBarangays, batasan] = await Promise.all([
      prisma.psgcSubdivision.count({ where: { geographicLevel: 'REGION', isActive: true } }),
      prisma.psgcSubdivision.count({
        where: { geographicLevel: { in: ['CITY', 'MUNICIPALITY'] }, isActive: true },
      }),
      prisma.psgcSubdivision.count({ where: { geographicLevel: 'BARANGAY', isActive: true } }),
      prisma.psgcSubdivision.count({
        where: { parentPsgcCode: '1381300000', geographicLevel: 'BARANGAY', isActive: true },
      }),
      prisma.psgcSubdivision.findUnique({ where: { psgcCode: '1381300139' } }),
    ]);
    return regions >= 17 && cities >= 1600 && barangays >= 40000 && qcBarangays === 142 && batasan?.name === 'Batasan Hills';
  } catch {
    return false;
  }
}

async function synchronizeBarangays(parents: SourceEntry[]): Promise<number> {
  const existing = await prisma.psgcSubdivision.findMany({
    where: { geographicLevel: 'BARANGAY', parentPsgcCode: { not: null } },
    select: { parentPsgcCode: true },
    distinct: ['parentPsgcCode'],
  });
  const completedParents = new Set(existing.map((entry) => entry.parentPsgcCode));
  const pending = parents.filter((parent) => !completedParents.has(parent.code));
  let cursor = 0;
  let processed = 0;
  const worker = async () => {
    while (cursor < pending.length) {
      const parent = pending[cursor++];
      const entries = await fetchList(`/cities-municipalities/${parent.code}/barangays`);
      const syncedAt = new Date();
      await insertRows(entries.map((entry) => ({
        psgcCode: entry.code,
        name: entry.name.trim(),
        geographicLevel: 'BARANGAY',
        parentPsgcCode: parent.code,
        isActive: true,
        source: SOURCE,
        sourceVersion: SOURCE_VERSION,
        syncedAt,
      })));
      processed += 1;
      if (processed % 100 === 0) console.log(`PSGC barangay parents synchronized: ${processed}/${pending.length}`);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  };
  await Promise.all(Array.from({ length: 2 }, () => worker()));
  return prisma.psgcSubdivision.count({ where: { geographicLevel: 'BARANGAY', isActive: true } });
}

async function main(): Promise<void> {
  if (!process.argv.includes(EXPECTED_DB_ARG)) {
    throw new Error(`SAFETY: Required argument '${EXPECTED_DB_ARG}' is missing.`);
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  assertLocalDatabaseUrl(databaseUrl, LOCAL_ADDRESS_DATABASE);
  const identity = await prisma.$queryRaw<{ current_database: string }[]>`SELECT current_database()`;
  if (identity[0]?.current_database !== databaseName(databaseUrl)) {
    throw new Error('SAFETY: Connected database identity mismatch.');
  }
  if (await registryReady()) {
    console.log('PSGC_ACTUAL_SOURCE = PSGC_CLOUD');
    console.log('PSA_OFFICIAL_SOURCE = VALIDATED_COPY');
    console.log(`PSGC_SOURCE_VERSION = ${SOURCE_VERSION}`);
    console.log('PSGC registry already complete; skipping population.');
    return;
  }

  console.log('Populating the local PSGC registry from the PSA-compatible adapter...');
  const [regions, provinces, cities, municipalities] = await Promise.all([
    fetchList('/regions'),
    fetchList('/provinces'),
    fetchList('/cities'),
    fetchList('/municipalities'),
  ]);
  if (regions.length < 17 || provinces.length < 80 || cities.length < 140 || municipalities.length < 1400) {
    throw new Error('PSGC upstream returned an incomplete registry; no completion state recorded.');
  }

  await insertRows(rows(regions, 'REGION'));
  await insertRows(rows(provinces, 'PROVINCE'));
  await insertRows(rows(cities, 'CITY'));
  await insertRows(rows(municipalities, 'MUNICIPALITY'));
  const bulkCount = await synchronizeBulkBarangays();
  const barangayCount = bulkCount ?? await synchronizeBarangays([...cities, ...municipalities]);
  if (barangayCount < 40000) {
    throw new Error(`PSGC upstream returned only ${barangayCount} barangays.`);
  }
  if (!(await registryReady())) throw new Error('PSGC registry verification failed after population.');
  console.log('PSGC_ACTUAL_SOURCE = PSGC_CLOUD');
  console.log('PSA_OFFICIAL_SOURCE = VALIDATED_COPY');
  console.log(`PSGC_SOURCE_VERSION = ${SOURCE_VERSION}`);
  console.log(`PSGC registry ready (${barangayCount} active barangays).`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'PSGC population failed safely.');
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
