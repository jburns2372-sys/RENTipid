import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ADMIN_LISTING_REVIEW_ROLES } from '@/lib/listings/admin-review-service';
import { prisma } from '@/lib/prisma';
import { getPrivateBlob } from '@/lib/storage/vercel-blob-storage-adapter';

export const dynamic = 'force-dynamic';

function isAllowedLegacyDocumentHost(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (
      url.hostname === 'blob.vercel-storage.com' ||
      url.hostname.endsWith('.blob.vercel-storage.com') ||
      url.hostname.endsWith('.blob.core.windows.net')
    );
  } catch {
    return false;
  }
}

export async function GET(_request: Request, context: RouteContext<'/api/documents/[id]'>) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string } | undefined;
    if (!sessionUser?.id) return new Response('Unauthorized', { status: 401 });

    const { id: documentId } = await context.params;
    const [requestingUser, listingDocument] = await Promise.all([
      prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { id: true, role: true, status: true },
      }),
      prisma.listingDocument.findUnique({
        where: { id: documentId },
        include: { listing: { select: { provider_id: true } } },
      }),
    ]);

    if (!requestingUser || requestingUser.status !== 'Verified') {
      return new Response('Forbidden', { status: 403 });
    }

    const isAdmin = ADMIN_LISTING_REVIEW_ROLES.includes(
      requestingUser.role as (typeof ADMIN_LISTING_REVIEW_ROLES)[number],
    );
    let documentPath: string;
    let documentType: string;

    if (listingDocument) {
      if (!isAdmin && listingDocument.listing.provider_id !== requestingUser.id) {
        return new Response('Forbidden', { status: 403 });
      }
      documentPath = listingDocument.file_path;
      documentType = listingDocument.file_type || 'application/octet-stream';
    } else {
      const verificationDocument = await prisma.verificationDocument.findUnique({ where: { id: documentId } });
      if (!verificationDocument) return new Response('Document not found', { status: 404 });
      if (!isAdmin && verificationDocument.user_id !== requestingUser.id) {
        return new Response('Forbidden', { status: 403 });
      }
      documentPath = verificationDocument.file_url;
      documentType = documentPath.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
    }

    const blob = listingDocument
      ? await getPrivateBlob(documentPath)
      : !isAllowedLegacyDocumentHost(documentPath)
        ? null
        : await fetch(documentPath, { cache: 'no-store', redirect: 'error' }).then(async (response) => {
          if (!response.ok || !response.body) return null;
          return { stream: response.body, headers: response.headers, blob: { contentType: response.headers.get('content-type') } };
        });
    if (!blob || !blob.stream) return new Response('Document unavailable', { status: 502 });

    return new Response(blob.stream, {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
        'Content-Disposition': 'inline',
        'Content-Type': blob.blob.contentType || blob.headers.get('content-type') || documentType,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    console.error('Document fetch failed');
    return new Response('Internal server error', { status: 500 });
  }
}
