import {
  adminListingErrorResponse,
  requireAdminListingReviewer,
  reviewListingDocument,
} from '@/lib/listings/admin-review-service';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const reviewer = await requireAdminListingReviewer();
    const { id } = await context.params;
    const document = await reviewListingDocument({
      documentId: id,
      reviewerId: reviewer.id,
      decision: 'APPROVE',
    });
    return Response.json({ document, message: 'Document approved' });
  } catch (error) {
    return adminListingErrorResponse(error);
  }
}
