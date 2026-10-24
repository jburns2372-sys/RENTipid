import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { ListingService } from '../services/listingService';

const router = Router();

// Draft creation
router.post('/', requireAuth, async (req, res) => {
  try {
    const listing = await ListingService.createDraft(req.user!.id, req.body);
    res.status(201).json(listing);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(403).json({ error: error.message });
    res.status(400).json({ error: error.message });
  }
});

// Read provider-owned listing
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const listing = await ListingService.getListing(req.params.id, req.user!.id);
    res.status(200).json(listing);
  } catch (error: any) {
    if (error.message === 'Not found') return res.status(404).json({ error: error.message });
    if (error.message === 'Unauthorized') return res.status(403).json({ error: error.message });
    res.status(400).json({ error: error.message });
  }
});

// Update listing draft
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const listing = await ListingService.updateDraft(req.params.id, req.user!.id, req.body);
    res.status(200).json(listing);
  } catch (error: any) {
    if (error.message === 'Not found') return res.status(404).json({ error: error.message });
    if (error.message === 'Unauthorized') return res.status(403).json({ error: error.message });
    res.status(400).json({ error: error.message });
  }
});

// Submit listing for approval
router.post('/:id/submit', requireAuth, async (req, res) => {
  try {
    const listing = await ListingService.submitListing(req.params.id, req.user!.id);
    res.status(200).json(listing);
  } catch (error: any) {
    if (error.message === 'Not found') return res.status(404).json({ error: error.message });
    if (error.message === 'Unauthorized') return res.status(403).json({ error: error.message });
    res.status(400).json({ error: error.message });
  }
});


// Withdraw listing
router.post('/:id/withdraw', requireAuth, async (req, res) => {
  try {
    const listing = await ListingService.withdrawListing(req.params.id, req.user!.id);
    res.status(200).json(listing);
  } catch (error: any) {
    if (error.message === 'Not found') return res.status(404).json({ error: error.message });
    if (error.message === 'Unauthorized') return res.status(403).json({ error: error.message });
    res.status(400).json({ error: error.message });
  }
});

// Admin Review Queue
router.get('/admin/review-queue', requireAuth, requireAdmin, async (req, res) => {
  try {
    const queue = await ListingService.getReviewQueue(req.user!.id);
    res.status(200).json(queue);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Admin Approve
router.post('/admin/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const listing = await ListingService.approveListing(req.params.id, req.user!.id);
    res.status(200).json(listing);
  } catch (error: any) {
    if (error.message === 'Not found') return res.status(404).json({ error: error.message });
    res.status(400).json({ error: error.message });
  }
});

// Admin Reject
router.post('/admin/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const listing = await ListingService.rejectListing(req.params.id, req.user!.id, req.body.reason || 'Rejected by admin');
    res.status(200).json(listing);
  } catch (error: any) {
    if (error.message === 'Not found') return res.status(404).json({ error: error.message });
    res.status(400).json({ error: error.message });
  }
});

// Admin Publish
router.post('/admin/:id/publish', requireAuth, requireAdmin, async (req, res) => {
  try {
    const listing = await ListingService.publishListing(req.params.id, req.user!.id);
    res.status(200).json(listing);
  } catch (error: any) {
    if (error.message === 'Not found') return res.status(404).json({ error: error.message });
    res.status(400).json({ error: error.message });
  }
});

// Admin Unpublish
router.post('/admin/:id/unpublish', requireAuth, requireAdmin, async (req, res) => {
  try {
    const listing = await ListingService.unpublishListing(req.params.id, req.user!.id);
    res.status(200).json(listing);
  } catch (error: any) {
    if (error.message === 'Not found') return res.status(404).json({ error: error.message });
    res.status(400).json({ error: error.message });
  }
});

export default router;

