import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';
import { storageService } from '@/lib/storage/storage-service';

const prisma = new PrismaClient();

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const EDITABLE_LISTING_STATUSES = ['Draft', 'Rejected'];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const providerId = (session.user as { id: string }).id;
    const { id: listingId } = await params;

    // Verify ownership
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.provider_id !== providerId) {
      return NextResponse.json({ message: 'Listing not found or forbidden' }, { status: 403 });
    }
    if (!EDITABLE_LISTING_STATUSES.includes(listing.status)) {
      return NextResponse.json({ message: 'Withdraw the listing before changing documents' }, { status: 400 });
    }

    const formData = await req.formData();
    const document_type = formData.get('document_type');
    if (!document_type || typeof document_type !== 'string') {
      return NextResponse.json({ message: 'Missing document_type' }, { status: 400 });
    }

    const file = formData.get('file');
    if (!file || typeof file === 'string' || !(file instanceof Blob)) {
      return NextResponse.json({ message: 'No valid file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ message: 'Invalid file type. Only PDF, JPG, and PNG are allowed.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: 'File exceeds 10MB size limit.' }, { status: 400 });
    }

    const extMatch = file.type === 'application/pdf' ? 'pdf' : (file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1] || 'pdf');
    const safeDocType = document_type.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const fileName = `documents/listing-${listingId}/${Date.now()}-${safeDocType}.${extMatch}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await storageService.uploadPrivateFile(buffer, fileName);

    const doc = await prisma.listingDocument.create({
      data: {
        listing_id: listingId,
        document_type,
        file_path: uploadResult.url,
        file_type: file.type,
        file_size: file.size,
        status: 'Submitted',
      },
    });

    await createAuditLog({
      actor_user_id: providerId,
      action: 'LISTING_DOCUMENT_UPLOADED',
      module: 'Listings',
      target_id: listingId,
      details: `Uploaded ${document_type} (${doc.id})`,
    });

    return NextResponse.json({ message: 'Document uploaded successfully', document: doc }, { status: 201 });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
