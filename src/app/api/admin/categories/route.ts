import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const adminRole = (session.user as any).role;
    if (adminRole !== 'Admin' && adminRole !== 'Super Admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const adminId = (session.user as any).id;
    const body = await req.json();
    const { 
      id, 
      risk_level, 
      requires_admin_approval, 
      requires_deposit, 
      requires_insurance, 
      requires_permit 
    } = body;

    if (!id) {
      return NextResponse.json({ message: 'Missing category ID' }, { status: 400 });
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        risk_level,
        requires_admin_approval,
        requires_deposit,
        requires_insurance,
        requires_permit
      }
    });

    await createAuditLog({
      actor_user_id: adminId,
      action: 'CATEGORY_RULES_UPDATED',
      module: 'Categories',
      target_id: id,
      details: `Updated rules for ${updatedCategory.name}`
    });

    return NextResponse.json({ message: 'Category rules updated successfully' }, { status: 200 });

  } catch (error) {
    console.error('Category update error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
