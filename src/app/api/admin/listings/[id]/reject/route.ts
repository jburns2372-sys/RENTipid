import {
  adminListingErrorResponse,
  rejectListing,
  requireAdminListingReviewer,
} from '@/lib/listings/admin-review-service';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const reviewer = await requireAdminListingReviewer();
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const listing = await rejectListing({ listingId: id, reviewerId: reviewer.id, reason: body.reason });
    return Response.json({ listing, message: 'Listing rejected' });
  } catch (error) {
    return adminListingErrorResponse(error);
  }
}
