import { NextResponse } from 'next/server';
import { rollbackSecurityResponse, ExecutionError } from '@/lib/security/responses/execution.service';
import { requireAuthenticatedUser, assertSecurityPermissionForService } from '@/lib/security/authorization';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';

export async function POST(req: Request, { params }: { params: Promise<{ executionId: string }> }) {
  try {
    const { executionId } = await params;
    const user = await requireAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await assertSecurityPermissionForService((user as any).id, SECURITY_PERMISSIONS.RESPONSE_ROLLBACK);
    if (!hasPermission) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    if (!executionId) {
      return NextResponse.json({ error: 'Missing execution ID' }, { status: 400 });
    }

    const execution = await rollbackSecurityResponse((user as any).id, executionId);

    return NextResponse.json(execution, { status: 200 });
  } catch (error: any) {
    if (error instanceof ExecutionError) {
      return NextResponse.json({ error: error.code }, { status: 409 });
    }
    
    console.error('Rollback error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
