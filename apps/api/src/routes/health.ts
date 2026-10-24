import { PrismaClient } from '@prisma/client';
import { RequestHandler, Router } from 'express';

export type ReadinessDatabase = Pick<PrismaClient, '$queryRaw'>;

const prisma = new PrismaClient();

export function createReadinessHandler(database: ReadinessDatabase): RequestHandler {
  return async (_req, res) => {
    try {
      await database.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ready', database: 'connected' });
    } catch {
      console.error('Database readiness check failed.');
      res.status(503).json({ status: 'not_ready', database: 'unavailable' });
    }
  };
}

const router = Router();

// Used by Azure Container Apps to verify the container is alive
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Used by Azure Container Apps to verify the container can accept traffic (e.g. DB connected)
router.get('/ready', createReadinessHandler(prisma));

export default router;
