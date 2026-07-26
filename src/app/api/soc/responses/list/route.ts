import { NextResponse } from 'next/server';
import { requireAuthenticatedUser, assertSecurityPermissionForService, getValidSessionIdentity } from '@/lib/security/authorization';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const user = await requireAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await assertSecurityPermissionForService(getValidSessionIdentity({ user }), SECURITY_PERMISSIONS.RESPONSE_VIEW);
    if (!hasPermission) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const executions = await prisma.securityResponseExecution.findMany({
      take: Math.min(limit, 100),
      skip: offset,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        incident_case_id: true,
        playbook_id: true,
        playbook_version: true,
        response_type: true,
        target_type: true,
        target_id: true,
        status: true,
        requested_by_id: true,
        executed_by_id: true,
        started_at: true,
        completed_at: true,
        failed_at: true,
        rolled_back_at: true,
        failure_code: true,
        created_at: true,
      }
    });

    const total = await prisma.securityResponseExecution.count();

    return NextResponse.json({ data: executions, total }, { status: 200 });
  } catch (error: any) {
    console.error('List responses error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

