import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import { createReadStream } from 'fs';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const isAdmin = role === 'Admin' || role === 'Compliance Admin' || role === 'Super Admin';

    const { id: documentId } = await params;

    // Check ListingDocument first
    let docPath = '';
    let docType = '';

    const listingDoc = await prisma.listingDocument.findUnique({
      where: { id: documentId },
      include: { listing: true }
    });

    if (listingDoc) {
      if (!isAdmin && listingDoc.listing.provider_id !== userId) {
        return new NextResponse('Forbidden', { status: 403 });
      }
      docPath = listingDoc.file_path;
      docType = listingDoc.file_type;
    } else {
      // If not a listing doc, check if it's a KYC verification doc
      const kycDoc = await prisma.verificationDocument.findUnique({
        where: { id: documentId }
      });
      
      if (!kycDoc) {
        return new NextResponse('Document not found', { status: 404 });
      }

      if (!isAdmin && kycDoc.user_id !== userId) {
        return new NextResponse('Forbidden', { status: 403 });
      }
      docPath = kycDoc.file_url; // We stored absolute path here too based on phase 2 logic
      
      // Fallback content type for old KYC docs
      docType = docPath.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'; 
    }

    // Verify file exists on disk
    try {
      await fs.access(docPath);
    } catch {
      return new NextResponse('File not found on server', { status: 404 });
    }

    const fileBuffer = await fs.readFile(docPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': docType,
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('Document fetch error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
