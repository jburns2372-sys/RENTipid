import {
  adminListingErrorResponse,
  requireAdminListingReviewer,
  reviewListingDocument,
} from '@/lib/listings/admin-review-service';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const reviewer = await requireAdminListingReviewer();
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const document = await reviewListingDocument({
      documentId: id,
      reviewerId: reviewer.id,
      decision: 'REJECT',
      reason: body.reason,
    });
    return Response.json({ document, message: 'Document rejected' });
  } catch (error) {
    return adminListingErrorResponse(error);
  }
}
