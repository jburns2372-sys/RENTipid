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
    const userRole = (session.user as any).role;
    
    if (userRole !== 'Admin' && userRole !== 'Super Admin' && userRole !== 'Compliance Officer') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id: disputeId } = await params;
    const formData = await req.formData();
    const action = formData.get('action') as string; // APPROVE_FULL, APPROVE_PARTIAL, REJECT
    const adminNotes = formData.get('admin_notes') as string;
    const partialAmountStr = formData.get('partial_amount') as string;

    const dispute = await prisma.disputeCase.findUnique({
      where: { id: disputeId },
      include: { damage_claim: true, booking: true }
    });

    if (!dispute || !dispute.damage_claim) {
      return NextResponse.json({ message: 'Dispute or Claim not found' }, { status: 404 });
    }

    if (dispute.dispute_status === 'Resolved') {
      return NextResponse.json({ message: 'Dispute already resolved' }, { status: 400 });
    }

    let approvedDeduction = 0;
    let finalDecision = '';
    let claimStatus = '';
    let actionType = '';

    if (action === 'APPROVE_FULL') {
      approvedDeduction = dispute.damage_claim.requested_deduction_amount;
      finalDecision = 'Admin approved full requested deduction.';
      claimStatus = 'Approved';
      actionType = 'Deduct Partial'; // Still 'Partial' from the perspective of the whole deposit, or could be 'Deduct Full' if it equals deposit_amount
    } else if (action === 'APPROVE_PARTIAL') {
      approvedDeduction = parseFloat(partialAmountStr);
      if (isNaN(approvedDeduction) || approvedDeduction <= 0 || approvedDeduction > dispute.damage_claim.requested_deduction_amount) {
        return NextResponse.json({ message: 'Invalid partial amount' }, { status: 400 });
      }
      finalDecision = `Admin approved partial deduction of ₱${approvedDeduction.toLocaleString()}.`;
      claimStatus = 'Partially Approved';
      actionType = 'Deduct Partial';
    } else if (action === 'REJECT') {
      approvedDeduction = 0;
      finalDecision = 'Admin rejected the claim. Full deposit to be released to renter.';
      claimStatus = 'Rejected';
      actionType = 'Release Full';
    } else {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    // Wrap in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update Dispute
      await tx.disputeCase.update({
        where: { id: disputeId },
        data: {
          dispute_status: 'Resolved',
          final_decision: finalDecision,
          admin_notes: adminNotes,
          decided_by: userId,
          decided_at: new Date()
        }
      });

      // 2. Update Claim
      await tx.damageClaim.update({
        where: { id: dispute.damage_claim!.id },
        data: {
          claim_status: claimStatus,
          approved_deduction_amount: approvedDeduction,
          decided_by: userId,
          decided_at: new Date()
        }
      });

      // 3. Create Deposit Action
      await tx.depositAction.create({
        data: {
          booking_id: dispute.booking_id,
          action_type: actionType,
          amount: action === 'REJECT' ? dispute.damage_claim!.deposit_amount : approvedDeduction,
          reason: `Admin Dispute Decision: ${finalDecision}`,
          performed_by: userId
        }
      });

      // If Partial Deduction, log the remaining release
      if (action !== 'REJECT' && approvedDeduction < dispute.damage_claim!.deposit_amount) {
        await tx.depositAction.create({
          data: {
            booking_id: dispute.booking_id,
            action_type: 'Release Partial',
            amount: dispute.damage_claim!.deposit_amount - approvedDeduction,
            reason: `Admin Dispute Decision: Refunding remaining deposit after partial deduction.`,
            performed_by: userId
          }
        });
      }

      // 4. Update Booking to Completed
      await tx.booking.update({
        where: { id: dispute.booking_id },
        data: { status: 'Completed', completed_at: new Date() }
      });

      // 5. Booking Status History
      await tx.bookingStatusHistory.create({
        data: {
          booking_id: dispute.booking_id,
          old_status: 'Disputed',
          new_status: 'Completed',
          changed_by: userId,
          notes: finalDecision
        }
      });
    });

    await createAuditLog({
      actor_user_id: userId,
      action: 'DISPUTE_RESOLVED',
      module: 'DisputeCase',
      target_id: disputeId,
      details: finalDecision
    });

    // Notifications
    await prisma.notification.createMany({
      data: [
        {
          user_id: dispute.booking.provider_id,
          title: 'Dispute Resolved',
          message: `Admin has resolved Dispute ${disputeId}. Decision: ${finalDecision}`,
          type: 'Dispute'
        },
        {
          user_id: dispute.booking.renter_id,
          title: 'Dispute Resolved',
          message: `Admin has resolved Dispute ${disputeId}. Decision: ${finalDecision}`,
          type: 'Dispute'
        }
      ]
    });

    return NextResponse.redirect(new URL(`/dashboard/admin/disputes/${disputeId}`, req.url));

  } catch (error) {
    console.error('Admin Dispute Resolve API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
