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

    const agreement = await prisma.rentalAgreement.findUnique({
      where: { booking_id: bookingId },
      include: { booking: true }
    });

    if (!agreement) {
      return NextResponse.json({ message: 'Agreement not found' }, { status: 404 });
    }

    if (agreement.booking.provider_id !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (agreement.accepted_by_provider) {
      return NextResponse.json({ message: 'Agreement already accepted by provider' }, { status: 400 });
    }

    await prisma.rentalAgreement.update({
      where: { booking_id: bookingId },
      data: {
        accepted_by_provider: true,
        provider_accepted_at: new Date()
      }
    });

    await createAuditLog({
      actor_user_id: userId,
      action: 'RENTAL_AGREEMENT_ACCEPTED_BY_PROVIDER',
      module: 'Booking',
      target_id: bookingId,
      details: 'Provider accepted the rental agreement'
    });

    return NextResponse.redirect(new URL(`/dashboard/provider/bookings/${bookingId}`, req.url));

  } catch (error) {
    console.error('Accept agreement error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
