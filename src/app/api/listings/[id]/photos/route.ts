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

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Invalid file type' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: 'File size exceeds 5MB' }, { status: 400 });
    }

    // Check count
    const photoCount = await prisma.listingPhoto.count({ where: { listing_id: listingId } });
    if (photoCount >= 10) {
      return NextResponse.json({ message: 'Maximum 10 photos allowed' }, { status: 400 });
    }

    // Prepare local storage
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'listings', listingId);
    await fs.mkdir(uploadDir, { recursive: true });

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/listings/${listingId}/${fileName}`;

    // Database save
    const isFirst = photoCount === 0;
    const photo = await prisma.listingPhoto.create({
      data: {
        listing_id: listingId,
        file_path: publicUrl,
        file_type: file.type,
        file_size: file.size,
        display_order: photoCount + 1,
        is_cover: isFirst
      }
    });

    await createAuditLog({
      actor_user_id: providerId,
      action: 'LISTING_PHOTO_UPLOADED',
      module: 'Listings',
      target_id: listingId,
      details: `Uploaded photo ${photo.id}`
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

    const providerId = (session.user as any).id;
    const { id: listingId } = await params;
    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) return NextResponse.json({ message: 'Missing photo ID' }, { status: 400 });

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.provider_id !== providerId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const photo = await prisma.listingPhoto.findUnique({ where: { id: photoId } });
    if (!photo || photo.listing_id !== listingId) {
      return NextResponse.json({ message: 'Photo not found' }, { status: 404 });
    }

    // Remove file
    const absolutePath = path.join(process.cwd(), 'public', photo.file_path);
    try {
      await fs.unlink(absolutePath);
    } catch (err) {
      console.warn('Failed to delete file from disk', absolutePath);
    }

    // Delete record
    await prisma.listingPhoto.delete({ where: { id: photoId } });

    await createAuditLog({
      actor_user_id: providerId,
      action: 'LISTING_PHOTO_DELETED',
      module: 'Listings',
      target_id: listingId,
      details: `Deleted photo ${photoId}`
    });

    return NextResponse.json({ message: 'Photo deleted' }, { status: 200 });
  } catch (error) {
    console.error('Photo delete error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
