import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const providerId = (session.user as any).id;
    const { id: listingId } = await params;

    // Verify ownership
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.provider_id !== providerId) {
      return NextResponse.json({ message: 'Listing not found or forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const document_type = formData.get('document_type') as string;

    if (!file || !document_type) {
      return NextResponse.json({ message: 'Missing file or document_type' }, { status: 400 });
    }

    // Validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Invalid file type' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ message: 'File size exceeds 10MB' }, { status: 400 });
    }

    // Prepare private local storage
    const uploadDir = path.join(process.cwd(), 'private-uploads', 'listing-documents', listingId);
    await fs.mkdir(uploadDir, { recursive: true });

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${document_type.replace(/[^a-zA-Z0-9]/g, '')}.${fileExt}`;
    const absolutePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absolutePath, buffer);

    // Database save
    const doc = await prisma.listingDocument.create({
      data: {
        listing_id: listingId,
        document_type,
        file_path: absolutePath, // Storing absolute path for private retrieval
        file_type: file.type,
        file_size: file.size,
        status: 'Submitted'
      }
    });

    await createAuditLog({
      actor_user_id: providerId,
      action: 'LISTING_DOCUMENT_UPLOADED',
      module: 'Listings',
      target_id: listingId,
      details: `Uploaded ${document_type}`
    });

    return NextResponse.json({ message: 'Document uploaded successfully', document: doc }, { status: 201 });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
