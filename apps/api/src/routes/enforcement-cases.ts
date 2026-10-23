import { Router } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth';
import { ProhibitedItemsService } from '../../../../src/lib/prohibited-items/prohibited-items.service';
import { PrismaClient } from '@prisma/client';
import { handleDomainError } from '../utils/errors';
import { SECURITY_PERMISSIONS } from '../../../../src/lib/security/permissions';

const prisma = new PrismaClient();
const router = Router();

router.get('/', requireAuth, requirePermission(SECURITY_PERMISSIONS.PROHIBITED_ITEMS_REVIEW_LISTING), async (req, res) => {
  try {
    const cases = await prisma.listingEnforcementCase.findMany({
      include: {
        evaluation: true,
        policy: true,
      },
      orderBy: { created_at: 'desc' },
    });
    res.status(200).json(cases);
  } catch (error: unknown) {
    handleDomainError(error, res);
  }
});

router.post('/:id/resolve', requireAuth, requirePermission(SECURITY_PERMISSIONS.PROHIBITED_ITEMS_REVIEW_LISTING), async (req, res) => {
  try {
    const { status, resolution } = req.body;
    if (!status || !resolution) {
      return res.status(400).json({ error: 'Missing status or resolution' });
    }
    const updated = await ProhibitedItemsService.resolveEnforcementCase(
      req.params.id,
      req.user!.id,
      resolution,
      status
    );
    res.status(200).json(updated);
  } catch (error: unknown) {
    handleDomainError(error, res);
  }
});

export default router;
