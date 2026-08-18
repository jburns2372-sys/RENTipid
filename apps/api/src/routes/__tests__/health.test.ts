import type { Request, Response } from 'express';
import {
  createReadinessHandler,
  type ReadinessDatabase,
} from '../health';

function createResponse() {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
}

describe('Azure API readiness', () => {
  it('reports ready only after the database answers a real query', async () => {
    const queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    const database = { $queryRaw: queryRaw } as unknown as ReadinessDatabase;
    const response = createResponse();

    await createReadinessHandler(database)(
      {} as Request,
      response as unknown as Response,
      jest.fn(),
    );

    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      status: 'ready',
      database: 'connected',
    });
  });

  it('fails closed without exposing the database error', async () => {
    const databaseError = new Error('database-url-with-sensitive-details');
    const queryRaw = jest.fn().mockRejectedValue(databaseError);
    const database = { $queryRaw: queryRaw } as unknown as ReadinessDatabase;
    const response = createResponse();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      await createReadinessHandler(database)(
        {} as Request,
        response as unknown as Response,
        jest.fn(),
      );

      expect(queryRaw).toHaveBeenCalledTimes(1);
      expect(response.status).toHaveBeenCalledWith(503);
      expect(response.json).toHaveBeenCalledWith({
        status: 'not_ready',
        database: 'unavailable',
      });
      expect(consoleError).toHaveBeenCalledWith('Database readiness check failed.');
      expect(JSON.stringify(response.json.mock.calls)).not.toContain(databaseError.message);
    } finally {
      consoleError.mockRestore();
    }
  });
});
