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
    const user = session.user as any;
    const adminRole = user?.role;

    const userId = (session.user as any).id;
    const { id: bookingId } = await params;

    const formData = await req.formData();
    const action = formData.get('action') as string;
    const reason = formData.get('reason') as string;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true }
    });

    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    const isRenter = booking.renter_id === userId;
    const isProvider = booking.provider_id === userId;

    if (!isRenter && !isProvider) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    let newStatus = '';
    let statusNotes = '';
    let notificationTarget = '';

    // Action Logic
    switch (action) {
      case 'CANCEL_BY_RENTER':
        if (!isRenter) return NextResponse.json({ message: 'Only renter can cancel' }, { status: 403 });
        if (!['Pending Provider Approval', 'Approved', 'Pending Payment'].includes(booking.status)) {
          return NextResponse.json({ message: 'Cannot cancel at this stage' }, { status: 400 });
        }
        newStatus = 'Cancelled by Renter';
        statusNotes = 'Renter cancelled the request';
        notificationTarget = booking.provider_id;
        break;

      case 'CANCEL_BY_PROVIDER':
        if (!isProvider) return NextResponse.json({ message: 'Only provider can cancel' }, { status: 403 });
        if (booking.status === 'Ongoing' || booking.status === 'Completed' || booking.status === 'Returned' || booking.status.includes('Cancelled') || booking.status === 'Rejected') {
          return NextResponse.json({ message: 'Cannot cancel at this stage' }, { status: 400 });
        }
        newStatus = 'Cancelled by Provider';
        statusNotes = reason ? `Cancelled: ${reason}` : 'Provider cancelled the booking';
        notificationTarget = booking.renter_id;
        break;

      case 'APPROVE':
        if (!isProvider) return NextResponse.json({ message: 'Only provider can approve' }, { status: 403 });
        if (booking.status !== 'Pending Provider Approval') {
          return NextResponse.json({ message: 'Booking is not pending approval' }, { status: 400 });
        }
        newStatus = 'Approved';
        statusNotes = 'Provider approved the booking';
        notificationTarget = booking.renter_id;
        
        // Generate Rental Agreement
        const agreementText = `RENTAL AGREEMENT\n\nThis agreement is made between the Provider and the Renter for the rental of "${booking.listing.title}".\n\nDates: ${booking.start_date.toLocaleDateString()} to ${booking.end_date.toLocaleDateString()}\nTotal Amount: ₱${booking.estimated_total_amount.toLocaleString()}\n\nBy accepting this agreement, the Renter agrees to the listing's rules, deposit policies, and platform terms.`;
        
        await prisma.rentalAgreement.create({
          data: {
            booking_id: bookingId,
            agreement_text: agreementText,
          }
        });
        
        // Advance payment status automatically
        await prisma.booking.update({
          where: { id: bookingId },
          data: { payment_status: 'Pending Payment' }
        });
        break;

      case 'REJECT':
        if (!isProvider) return NextResponse.json({ message: 'Only provider can reject' }, { status: 403 });
        if (booking.status !== 'Pending Provider Approval') {
          return NextResponse.json({ message: 'Booking is not pending approval' }, { status: 400 });
        }
        if (!reason) return NextResponse.json({ message: 'Rejection reason required' }, { status: 400 });
        newStatus = 'Rejected';
        statusNotes = reason;
        notificationTarget = booking.renter_id;
        break;

      case 'CONFIRM':
        if (!isProvider && adminRole !== 'Admin' && adminRole !== 'Super Admin' && adminRole !== 'Finance Admin') {
          return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }
        
        // Ensure booking payment is completed
        if (!['Paid Sandbox', 'Verified Paid', 'Payment Verified'].includes(booking.payment_status)) {
           // Allow legacy mock overrides for local dev, but strictly enforce in V1
           const setting = await prisma.systemSetting.findUnique({ where: { setting_key: 'payment_provider_mode' }});
           const activeMode = setting?.setting_value || process.env.PAYMENT_PROVIDER_MODE || 'mock';
           if (activeMode !== 'mock' && activeMode !== 'manual') {
              return NextResponse.json({ message: 'Cannot confirm: Payment is not verified yet.' }, { status: 400 });
           }
        }

        // Check if gateway transaction exists and is reconciled
        const tx = await prisma.gatewayTransaction.findFirst({
           where: { booking_id: booking.id },
           orderBy: { created_at: 'desc' }
        });
        
        if (tx && tx.reconciliation_status === 'Mismatch') {
           return NextResponse.json({ message: 'Cannot confirm: Gateway payment has a reconciliation mismatch. Manual Finance review required.' }, { status: 400 });
        }

        newStatus = 'Confirmed';
        statusNotes = 'Booking confirmed after payment validation';
        notificationTarget = booking.renter_id;
        break;

      case 'MARK_ONGOING':
        if (!isProvider) return NextResponse.json({ message: 'Only provider can mark ongoing' }, { status: 403 });
        if (booking.status !== 'Confirmed') return NextResponse.json({ message: 'Booking must be Confirmed first' }, { status: 400 });
        newStatus = 'Ongoing';
        statusNotes = 'Item handed over to renter';
        notificationTarget = booking.renter_id;
        break;

      case 'MARK_COMPLETED': // Phase 4 placeholder jumping straight to completed
        if (!isProvider) return NextResponse.json({ message: 'Only provider can mark completed' }, { status: 403 });
        if (booking.status !== 'Ongoing' && booking.status !== 'Returned') return NextResponse.json({ message: 'Booking must be Ongoing or Returned' }, { status: 400 });
        newStatus = 'Completed';
        statusNotes = 'Item returned and booking finalized';
        notificationTarget = booking.renter_id;
        break;

      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    const updateData: any = { status: newStatus };
    if (newStatus === 'Rejected') updateData.rejection_reason = reason;
    if (newStatus.includes('Cancelled') && reason) updateData.cancellation_reason = reason;

    // Apply mutation
    await prisma.booking.update({
      where: { id: bookingId },
      data: updateData
    });

    await prisma.bookingStatusHistory.create({
      data: {
        booking_id: bookingId,
        old_status: booking.status,
        new_status: newStatus,
        changed_by: userId,
        notes: statusNotes
      }
    });

    await createAuditLog({
      actor_user_id: userId,
      action: `BOOKING_${action}`,
      module: 'Booking',
      target_id: bookingId,
      details: statusNotes
    });

    if (notificationTarget) {
      await prisma.notification.create({
        data: {
          user_id: notificationTarget,
          title: `Booking Update: ${newStatus}`,
          message: `Booking for ${booking.listing.title} has been updated to ${newStatus}.`,
          type: 'Booking Status Updated'
        }
      });
    }

    // Redirect to sender's dashboard
    const redirectUrl = isRenter 
      ? `/dashboard/renter/bookings/${bookingId}`
      : `/dashboard/provider/bookings/${bookingId}`;
    
    return NextResponse.redirect(new URL(redirectUrl, req.url));

  } catch (error) {
    console.error('Booking status error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
