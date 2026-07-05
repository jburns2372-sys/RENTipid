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

    const providerId = (session.user as any).id;
    const providerStatus = (session.user as any).status;
    const { id: listingId } = await params;

    if (providerStatus !== 'Verified') {
      return NextResponse.json({ message: 'You must be verified to submit a listing' }, { status: 403 });
    }

    // Load listing with relations
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        category: true,
        photos: true,
        documents: true
      }
    });

    if (!listing || listing.provider_id !== providerId) {
      return NextResponse.json({ message: 'Listing not found or forbidden' }, { status: 403 });
    }

    if (listing.status !== 'Draft' && listing.status !== 'Rejected') {
      return NextResponse.json({ message: 'Listing is not in a valid state for submission' }, { status: 400 });
    }

    // VALIDATION 1: Must have at least 1 photo
    if (listing.photos.length === 0) {
      // It's possible we want to redirect them back with an error, but as an API response:
      // We will handle redirect/error on the client. Let's do API response.
      // Wait, let's redirect on success, but on error throw. 
      // Actually, since we are doing form action submit, we should redirect to dashboard with an error param if failed.
      return NextResponse.redirect(new URL(`/dashboard/provider/listings/${listingId}?error=MissingPhotos`, req.url));
    }

    // VALIDATION 2: Required documents based on risk
    const isHighRisk = listing.category.risk_level === 'High' || listing.category.risk_level === 'Regulated';
    if (isHighRisk && listing.documents.length === 0) {
      return NextResponse.redirect(new URL(`/dashboard/provider/listings/${listingId}?error=MissingDocuments`, req.url));
    }

    // Passed validations -> Submit
    await prisma.listing.update({
      where: { id: listingId },
      data: { status: 'Submitted for Review' }
    });

    await createAuditLog({
      actor_user_id: providerId,
      action: 'LISTING_SUBMITTED',
      module: 'Listings',
      target_id: listingId,
      details: 'Submitted for Admin Review'
    });

    return NextResponse.redirect(new URL('/dashboard/provider/listings', req.url));

  } catch (error) {
    console.error('Listing submit error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
