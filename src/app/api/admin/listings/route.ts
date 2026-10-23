import {
  adminListingErrorResponse,
  getAdminReviewQueue,
  requireAdminListingReviewer,
} from '@/lib/listings/admin-review-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdminListingReviewer();
    return Response.json({ listings: await getAdminReviewQueue() });
  } catch (error) {
    return adminListingErrorResponse(error);
  }
}
