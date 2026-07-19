"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymongoSignature_1 = require("../middleware/paymongoSignature");
const ledgerService_1 = require("../services/ledgerService");
const router = (0, express_1.Router)();
router.post('/paymongo', paymongoSignature_1.verifyPaymongoSignature, async (req, res) => {
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
            await (0, ledgerService_1.postPaymentSuccess)(metadata.bookingId, event.data.id, // paymongoIntentId as Idempotency Key
            totalPaid, platformFee, providerShare, depositAmount);
        }
        res.status(200).send('Webhook processed');
    }
    catch (error) {
        console.error('Webhook processing failed:', error);
        // Always return 200 to prevent webhook retries on our business logic errors, 
        // unless it is a transient DB connection issue.
        res.status(200).send('Webhook acknowledged with errors');
    }
});
exports.default = router;
