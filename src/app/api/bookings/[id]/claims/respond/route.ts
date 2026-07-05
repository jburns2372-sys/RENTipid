import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: bookingId } = await params;

    const formData = await req.formData();
    const action = formData.get('action'); // "ACCEPT" or "REJECT"
    const renterResponse = formData.get('renter_response') as string;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { damageClaims: { where: { claim_status: 'Submitted' } } }
    });

    if (!booking || booking.renter_id !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const claim = booking.damageClaims[0];
    if (!claim) {
      return NextResponse.json({ message: 'Active claim not found' }, { status: 404 });
    }

    if (action === 'REJECT') {
      // Create Dispute Case
      await prisma.$transaction(async (tx) => {
        await tx.damageClaim.update({
          where: { id: claim.id },
          data: {
            claim_status: 'Under Admin Review',
            renter_response: renterResponse
          }
        });

        await tx.disputeCase.create({
          data: {
            booking_id: bookingId,
            damage_claim_id: claim.id,
            opened_by: userId,
            dispute_type: 'Damage Claim',
            dispute_status: 'Under Review',
            summary: `Renter rejected Damage Claim ${claim.claim_number}`,
            provider_statement: claim.claim_description,
            renter_statement: renterResponse
          }
        });
      });

      await createAuditLog({
        actor_user_id: userId,
        action: 'DAMAGE_CLAIM_REJECTED',
        module: 'DamageClaim',
        target_id: claim.id,
        details: `Renter rejected claim ${claim.claim_number} and opened a dispute`
      });

      // Notify Provider & Admin
      await prisma.notification.create({
        data: {
          user_id: booking.provider_id,
          title: 'Claim Rejected',
          message: `Renter rejected your damage claim. The case has been escalated to Admin review.`,
          type: 'Dispute'
        }
      });

    } else if (action === 'ACCEPT') {
      // Auto-approve the deduction
      await prisma.$transaction(async (tx) => {
        await tx.damageClaim.update({
          where: { id: claim.id },
          data: {
            claim_status: 'Approved',
            renter_response: renterResponse,
            approved_deduction_amount: claim.requested_deduction_amount,
            decided_by: userId, // Renter accepted it themselves
            decided_at: new Date()
          }
        });

        await tx.depositAction.create({
          data: {
            booking_id: bookingId,
            action_type: 'Deduct Partial', // Or Full depending on amount
            amount: claim.requested_deduction_amount,
            reason: `Renter accepted deduction for Claim ${claim.claim_number}`,
            performed_by: 'SYSTEM'
          }
        });

        await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'Completed', completed_at: new Date() }
        });

        await tx.bookingStatusHistory.create({
          data: {
            booking_id: bookingId,
            old_status: 'Disputed',
            new_status: 'Completed',
            changed_by: userId,
            notes: 'Renter accepted the damage claim. Booking completed.'
          }
        });
      });

      await createAuditLog({
        actor_user_id: userId,
        action: 'DAMAGE_CLAIM_ACCEPTED',
        module: 'DamageClaim',
        target_id: claim.id,
        details: `Renter accepted claim ${claim.claim_number}`
      });
      
      await prisma.notification.create({
        data: {
          user_id: booking.provider_id,
          title: 'Claim Accepted',
          message: `Renter accepted your damage claim. The deduction has been approved.`,
          type: 'Claim'
        }
      });
    }

    return NextResponse.redirect(new URL(`/dashboard/renter/bookings/${bookingId}/claims`, req.url));

  } catch (error) {
    console.error('Claim Response API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
