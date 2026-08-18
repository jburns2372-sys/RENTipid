import { Router } from 'express';
import { verifyPaymongoSignature } from '../middleware/paymongoSignature';
import { processWebhookEvent } from '../../../../src/lib/payments/payment-webhook-service';

const router = Router();

router.post('/paymongo', verifyPaymongoSignature, async (req, res) => {
  try {
    const payload = req.body;
    const signature = req.headers['paymongo-signature'] as string;
    
    // Pass everything strictly to the service to enforce database idempotency,
    // amount matching, and escrow logging without redundant DB queries here.
    const eventType = payload?.data?.attributes?.type || 'unknown';
    
    // Do NOT parse PANs or CVVs. The payload goes in directly as received.
    await processWebhookEvent('PayMongo', eventType, payload, signature);

    res.status(200).send('Webhook processed');
  } catch (error: unknown) {
    console.error('Webhook processing failed:', error);
    // Always return 200 to prevent webhook retries on our business logic errors, 
    // unless it is a transient DB connection issue.
    res.status(200).send('Webhook acknowledged with errors');
  }
});

export default router;
