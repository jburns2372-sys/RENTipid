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

    const adminRole = (session.user as any).role;
    if (adminRole !== 'Admin' && adminRole !== 'Compliance Admin' && adminRole !== 'Super Admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const adminId = (session.user as any).id;
    const body = await req.json();
    const { listing_id, action, reason } = body;

    if (!listing_id || !action) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listing_id } });
    if (!listing) {
      return NextResponse.json({ message: 'Listing not found' }, { status: 404 });
    }

    let newStatus = listing.status;

    switch (action) {
      case 'MARK_UNDER_REVIEW':
        newStatus = 'Under Review';
        break;
      case 'APPROVE':
        newStatus = 'Approved';
        break;
      case 'PUBLISH':
        newStatus = 'Published';
        break;
      case 'REJECT':
        newStatus = 'Rejected';
        break;
      case 'SUSPEND':
        newStatus = 'Suspended';
        break;
      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    const updateData: any = { status: newStatus };
    if (action === 'REJECT') {
      updateData.rejection_reason = reason;
    }
    if (action === 'PUBLISH') {
      updateData.published_at = new Date();
    }

    await prisma.listing.update({
      where: { id: listing_id },
      data: updateData
    });

    await createAuditLog({
      actor_user_id: adminId,
      action: `LISTING_${action}`,
      module: 'Listings',
      target_id: listing_id,
      details: reason ? `Reason: ${reason}` : `Status changed to ${newStatus}`
    });

    return NextResponse.json({ message: `Listing status updated to ${newStatus}` }, { status: 200 });

  } catch (error) {
    console.error('Admin listing verify error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
