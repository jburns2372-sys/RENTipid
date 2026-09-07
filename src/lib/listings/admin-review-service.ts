import 'server-only';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

export const ADMIN_LISTING_REVIEW_ROLES = ['Admin', 'Compliance Admin', 'Super Admin'] as const;
const PENDING_REVIEW_STATUSES = ['Submitted for Review', 'Under Review'] as const;
const BLOCKING_RISK_LEVELS = new Set(['High', 'Regulated']);

export class AdminListingReviewError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AdminListingReviewError';
  }
}

function fail(code: string, status: number, message: string): never {
  throw new AdminListingReviewError(code, status, message);
}

export async function requireAdminListingReviewer() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string } | undefined;

  if (!sessionUser?.id) {
    fail('UNAUTHENTICATED', 401, 'Authentication required');
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, full_name: true, email: true, role: true, status: true },
  });

  if (
    !user ||
    user.status !== 'Verified' ||
    !ADMIN_LISTING_REVIEW_ROLES.includes(user.role as (typeof ADMIN_LISTING_REVIEW_ROLES)[number])
  ) {
    fail('FORBIDDEN', 403, 'Admin listing-review capability required');
  }

  return user;
}

type RequirementShape = string | {
  name?: unknown;
  type?: unknown;
  document_type?: unknown;
  label?: unknown;
};

export function parseRequiredDocumentTypes(raw: string | null | undefined): string[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((requirement: RequirementShape) => {
      if (typeof requirement === 'string') return requirement.trim() ? [requirement.trim()] : [];
      if (!requirement || typeof requirement !== 'object') return [];

      const candidate = requirement.document_type ?? requirement.type ?? requirement.name ?? requirement.label;
      return typeof candidate === 'string' && candidate.trim() ? [candidate.trim()] : [];
    });
  } catch {
    return [];
  }
}

function normalizeDocumentType(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

export function evaluateRequiredDocumentReadiness(input: {
  riskLevel: string;
  requiredProviderDocuments?: string | null;
  documents: Array<{ document_type: string; status: string }>;
}) {
  const blocking = BLOCKING_RISK_LEVELS.has(input.riskLevel);
  if (!blocking) {
    return { blocking: false, ready: true, requiredTypes: [] as string[], missingTypes: [] as string[] };
  }

  const requiredTypes = parseRequiredDocumentTypes(input.requiredProviderDocuments);
  const approvedTypes = new Set(
    input.documents
      .filter((document) => document.status === 'Approved')
      .map((document) => normalizeDocumentType(document.document_type)),
  );

  if (requiredTypes.length > 0) {
    const missingTypes = requiredTypes.filter((type) => !approvedTypes.has(normalizeDocumentType(type)));
    return { blocking: true, ready: missingTypes.length === 0, requiredTypes, missingTypes };
  }

  // Legacy categories may not yet define named requirements. For High/Regulated
  // listings, at least one current approved compliance document is still mandatory.
  const hasApprovedDocument = approvedTypes.size > 0;
  return {
    blocking: true,
    ready: hasApprovedDocument,
    requiredTypes: [] as string[],
    missingTypes: hasApprovedDocument ? [] : ['Approved compliance document'],
  };
}

const listingReviewInclude = {
  provider: {
    select: { id: true, full_name: true, email: true, role: true, status: true },
  },
  category: { include: { requirements: true } },
  photos: { orderBy: { display_order: 'asc' as const } },
  documents: {
    orderBy: { uploaded_at: 'desc' as const },
    select: {
      id: true,
      listing_id: true,
      document_type: true,
      file_type: true,
      file_size: true,
      status: true,
      rejection_reason: true,
      uploaded_at: true,
      reviewed_by: true,
      reviewed_at: true,
    },
  },
};

export async function getAdminReviewQueue() {
  const listings = await prisma.listing.findMany({
    where: { status: { in: [...PENDING_REVIEW_STATUSES] } },
    include: listingReviewInclude,
    orderBy: { updated_at: 'asc' },
  });

  return listings.map((listing) => ({
    ...listing,
    documentReadiness: evaluateRequiredDocumentReadiness({
      riskLevel: listing.category.risk_level,
      requiredProviderDocuments: listing.category.requirements?.required_provider_documents,
      documents: listing.documents,
    }),
  }));
}

export async function getAdminListingReviewDetail(listingId: string) {
  const [listing, auditEvents] = await Promise.all([
    prisma.listing.findUnique({ where: { id: listingId }, include: listingReviewInclude }),
    prisma.auditLog.findMany({
      where: {
        target_id: listingId,
        module: 'Listings',
        action: {
          in: [
            'LISTING_SUBMITTED',
            'LISTING_SUBMISSION_WITHDRAWN',
            'LISTING_WITHDRAWN',
            'LISTING_DOCUMENT_APPROVED',
            'LISTING_DOCUMENT_REJECTED',
            'LISTING_REJECTED',
            'LISTING_APPROVED',
            'LISTING_PUBLISHED',
            'LISTING_UNPUBLISHED',
          ],
        },
      },
      orderBy: { created_at: 'desc' },
      take: 20,
      select: { id: true, action: true, details: true, actor_user_id: true, created_at: true },
    }),
  ]);

  if (!listing) fail('LISTING_NOT_FOUND', 404, 'Listing not found');

  return {
    listing,
    auditEvents,
    documentReadiness: evaluateRequiredDocumentReadiness({
      riskLevel: listing.category.risk_level,
      requiredProviderDocuments: listing.category.requirements?.required_provider_documents,
      documents: listing.documents,
    }),
  };
}

export async function reviewListingDocument(input: {
  documentId: string;
  reviewerId: string;
  decision: 'APPROVE' | 'REJECT';
  reason?: string;
}) {
  const reason = input.reason?.trim();
  if (input.decision === 'REJECT' && !reason) {
    fail('REJECTION_REASON_REQUIRED', 400, 'A document rejection reason is required');
  }

  const document = await prisma.listingDocument.findUnique({
    where: { id: input.documentId },
    include: { listing: { select: { id: true, title: true, status: true } } },
  });
  if (!document) fail('DOCUMENT_NOT_FOUND', 404, 'Listing document not found');
  if (!PENDING_REVIEW_STATUSES.includes(document.listing.status as (typeof PENDING_REVIEW_STATUSES)[number])) {
    fail('LISTING_NOT_PENDING_REVIEW', 409, 'Documents can only be reviewed while the listing is pending review');
  }
  if (!['Submitted', 'Under Review'].includes(document.status)) {
    fail('DOCUMENT_NOT_PENDING_REVIEW', 409, 'Document is not pending review');
  }

  const now = new Date();
  const status = input.decision === 'APPROVE' ? 'Approved' : 'Rejected';
  const updated = await prisma.$transaction(async (tx) => {
    const reviewedDocument = await tx.listingDocument.update({
      where: { id: input.documentId },
      data: {
        status,
        rejection_reason: input.decision === 'REJECT' ? reason : null,
        reviewed_by: input.reviewerId,
        reviewed_at: now,
      },
    });

    if (document.listing.status === 'Submitted for Review') {
      await tx.listing.update({
        where: { id: document.listing.id },
        data: { status: 'Under Review' },
      });
    }

    return reviewedDocument;
  });

  await createAuditLog({
    actor_user_id: input.reviewerId,
    action: input.decision === 'APPROVE' ? 'LISTING_DOCUMENT_APPROVED' : 'LISTING_DOCUMENT_REJECTED',
    module: 'Listings',
    target_id: document.listing.id,
    details: input.decision === 'APPROVE'
      ? `Approved ${document.document_type} (${document.id})`
      : `Rejected ${document.document_type} (${document.id}): ${reason}`,
  });

  return updated;
}

export async function rejectListing(input: { listingId: string; reviewerId: string; reason?: string }) {
  const reason = input.reason?.trim();
  if (!reason) fail('REJECTION_REASON_REQUIRED', 400, 'A listing rejection reason is required');

  const listing = await prisma.listing.findUnique({ where: { id: input.listingId } });
  if (!listing) fail('LISTING_NOT_FOUND', 404, 'Listing not found');
  if (!PENDING_REVIEW_STATUSES.includes(listing.status as (typeof PENDING_REVIEW_STATUSES)[number])) {
    fail('LISTING_NOT_PENDING_REVIEW', 409, 'Listing is not pending review');
  }

  const updated = await prisma.listing.update({
    where: { id: input.listingId },
    data: { status: 'Rejected', rejection_reason: reason, published_at: null },
  });

  await createAuditLog({
    actor_user_id: input.reviewerId,
    action: 'LISTING_REJECTED',
    module: 'Listings',
    target_id: input.listingId,
    details: `Rejected listing '${listing.title}': ${reason}`,
  });
  return updated;
}

export async function approveListing(input: { listingId: string; reviewerId: string }) {
  const listing = await prisma.listing.findUnique({
    where: { id: input.listingId },
    include: {
      provider: { select: { status: true } },
      category: { include: { requirements: true } },
      photos: { select: { id: true } },
      documents: { select: { document_type: true, status: true } },
    },
  });
  if (!listing) fail('LISTING_NOT_FOUND', 404, 'Listing not found');
  if (!PENDING_REVIEW_STATUSES.includes(listing.status as (typeof PENDING_REVIEW_STATUSES)[number])) {
    fail('LISTING_NOT_PENDING_REVIEW', 409, 'Listing is not pending review');
  }
  if (listing.provider.status !== 'Verified') {
    fail('PROVIDER_NOT_VERIFIED', 409, 'The provider must be verified before listing approval');
  }
  if (listing.photos.length === 0) {
    fail('LISTING_PHOTOS_REQUIRED', 409, 'At least one listing photo is required before approval');
  }

  const readiness = evaluateRequiredDocumentReadiness({
    riskLevel: listing.category.risk_level,
    requiredProviderDocuments: listing.category.requirements?.required_provider_documents,
    documents: listing.documents,
  });
  if (!readiness.ready) {
    fail('REQUIRED_DOCUMENTS_NOT_VERIFIED', 409, 'Required listing documents must be approved first');
  }

  const updated = await prisma.listing.update({
    where: { id: input.listingId },
    data: { status: 'Approved', rejection_reason: null, published_at: null },
  });
  await createAuditLog({
    actor_user_id: input.reviewerId,
    action: 'LISTING_APPROVED',
    module: 'Listings',
    target_id: input.listingId,
    details: `Approved listing '${listing.title}' for publication`,
  });
  return updated;
}

export async function publishListing(input: { listingId: string; reviewerId: string }) {
  const listing = await prisma.listing.findUnique({ where: { id: input.listingId } });
  if (!listing) fail('LISTING_NOT_FOUND', 404, 'Listing not found');
  if (listing.status !== 'Approved') {
    fail('LISTING_NOT_APPROVED', 409, 'Only an Approved listing can be published');
  }

  const updated = await prisma.listing.update({
    where: { id: input.listingId },
    data: { status: 'Published', published_at: new Date() },
  });
  await createAuditLog({
    actor_user_id: input.reviewerId,
    action: 'LISTING_PUBLISHED',
    module: 'Listings',
    target_id: input.listingId,
    details: `Published listing '${listing.title}'`,
  });
  return updated;
}

export async function unpublishListing(input: { listingId: string; reviewerId: string }) {
  const listing = await prisma.listing.findUnique({ where: { id: input.listingId } });
  if (!listing) fail('LISTING_NOT_FOUND', 404, 'Listing not found');
  if (listing.status !== 'Published') {
    fail('LISTING_NOT_PUBLISHED', 409, 'Only a Published listing can be unpublished');
  }

  const updated = await prisma.listing.update({
    where: { id: input.listingId },
    data: { status: 'Approved', published_at: null },
  });
  await createAuditLog({
    actor_user_id: input.reviewerId,
    action: 'LISTING_UNPUBLISHED',
    module: 'Listings',
    target_id: input.listingId,
    details: `Unpublished listing '${listing.title}'`,
  });
  return updated;
}

export function adminListingErrorResponse(error: unknown): Response {
  if (error instanceof AdminListingReviewError) {
    return Response.json({ error: error.code, message: error.message }, { status: error.status });
  }

  console.error('Admin listing review failed');
  return Response.json({ error: 'INTERNAL_SERVER_ERROR', message: 'Unable to complete listing review' }, { status: 500 });
}
