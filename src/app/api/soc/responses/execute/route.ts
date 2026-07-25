import { NextResponse } from 'next/server';
import { executeSecurityResponse, ExecutionError } from '@/lib/security/responses/execution.service';
import { requireAuth } from '@/lib/auth/requireAuth';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';
import { SecurityResponseActionType } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { incident_case_id, playbook_id, playbook_version, approval_grant_id, response_type, target_type, target_id } = body;

    if (!incident_case_id || !playbook_id || !playbook_version || !approval_grant_id || !response_type || !target_type || !target_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const execution = await executeSecurityResponse(user.id, {
      incident_case_id,
      playbook_id,
      playbook_version,
      approval_grant_id,
      response_type: response_type as SecurityResponseActionType,
      target_type,
      target_id
    });

    return NextResponse.json(execution, { status: 200 });
  } catch (error: any) {
    if (error instanceof ExecutionError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }
    
    console.error('Execution error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
