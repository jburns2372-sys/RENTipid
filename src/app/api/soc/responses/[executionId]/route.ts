import { NextResponse } from 'next/server';
import { requireAuthenticatedUser, assertSecurityPermissionForService, getValidSessionIdentity } from '@/lib/security/authorization';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, context: { params: Promise<{ executionId: string }> }) {
  try {
    const { executionId } = await context.params;
    const user = await requireAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await assertSecurityPermissionForService(getValidSessionIdentity({ user }), SECURITY_PERMISSIONS.RESPONSE_VIEW);
    if (!hasPermission) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    if (!executionId) {
      return NextResponse.json({ error: 'Missing execution ID' }, { status: 400 });
    }

    const execution = await prisma.securityResponseExecution.findUnique({
      where: { id: executionId },
      include: {
        actions: {
          orderBy: { sequence: 'asc' },
          select: {
            id: true,
            sequence: true,
            action_type: true,
            target_reference: true,
            status: true,
            executed_at: true,
            rolled_back_at: true,
            failure_metadata: true,
          }
        }
      }
    });

    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }

    // Exclude full idempotency key and other sensitive raw details from the response
    const { idempotency_key, lock_version, ...safeExecution } = execution;

    return NextResponse.json(safeExecution, { status: 200 });
  } catch (error: unknown) {
    console.error('Get execution error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
