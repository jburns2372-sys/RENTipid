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
    const action = formData.get('action'); // "CONFIRM" or "FLAG"
    const renterNotes = formData.get('renter_notes') as string || '';

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { inspectionReports: { where: { inspection_type: 'Pre-Rental' } } }
    });

    if (!booking || booking.renter_id !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const report = booking.inspectionReports[0];
    if (!report) {
      return NextResponse.json({ message: 'Inspection report not found' }, { status: 404 });
    }

    if (report.status !== 'Submitted by Provider') {
      return NextResponse.json({ message: 'Inspection cannot be modified' }, { status: 400 });
    }

    const newStatus = action === 'FLAG' ? 'Requires Review' : 'Confirmed by Renter';

    await prisma.inspectionReport.update({
      where: { id: report.id },
      data: {
        status: newStatus,
        renter_notes: renterNotes,
        confirmed_by: userId,
        confirmed_at: new Date()
      }
    });

    await createAuditLog({
      actor_user_id: userId,
      action: action === 'FLAG' ? 'INSPECTION_FLAGGED_BY_RENTER' : 'INSPECTION_CONFIRMED_BY_RENTER',
      module: 'Inspection',
      target_id: report.id,
      details: `Renter ${action === 'FLAG' ? 'flagged' : 'confirmed'} the pre-rental inspection`
    });

    await prisma.notification.create({
      data: {
        user_id: booking.provider_id,
        title: action === 'FLAG' ? 'Discrepancy Flagged' : 'Inspection Confirmed',
        message: action === 'FLAG' 
          ? `Renter flagged an issue with the pre-rental inspection for booking ${bookingId}.`
          : `Renter has confirmed the condition for booking ${bookingId}. You may now release the item.`,
        type: 'Inspection'
      }
    });

    return NextResponse.redirect(new URL(`/dashboard/renter/bookings/${bookingId}`, req.url));

  } catch (error) {
    console.error('Inspection Confirm API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
