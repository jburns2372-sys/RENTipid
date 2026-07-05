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
      return NextResponse.json({ message: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const adminId = (session.user as any).id;
    const body = await req.json();
    const { action, target_user_id, reason } = body;

    if (!action || !target_user_id) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: target_user_id } });
    if (!targetUser) {
      return NextResponse.json({ message: 'Target user not found' }, { status: 404 });
    }

    let newStatus = targetUser.status;

    switch (action) {
      case 'APPROVE_USER':
        newStatus = 'Verified';
        break;
      case 'REJECT_USER':
        // Rejecting keeps them Pending or sets a specific status if schema allowed. We'll leave as Pending but log the rejection.
        newStatus = 'Pending'; 
        break;
      case 'SUSPEND_USER':
        newStatus = 'Suspended';
        break;
      case 'BLACKLIST_USER':
        newStatus = 'Blacklisted';
        break;
      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: target_user_id },
      data: { status: newStatus }
    });

    await createAuditLog({
      actor_user_id: adminId,
      action: action,
      module: 'Compliance',
      target_id: target_user_id,
      details: reason ? `Reason: ${reason}` : 'Status updated by admin'
    });

    return NextResponse.json({ message: `User status updated to ${newStatus}` }, { status: 200 });

  } catch (error) {
    console.error('Admin verify error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
