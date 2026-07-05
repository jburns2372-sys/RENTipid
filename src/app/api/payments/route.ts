import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const formData = await req.formData();
    const booking_id = formData.get('booking_id') as string;
    const payment_method = formData.get('payment_method') as string;

    const booking = await prisma.booking.findUnique({
      where: { id: booking_id },
      include: { listing: true, rentalAgreement: true }
    });

    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    if (booking.renter_id !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (booking.status !== 'Approved' || booking.payment_status !== 'Pending Payment') {
      return NextResponse.json({ message: 'Booking is not ready for payment' }, { status: 400 });
    }

    if (!booking.rentalAgreement?.accepted_by_renter) {
      return NextResponse.json({ message: 'Agreement not accepted' }, { status: 400 });
    }

    // Mathematical breakdown
    const totalAmount = booking.estimated_total_amount;
    const depositAmount = booking.deposit_amount;
    const baseRental = booking.base_rental_amount + (booking.delivery_fee || 0);

    // Fetch Platform Fee % from System Settings, default 10%
    let platformFeePct = 10;
    const feeSetting = await prisma.systemSettings.findUnique({ where: { key: 'PLATFORM_FEE_PCT' } });
    if (feeSetting) {
      platformFeePct = parseFloat(feeSetting.value);
    } else {
      await prisma.systemSettings.create({ data: { key: 'PLATFORM_FEE_PCT', value: '10', description: 'Platform fee percentage' } });
    }

    const platformFeeAmount = baseRental * (platformFeePct / 100);
    const providerPayoutAmount = baseRental - platformFeeAmount;

    // Execute Transaction
    await prisma.$transaction(async (tx: any) => {
      // 1. Create Payment Record
      await tx.payment.create({
        data: {
          booking_id,
          user_id: userId,
          amount: totalAmount,
          payment_method: payment_method || 'Mock Gateway',
          status: 'Completed',
          type: 'Rental Payment',
          transaction_id: `txn_${Date.now()}`
        }
      });

      // 2. Ledger: Platform Fee
      if (platformFeeAmount > 0) {
        await tx.financeLedger.create({
          data: {
            booking_id,
            transaction_type: 'Platform Fee',
            amount: platformFeeAmount,
            balance_type: 'Credit',
            description: `Platform fee (${platformFeePct}%) for booking ${booking_id}`
          }
        });
      }

      // 3. Ledger: Escrow Deposit
      if (depositAmount > 0) {
        await tx.financeLedger.create({
          data: {
            user_id: booking.renter_id,
            booking_id,
            transaction_type: 'Escrow Deposit',
            amount: depositAmount,
            balance_type: 'Credit',
            description: `Security deposit held in escrow for booking ${booking_id}`
          }
        });
      }

      // 4. Ledger: Provider Payout (Pending)
      if (providerPayoutAmount > 0) {
        await tx.financeLedger.create({
          data: {
            user_id: booking.provider_id,
            booking_id,
            transaction_type: 'Provider Payout',
            amount: providerPayoutAmount,
            balance_type: 'Credit',
            description: `Provider payout for booking ${booking_id}`
          }
        });
      }

      // 5. Update Booking Status
      await tx.booking.update({
        where: { id: booking_id },
        data: {
          status: 'Confirmed',
          payment_status: 'Paid',
          platform_fee: platformFeeAmount
        }
      });

      // 6. Status History
      await tx.bookingStatusHistory.create({
        data: {
          booking_id,
          old_status: booking.status,
          new_status: 'Confirmed',
          changed_by: userId,
          notes: 'Payment completed successfully. Booking confirmed.'
        }
      });

      // 7. Notification
      await tx.notification.create({
        data: {
          user_id: booking.provider_id,
          title: 'Booking Confirmed!',
          message: `Renter has paid for ${booking.listing.title}. It is now Confirmed.`,
          type: 'Booking Status Updated'
        }
      });
    });

    await createAuditLog({
      actor_user_id: userId,
      action: 'PAYMENT_COMPLETED',
      module: 'Finance',
      target_id: booking_id,
      details: `Paid ₱${totalAmount} via ${payment_method || 'Mock Gateway'}`
    });

    return NextResponse.redirect(new URL(`/dashboard/renter/bookings/${booking_id}`, req.url));

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
