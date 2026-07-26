import { NextResponse } from 'next/server';
import { executeSecurityResponse, ExecutionError } from '@/lib/security/responses/execution.service';
import { requireAuthenticatedUser, assertSecurityPermissionForService, getValidSessionIdentity } from '@/lib/security/authorization';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';
import { SecurityResponseActionType } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const user = await requireAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await assertSecurityPermissionForService(getValidSessionIdentity({ user }), SECURITY_PERMISSIONS.RESPONSE_EXECUTE);
    if (!hasPermission) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await req.json();
    const { incident_case_id, playbook_id, playbook_version, approval_grant_id, response_type, target_type, target_id, idempotency_key } = body;

    if (!incident_case_id || !playbook_id || !playbook_version || !approval_grant_id || !response_type || !target_type || !target_id || !idempotency_key) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const execution = await executeSecurityResponse(getValidSessionIdentity({ user }), {
      incident_case_id,
      playbook_id,
      playbook_version,
      approval_grant_id,
      response_type: response_type as SecurityResponseActionType,
      target_type,
      target_id,
      idempotency_key
    });

    return NextResponse.json(execution, { status: 200 });
  } catch (error: any) {
    if (error instanceof ExecutionError) {
      return NextResponse.json({ error: error.code }, { status: 409 });
    }
    
    console.error('Execution error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
