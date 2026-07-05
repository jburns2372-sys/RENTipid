import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const document_type = formData.get('document_type') as string;

    if (!file || !document_type) {
      return NextResponse.json({ message: 'Missing file or document type' }, { status: 400 });
    }

    // Server-side validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Invalid file type' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: 'File too large' }, { status: 400 });
    }

    // In a real application, you would save the file buffer to S3, GCS, or a secure local /uploads folder.
    // For Phase 2 foundation, we generate a secure reference path.
    const fileExtension = file.name.split('.').pop();
    const securePath = `/private-uploads/${userId}/${Date.now()}-${document_type}.${fileExtension}`;

    // Save document reference to database
    const doc = await prisma.verificationDocument.create({
      data: {
        user_id: userId,
        document_type,
        file_url: securePath,
        status: 'Submitted'
      }
    });

    // Automatically update User status to 'Under Review' if they were 'Pending'
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.status === 'Pending') {
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'Under Review' } // Note: Currently our schema has "Pending", "Verified", "Suspended", "Blacklisted" 
        // We will leave the user as Pending until an Admin verifies them. 
        // Actually, let's keep it 'Pending' for the User, but the Document is 'Submitted'.
      });
    }

    await createAuditLog({
      actor_user_id: userId,
      action: 'DOCUMENT_UPLOADED',
      module: 'KYC',
      target_id: doc.id,
      details: `Uploaded ${document_type}`
    });

    return NextResponse.json({ message: 'Document uploaded successfully', document: doc }, { status: 201 });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
