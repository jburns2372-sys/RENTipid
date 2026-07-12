import { Router } from 'express';
import { verifyPaymongoSignature } from '../middleware/paymongoSignature';
import { postPaymentSuccess } from '../services/ledgerService';

const router = Router();

router.post('/paymongo', verifyPaymongoSignature, async (req, res) => {
  try {
    const event = req.body;

    // Idempotent webhook processing
    if (event.data.attributes.type === 'payment.paid') {
      const paymentIntent = event.data.attributes.data.attributes;
      const metadata = paymentIntent.metadata;
      
      // Platform fee logic (e.g., 10%)
      const totalPaid = paymentIntent.amount / 100;
      const depositAmount = metadata?.depositAmount ? parseFloat(metadata.depositAmount) : 0;
      const baseRental = totalPaid - depositAmount;
      const platformFee = baseRental * 0.10;
      const providerShare = baseRental - platformFee;

      await postPaymentSuccess(
        metadata.bookingId,
        event.data.id, // paymongoIntentId as Idempotency Key
        totalPaid,
        platformFee,
        providerShare,
        depositAmount
      );
    }

    res.status(200).send('Webhook processed');
  } catch (error: any) {
    console.error('Webhook processing failed:', error);
    // Always return 200 to prevent webhook retries on our business logic errors, 
    // unless it is a transient DB connection issue.
    res.status(200).send('Webhook acknowledged with errors');
  }
});

export default router;