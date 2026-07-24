import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/security/authorization';
import { PrismaClient } from '@prisma/client';
import { getApprovalDetail } from '@/lib/security/approvals/approval-read.service';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const user = await requireAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const userId = (user as { id: string }).id;
    
    const result = await getApprovalDetail(prisma, userId, params.requestId);
    if (!result) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes('PERMISSION_DENIED')) {
      return NextResponse.json({ error: "PERMISSION_DENIED" }, { status: 403 });
    }
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
