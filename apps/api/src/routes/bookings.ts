import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createBookingHold } from '../services/bookingService';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  try {
    const { listingId, startDate, endDate, quantity } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const booking = await createBookingHold(
      req.user.id,
      listingId,
      new Date(startDate),
      new Date(endDate),
      quantity || 1
    );

    res.status(201).json(booking);
  } catch (error: any) {
    // Prevent leaking internal DB errors, but return actionable conflict errors
    res.status(409).json({ error: error.message });
  }
});

export default router;