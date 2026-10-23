import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { storageService } from '@/lib/storage/storage-service';
import { createAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as {id?: string})?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session?.user as {id?: string}).id;

    const formData = await req.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `profile-${userId}-${Date.now()}.${ext}`;

    // Upload to existing storage provider
    const result = await storageService.uploadPublicFile(buffer, fileName);
    
    // Check if result returned a string URL or an object with url property
    const url = typeof result === 'string' ? result : (result as { url?: string })?.url || `/uploads/${fileName}`;

    await prisma.userProfile.update({
      where: { user_id: userId },
      data: { profile_photo: url }
    });

    await createAuditLog({
      actor_user_id: userId,
      action: 'PROFILE_PHOTO_UPDATED',
      module: 'profile',
      target_id: userId,
      details: 'User uploaded a new profile photo.'
    });

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('POST /api/profile/photo error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as {id?: string})?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session?.user as {id?: string}).id;

    await prisma.userProfile.update({
      where: { user_id: userId },
      data: { profile_photo: null }
    });

    await createAuditLog({
      actor_user_id: userId,
      action: 'PROFILE_PHOTO_REMOVED',
      module: 'profile',
      target_id: userId,
      details: 'User removed their profile photo.'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/profile/photo error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
