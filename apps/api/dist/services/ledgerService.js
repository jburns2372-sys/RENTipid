"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postPaymentSuccess = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Phase 7: Immutable Double-Entry Financial Ledger
const postPaymentSuccess = async (bookingId, paymongoIntentId, totalPaid, platformFee, providerShare, depositAmount) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Idempotency Check to prevent duplicate posting
        const existingLedger = await tx.financeLedger.findFirst({
            where: { transaction_reference: paymongoIntentId }
        });
        if (existingLedger) {
            console.log('Payment already posted to ledger. Skipping idempotent request.');
            return;
        }
        const booking = await tx.booking.findUnique({
            where: { id: bookingId },
            include: { listing: true }
        });
        if (!booking)
            throw new Error('Booking not found');
        // 2. Update Booking Status
        await tx.booking.update({
            where: { id: bookingId },
            data: { status: 'PAID' }
        });
        // 3. Post to Ledger
        await tx.financeLedger.create({
            data: {
                booking_id: bookingId,
                user_id: booking.renter_id,
                provider_id: booking.listing.provider_id,
                transaction_reference: paymongoIntentId,
                total_amount: totalPaid,
                platform_fee: platformFee,
                provider_payable: providerShare,
                deposit_held: depositAmount,
                transaction_type: 'PAYMENT_SUCCESS',
                status: 'CLEARED'
            }
        });
    });
};
exports.postPaymentSuccess = postPaymentSuccess;
