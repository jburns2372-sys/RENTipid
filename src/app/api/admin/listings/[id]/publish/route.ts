import {
  adminListingErrorResponse,
  publishListing,
  requireAdminListingReviewer,
} from '@/lib/listings/admin-review-service';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const reviewer = await requireAdminListingReviewer();
    const { id } = await context.params;
    const listing = await publishListing({ listingId: id, reviewerId: reviewer.id });
    return Response.json({ listing, message: 'Listing published' });
  } catch (error) {
    return adminListingErrorResponse(error);
  }
}
