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

    const adminRole = (session.user as any).role;
    if (adminRole !== 'Admin' && adminRole !== 'Compliance Admin' && adminRole !== 'Super Admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const adminId = (session.user as any).id;
    const body = await req.json();
    const { document_id, action, reason } = body;

    if (!document_id || !action) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const doc = await prisma.listingDocument.findUnique({ where: { id: document_id } });
    if (!doc) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    let newStatus = doc.status;

    if (action === 'APPROVE') {
      newStatus = 'Approved';
    } else if (action === 'REJECT') {
      newStatus = 'Rejected';
    } else {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    const updateData: any = { 
      status: newStatus,
      reviewed_by: adminId,
      reviewed_at: new Date()
    };

    if (action === 'REJECT') {
      updateData.rejection_reason = reason;
    } else {
      updateData.rejection_reason = null;
    }

    await prisma.listingDocument.update({
      where: { id: document_id },
      data: updateData
    });

    await createAuditLog({
      actor_user_id: adminId,
      action: `LISTING_DOCUMENT_${action}`,
      module: 'Compliance',
      target_id: document_id,
      details: reason ? `Reason: ${reason}` : `Document marked as ${newStatus}`
    });

    return NextResponse.json({ message: `Document status updated to ${newStatus}` }, { status: 200 });

  } catch (error) {
    console.error('Admin doc verify error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
