import {
  getHealthResponse,
  type HealthDatabase,
} from '@/app/api/health/route';

describe('application health route', () => {
  it('returns ready only after a successful database query', async () => {
    const queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    const database = { $queryRaw: queryRaw } as unknown as HealthDatabase;

    const response = await getHealthResponse(database);

    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({
      status: 'ready',
      database: 'connected',
    });
  });

  it('returns a non-cached 503 without exposing database errors', async () => {
    const databaseError = new Error('database-url-with-sensitive-details');
    const queryRaw = jest.fn().mockRejectedValue(databaseError);
    const database = { $queryRaw: queryRaw } as unknown as HealthDatabase;
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      const response = await getHealthResponse(database);
      const body = await response.json();

      expect(queryRaw).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(503);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(body).toEqual({ status: 'not_ready', database: 'unavailable' });
      expect(JSON.stringify(body)).not.toContain(databaseError.message);
      expect(consoleError).toHaveBeenCalledWith(
        'Application database readiness check failed.',
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});
