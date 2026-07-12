import { Router } from 'express';
const router = Router();

// Used by Azure Container Apps to verify the container is alive
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Used by Azure Container Apps to verify the container can accept traffic (e.g. DB connected)
router.get('/ready', async (req, res) => {
  // TODO: Add actual Prisma DB check here
  res.status(200).json({ status: 'ready', database: 'connected' });
});

export default router;