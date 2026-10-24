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
        documents: true,
      },
    });

    if (!listing || listing.provider_id !== providerId) {
      return NextResponse.json({ message: 'Listing not found or forbidden' }, { status: 403 });
    }

    if (listing.status !== 'Draft' && listing.status !== 'Rejected') {
      return NextResponse.json({ message: 'Listing is not in a submittable state' }, { status: 400 });
    }

    const contentType = req.headers.get('content-type') || '';
    const isFormPost = contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data');

    // Validation 1: At least 1 photo required
    if (listing.photos.length === 0) {
      if (isFormPost) {
        return NextResponse.redirect(new URL(`/dashboard/provider/listings/${listingId}?error=MissingPhotos`, req.url));
      }
      return NextResponse.json({ message: 'Please upload at least 1 photo before submitting for review.' }, { status: 400 });
    }

    // Validation 2: Required compliance documents for High or Regulated risk
    const isHighRisk = listing.category.risk_level === 'High' || listing.category.risk_level === 'Regulated';
    if (isHighRisk && listing.documents.length === 0) {
      if (isFormPost) {
        return NextResponse.redirect(new URL(`/dashboard/provider/listings/${listingId}?error=MissingDocuments`, req.url));
      }
      return NextResponse.json({ message: 'This category requires compliance/ownership verification documents before submission.' }, { status: 400 });
    }

    // Update status to Submitted for Review
    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { status: 'Submitted for Review', rejection_reason: null, published_at: null },
    });

    await createAuditLog({
      actor_user_id: providerId,
      action: 'LISTING_SUBMITTED',
      module: 'Listings',
      target_id: listingId,
      details: `Submitted listing '${listing.title}' for admin review`,
    });

    if (isFormPost) {
      return NextResponse.redirect(new URL('/dashboard/provider/listings', req.url));
    }

    return NextResponse.json({
      message: 'Listing submitted for review successfully',
      status: updated.status,
      listingId: updated.id,
    }, { status: 200 });
  } catch (error) {
    console.error('Listing submission error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
