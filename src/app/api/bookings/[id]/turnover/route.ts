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
    const turnoverType = formData.get('turnover_type') as string; // "Release to Renter" or "Return to Provider"
    const pickupOrDelivery = formData.get('pickup_or_delivery') as string;
    const turnoverLocation = formData.get('turnover_location') as string;
    const personName = formData.get('person_name') as string;
    const confirmationNotes = formData.get('confirmation_notes') as string || '';

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking || booking.provider_id !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const isRelease = turnoverType === 'Release to Renter';
    const newBookingStatus = isRelease ? 'Ongoing' : 'Returned';

    if (isRelease && booking.status !== 'Confirmed') {
      return NextResponse.json({ message: 'Booking must be Confirmed to release' }, { status: 400 });
    }

    if (!isRelease && booking.status !== 'Ongoing') {
      return NextResponse.json({ message: 'Booking must be Ongoing to return' }, { status: 400 });
    }

    // Execute in a transaction to update booking status and create turnover record
    await prisma.$transaction(async (tx) => {
      await tx.turnoverRecord.create({
        data: {
          booking_id: bookingId,
          listing_id: booking.listing_id,
          renter_id: booking.renter_id,
          provider_id: booking.provider_id,
          turnover_type: turnoverType,
          turnover_status: 'Completed',
          pickup_or_delivery: pickupOrDelivery,
          turnover_location: turnoverLocation,
          turnover_datetime: new Date(),
          handed_over_by: isRelease ? personName : undefined,
          received_by: !isRelease ? personName : undefined,
          confirmation_notes: confirmationNotes
        }
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: newBookingStatus }
      });

      await tx.bookingStatusHistory.create({
        data: {
          booking_id: bookingId,
          old_status: booking.status,
          new_status: newBookingStatus,
          changed_by: userId,
          notes: `${turnoverType} completed.`
        }
      });
    });

    await createAuditLog({
      actor_user_id: userId,
      action: isRelease ? 'TURNOVER_RELEASED' : 'TURNOVER_RETURNED',
      module: 'Turnover',
      target_id: bookingId,
      details: `${turnoverType} recorded for booking ${bookingId}`
    });

    await prisma.notification.create({
      data: {
        user_id: booking.renter_id,
        title: isRelease ? 'Asset Released' : 'Asset Returned',
        message: isRelease 
          ? `Provider has confirmed the release of the asset. Your rental is now Ongoing.`
          : `Provider has confirmed the return of the asset. The booking is now in Returned status.`,
        type: 'Turnover'
      }
    });

    return NextResponse.redirect(new URL(`/dashboard/provider/bookings/${bookingId}`, req.url));

  } catch (error) {
    console.error('Turnover API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
