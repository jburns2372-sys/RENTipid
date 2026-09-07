import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';
import { canCreateListing } from '@/lib/permissions';

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const providerId = (session.user as any).id;
    const providerStatus = (session.user as any).status;
    const providerRole = (session.user as any).role;
    const { id: listingId } = await params;

    if (providerStatus !== 'Verified' || !canCreateListing(providerRole)) {
      return NextResponse.json({ message: 'Only verified providers can withdraw a listing submission' }, { status: 403 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        photos: true,
        documents: true,
      },
    });

    if (!listing || listing.provider_id !== providerId) {
      return NextResponse.json({ message: 'Listing not found or forbidden' }, { status: 403 });
    }

    if (listing.status !== 'Submitted for Review') {
      return NextResponse.json({ message: 'Only submitted listings can be withdrawn before review' }, { status: 400 });
    }

    const previousStatus = listing.status;
    const newStatus = 'Draft';

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { status: newStatus },
    });

    await createAuditLog({
      actor_user_id: providerId,
      action: 'LISTING_WITHDRAWN',
      module: 'Listings',
      target_id: listingId,
      details: `Withdrawn listing submission '${listing.title}' from ${previousStatus} to ${newStatus}`,
    });

    const contentType = req.headers.get('content-type') || '';
    const isFormPost = contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data');

    if (isFormPost) {
      return NextResponse.redirect(new URL(`/dashboard/provider/listings/${listingId}`, req.url));
    }

    return NextResponse.json({
      message: 'Listing submission withdrawn successfully',
      status: updated.status,
      listingId: updated.id,
      preserved: {
        photos: listing.photos.length,
        documents: listing.documents.length,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Listing withdrawal error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
