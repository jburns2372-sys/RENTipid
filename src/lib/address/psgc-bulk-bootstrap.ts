const PSGC_API_BASE = 'https://psgc.cloud/api';

export const PSGC_SOURCE = 'PSGC_CLOUD';
export const PSGC_SOURCE_VERSION = 'PSA_PSGC_Q2_2026';
export const QUEZON_CITY_PSGC_CODE = '1381300000';
export const QUEZON_CITY_BARANGAY_COUNT = 142;
export const BATASAN_HILLS_PSGC_CODE = '1381300139';
export const PSGC_BATCH_SIZE = 500;

const PROTECTED_DATABASES = new Set([
  'postgres', 'template0', 'template1', 'rentipid_preview', 'rentipid_address_local', 'rentipid_test',
]);

type GeographicLevel = 'REGION' | 'PROVINCE' | 'CITY' | 'MUNICIPALITY' | 'BARANGAY';

export interface PsgcSourceEntry {
  code: string;
  name: string;
  region?: { code?: string };
  province?: { code?: string };
  city_municipality?: { code?: string };
  cityMunicipality?: { code?: string };
}

export interface PsgcSourceRegistry {
  regions: PsgcSourceEntry[];
  provinces: PsgcSourceEntry[];
  cities: PsgcSourceEntry[];
  municipalities: PsgcSourceEntry[];
  barangays: PsgcSourceEntry[];
}

export interface PsgcSubdivisionRow {
  psgcCode: string;
  name: string;
  geographicLevel: GeographicLevel;
  parentPsgcCode: string | null;
  isActive: boolean;
  source: string;
  sourceVersion: string;
  syncedAt: Date;
}

export interface PsgcClient {
  $queryRawUnsafe<T>(query: string): Promise<T>;
  psgcSubdivision: {
    count(args: { where: Record<string, unknown> }): Promise<number>;
    findUnique(args: { where: { psgcCode: string } }): Promise<{
      name: string;
      geographicLevel: string;
      parentPsgcCode: string | null;
      isActive: boolean;
    } | null>;
    createMany(args: { data: PsgcSubdivisionRow[]; skipDuplicates: boolean }): Promise<{ count: number }>;
  };
}

export interface ProductionIdentityOptions {
  databaseUrl: string;
  expectedDatabase: string;
  confirmedDatabase: string;
  environment: string;
}

export interface BootstrapResult {
  status: 'already-ready' | 'populated';
  barangayCount: number;
  networkRequests: number;
}

function databaseName(databaseUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error('SAFETY: DATABASE_URL is not a valid URL.');
  }
  const name = decodeURIComponent(parsed.pathname.replace(/^\//, '')).trim();
  if (!name) throw new Error('SAFETY: DATABASE_URL does not identify a database.');
  return name;
}

export function assertProductionDatabaseIdentity(
  options: ProductionIdentityOptions,
  actualDatabase: string,
): void {
  if (options.environment !== 'production') {
    throw new Error('SAFETY: --environment=production is required.');
  }
  if (!options.expectedDatabase || options.expectedDatabase !== options.confirmedDatabase) {
    throw new Error('SAFETY: Expected and confirmed database names must match.');
  }
  if (PROTECTED_DATABASES.has(options.expectedDatabase)) {
    throw new Error('SAFETY: Database is not an authorized Production target.');
  }
  if (databaseName(options.databaseUrl) !== options.expectedDatabase) {
    throw new Error('SAFETY: DATABASE_URL database name does not match --expected-db.');
  }
  if (actualDatabase !== options.expectedDatabase) {
    throw new Error('SAFETY: Connected database identity does not match --expected-db.');
  }
}

function makeRow(
  entry: PsgcSourceEntry,
  geographicLevel: GeographicLevel,
  parentPsgcCode: string | null,
  syncedAt: Date,
): PsgcSubdivisionRow {
  return {
    psgcCode: entry.code,
    name: entry.name.trim(),
    geographicLevel,
    parentPsgcCode,
    isActive: true,
    source: PSGC_SOURCE,
    sourceVersion: PSGC_SOURCE_VERSION,
    syncedAt,
  };
}

function assertUniqueCodes(rows: PsgcSubdivisionRow[]): void {
  const codes = new Set<string>();
  for (const row of rows) {
    if (!/^\d{10}$/.test(row.psgcCode) || !row.name) {
      throw new Error('PSGC source contains an invalid entry.');
    }
    if (codes.has(row.psgcCode)) {
      throw new Error('PSGC source contains a duplicate code.');
    }
    codes.add(row.psgcCode);
  }
}

export function buildPsgcRows(
  registry: PsgcSourceRegistry,
  syncedAt = new Date(),
): PsgcSubdivisionRow[] {
  const regionCodes = new Set(registry.regions.map((entry) => entry.code));
  const provinceCodes = new Set(registry.provinces.map((entry) => entry.code));
  const localityCodes = new Set([
    ...registry.cities.map((entry) => entry.code),
    ...registry.municipalities.map((entry) => entry.code),
  ]);

  const regions = registry.regions.map((entry) => makeRow(entry, 'REGION', null, syncedAt));
  const provinces = registry.provinces.map((entry) => {
    const parent = entry.region?.code || entry.code.slice(0, 2) + '00000000';
    return makeRow(entry, 'PROVINCE', regionCodes.has(parent) ? parent : null, syncedAt);
  });
  const localities = [
    ...registry.cities.map((entry) => ({ entry, level: 'CITY' as const })),
    ...registry.municipalities.map((entry) => ({ entry, level: 'MUNICIPALITY' as const })),
  ].map(({ entry, level }) => {
    const province = entry.province?.code || entry.code.slice(0, 4) + '000000';
    const region = entry.region?.code || entry.code.slice(0, 2) + '00000000';
    const parent = provinceCodes.has(province) ? province : regionCodes.has(region) ? region : null;
    return makeRow(entry, level, parent, syncedAt);
  });
  const barangays = registry.barangays.map((entry) => {
    const parent = entry.city_municipality?.code || entry.cityMunicipality?.code || null;
    if (!parent || !localityCodes.has(parent)) {
      throw new Error('PSGC barangay has no valid city or municipality parent.');
    }
    return makeRow(entry, 'BARANGAY', parent, syncedAt);
  });

  const result = [...regions, ...provinces, ...localities, ...barangays]
    .sort((left, right) => left.psgcCode.localeCompare(right.psgcCode));
  assertUniqueCodes(result);
  return result;
}

export function validateCanonicalRegistry(registry: PsgcSourceRegistry): void {
  if (
    registry.regions.length < 17 || registry.provinces.length < 80 || registry.cities.length < 140 ||
    registry.cities.length + registry.municipalities.length < 1600 || registry.barangays.length < 40000
  ) {
    throw new Error('PSGC upstream returned an incomplete registry.');
  }
  if (!registry.cities.some((entry) => entry.code === QUEZON_CITY_PSGC_CODE)) {
    throw new Error('PSGC upstream does not contain canonical Quezon City.');
  }
  const qcBarangays = registry.barangays.filter((entry) =>
    (entry.city_municipality?.code || entry.cityMunicipality?.code) === QUEZON_CITY_PSGC_CODE
  );
  if (qcBarangays.length !== QUEZON_CITY_BARANGAY_COUNT) {
    throw new Error('PSGC upstream does not contain exactly 142 Quezon City barangays.');
  }
}

export async function insertPsgcRows(client: PsgcClient, rows: PsgcSubdivisionRow[]): Promise<void> {
  const levels: GeographicLevel[][] = [['REGION'], ['PROVINCE'], ['CITY', 'MUNICIPALITY'], ['BARANGAY']];
  for (const group of levels) {
    const data = rows.filter((row) => group.includes(row.geographicLevel));
    for (let offset = 0; offset < data.length; offset += PSGC_BATCH_SIZE) {
      await client.psgcSubdivision.createMany({
        data: data.slice(offset, offset + PSGC_BATCH_SIZE),
        skipDuplicates: true,
      });
    }
  }
}

export async function psgcRegistryReady(client: PsgcClient): Promise<boolean> {
  const [regions, localities, barangays, qcBarangays, quezonCity, batasan] = await Promise.all([
    client.psgcSubdivision.count({ where: { geographicLevel: 'REGION', isActive: true } }),
    client.psgcSubdivision.count({ where: { geographicLevel: { in: ['CITY', 'MUNICIPALITY'] }, isActive: true } }),
    client.psgcSubdivision.count({ where: { geographicLevel: 'BARANGAY', isActive: true } }),
    client.psgcSubdivision.count({ where: {
      parentPsgcCode: QUEZON_CITY_PSGC_CODE, geographicLevel: 'BARANGAY', isActive: true,
    } }),
    client.psgcSubdivision.findUnique({ where: { psgcCode: QUEZON_CITY_PSGC_CODE } }),
    client.psgcSubdivision.findUnique({ where: { psgcCode: BATASAN_HILLS_PSGC_CODE } }),
  ]);
  return regions >= 17 && localities >= 1600 && barangays >= 40000 &&
    qcBarangays === QUEZON_CITY_BARANGAY_COUNT && quezonCity?.geographicLevel === 'CITY' &&
    quezonCity.isActive && batasan?.name === 'Batasan Hills' &&
    batasan.parentPsgcCode === QUEZON_CITY_PSGC_CODE && batasan.isActive;
}

async function fetchPsgcList(path: string, fetcher: typeof fetch, attempts = 8): Promise<PsgcSourceEntry[]> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetcher(PSGC_API_BASE + path, { signal: AbortSignal.timeout(120000) });
      if (!response.ok) throw new Error('PSGC request failed with HTTP ' + response.status + '.');
      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error('PSGC response was not an array.');
      return data as PsgcSourceEntry[];
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, Math.min(15000, 500 * (2 ** attempt))));
      }
    }
  }
  throw lastError;
}

export async function bootstrapProductionPsgc(
  client: PsgcClient,
  fetcher: typeof fetch = fetch,
): Promise<BootstrapResult> {
  if (await psgcRegistryReady(client)) {
    return { status: 'already-ready', barangayCount: 40000, networkRequests: 0 };
  }
  const paths = ['/regions', '/provinces', '/cities', '/municipalities', '/v2/barangays'] as const;
  const [regions, provinces, cities, municipalities, barangays] = await Promise.all(
    paths.map((path) => fetchPsgcList(path, fetcher)),
  );
  const registry = { regions, provinces, cities, municipalities, barangays };
  validateCanonicalRegistry(registry);
  await insertPsgcRows(client, buildPsgcRows(registry));
  if (!(await psgcRegistryReady(client))) {
    throw new Error('PSGC registry verification failed after bulk population.');
  }
  return { status: 'populated', barangayCount: barangays.length, networkRequests: paths.length };
}
