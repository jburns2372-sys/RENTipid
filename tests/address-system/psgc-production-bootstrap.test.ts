import {
  assertProductionDatabaseIdentity,
  buildPsgcRows,
  insertPsgcRows,
  bootstrapProductionPsgc,
  QUEZON_CITY_PSGC_CODE,
  type PsgcClient,
  type PsgcSourceEntry,
  type PsgcSubdivisionRow,
} from '@/lib/address/psgc-bulk-bootstrap';

function client(overrides: Partial<PsgcClient> = {}): PsgcClient {
  return {
    $queryRawUnsafe: jest.fn(),
    psgcSubdivision: {
      count: jest.fn(),
      findUnique: jest.fn(),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    ...overrides,
  };
}

describe('Production PSGC bulk bootstrap', () => {
  test('requires an explicitly confirmed Production database identity', () => {
    const options = {
      databaseUrl: 'postgresql://user:secret@db.example/rentipid_prod',
      expectedDatabase: 'rentipid_prod',
      confirmedDatabase: 'rentipid_prod',
      environment: 'production',
    };
    expect(() => assertProductionDatabaseIdentity(options, 'rentipid_prod')).not.toThrow();
    expect(() => assertProductionDatabaseIdentity(options, 'rentipid_preview')).toThrow(
      'Connected database identity does not match',
    );
    expect(() => assertProductionDatabaseIdentity(
      { ...options, expectedDatabase: 'rentipid_preview', confirmedDatabase: 'rentipid_preview' },
      'rentipid_preview',
    )).toThrow('not an authorized Production target');
  });

  test('builds a deterministic canonical hierarchy with 142 Quezon City barangays', () => {
    const region = { code: '1300000000', name: 'National Capital Region' };
    const city = { code: QUEZON_CITY_PSGC_CODE, name: 'Quezon City', region: { code: region.code } };
    const barangays: PsgcSourceEntry[] = Array.from({ length: 142 }, (_, index) => ({
      code: '13813' + String(index + 1).padStart(5, '0'),
      name: index === 138 ? 'Batasan Hills' : 'Barangay ' + (index + 1),
      city_municipality: { code: QUEZON_CITY_PSGC_CODE },
    }));
    const rows = buildPsgcRows({
      regions: [region], provinces: [], cities: [city], municipalities: [], barangays,
    });
    expect(rows.filter((row) => row.parentPsgcCode === QUEZON_CITY_PSGC_CODE)).toHaveLength(142);
    expect(rows.find((row) => row.psgcCode === QUEZON_CITY_PSGC_CODE)).toMatchObject({
      geographicLevel: 'CITY',
      parentPsgcCode: '1300000000',
    });
  });

  test('uses retry-safe batches and never performs serial upserts', async () => {
    const createMany = jest.fn().mockResolvedValue({ count: 0 });
    const mockClient = client({
      psgcSubdivision: { count: jest.fn(), findUnique: jest.fn(), createMany },
    });
    const rows: PsgcSubdivisionRow[] = Array.from({ length: 1001 }, (_, index) => ({
      psgcCode: String(index).padStart(10, '0'),
      name: 'Barangay ' + index,
      geographicLevel: 'BARANGAY',
      parentPsgcCode: QUEZON_CITY_PSGC_CODE,
      isActive: true,
      source: 'PSGC_CLOUD',
      sourceVersion: 'test',
      syncedAt: new Date(0),
    }));
    await insertPsgcRows(mockClient, rows);
    expect(createMany).toHaveBeenCalledTimes(3);
    expect(createMany).toHaveBeenCalledWith(expect.objectContaining({ skipDuplicates: true }));
  });

  test('is idempotent and makes no network request when the registry is ready', async () => {
    const counts = [17, 1600, 40000, 142];
    const mockClient = client({
      psgcSubdivision: {
        count: jest.fn().mockImplementation(() => Promise.resolve(counts.shift() ?? 0)),
        findUnique: jest.fn()
          .mockResolvedValueOnce({
            name: 'Quezon City', geographicLevel: 'CITY', parentPsgcCode: '1300000000', isActive: true,
          })
          .mockResolvedValueOnce({
            name: 'Batasan Hills', geographicLevel: 'BARANGAY',
            parentPsgcCode: QUEZON_CITY_PSGC_CODE, isActive: true,
          }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    });
    const fetcher = jest.fn();
    await expect(
      bootstrapProductionPsgc(mockClient, fetcher as unknown as typeof fetch),
    ).resolves.toMatchObject({ status: 'already-ready', networkRequests: 0 });
    expect(fetcher).not.toHaveBeenCalled();
    expect(mockClient.psgcSubdivision.createMany).not.toHaveBeenCalled();
  });
});
