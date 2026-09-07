import {
  adminListingErrorResponse,
  getAdminListingReviewDetail,
  requireAdminListingReviewer,
} from '@/lib/listings/admin-review-service';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminListingReviewer();
    const { id } = await context.params;
    return Response.json(await getAdminListingReviewDetail(id));
  } catch (error) {
    return adminListingErrorResponse(error);
  }
}
