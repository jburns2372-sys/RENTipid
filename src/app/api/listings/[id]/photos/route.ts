import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';
import { storageService } from '@/lib/storage/storage-service';

const prisma = new PrismaClient();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const EDITABLE_LISTING_STATUSES = ['Draft', 'Rejected'];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const providerId = (session.user as { id: string }).id;
    const { id: listingId } = await params;

    // Verify listing ownership
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.provider_id !== providerId) {
      return NextResponse.json({ message: 'Listing not found or forbidden' }, { status: 403 });
    }
    if (!EDITABLE_LISTING_STATUSES.includes(listing.status)) {
      return NextResponse.json({ message: 'Withdraw the listing before changing photos' }, { status: 400 });
    }

    const photoCount = await prisma.listingPhoto.count({ where: { listing_id: listingId } });
    if (photoCount >= 10) {
      return NextResponse.json({ message: 'Maximum 10 photos allowed' }, { status: 413 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string' || !(file instanceof Blob)) {
      return NextResponse.json({ message: 'No valid file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ message: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: 'File exceeds 5MB size limit.' }, { status: 400 });
    }

    const extMatch = file.type.split('/')[1] || 'jpg';
    const ext = extMatch === 'jpeg' ? 'jpg' : extMatch;
    const fileName = `listings/${listingId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await storageService.uploadPublicFile(buffer, fileName);

    const isFirst = photoCount === 0;
    const photo = await prisma.listingPhoto.create({
      data: {
        listing_id: listingId,
        file_path: uploadResult.url,
        file_type: file.type,
        file_size: file.size,
        display_order: photoCount + 1,
        is_cover: isFirst,
      },
    });

    await createAuditLog({
      actor_user_id: providerId,
      action: 'LISTING_PHOTO_UPLOADED',
      module: 'Listings',
      target_id: listingId,
      details: `Uploaded photo ${photo.id}`,
    });

    return NextResponse.json({ message: 'Photo uploaded successfully', photo }, { status: 201 });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const providerId = (session.user as { id: string }).id;
    const { id: listingId } = await params;
    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) return NextResponse.json({ message: 'Missing photo ID' }, { status: 400 });

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.provider_id !== providerId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    if (!EDITABLE_LISTING_STATUSES.includes(listing.status)) {
      return NextResponse.json({ message: 'Withdraw the listing before changing photos' }, { status: 400 });
    }

    const photo = await prisma.listingPhoto.findUnique({ where: { id: photoId } });
    if (!photo || photo.listing_id !== listingId) {
      return NextResponse.json({ message: 'Photo not found' }, { status: 404 });
    }

    // Best-effort delete from storage adapter
    try {
      await storageService.deleteFile(photo.file_path);
    } catch (storageErr) {
      console.warn('Failed to delete file from storage:', storageErr);
    }

    await prisma.listingPhoto.delete({ where: { id: photoId } });

    await createAuditLog({
      actor_user_id: providerId,
      action: 'LISTING_PHOTO_DELETED',
      module: 'Listings',
      target_id: listingId,
      details: `Deleted photo ${photoId}`,
    });

    return NextResponse.json({ message: 'Photo deleted' }, { status: 200 });
  } catch (error) {
    console.error('Photo delete error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
