import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { escalateToDPO } from '@/lib/privacy/privacy-workflow';
import { authOptions } from '@/lib/auth';
import { DpoEscalationPayloadSchema } from '@/lib/privacy/validation';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';
import { assertSecurityPermissionForService } from '@/lib/security/authorization';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as {id: string}).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; role?: string };
    const hasEscalate = await assertSecurityPermissionForService(user.id, SECURITY_PERMISSIONS.PRIVACY_REQUEST_ESCALATE_DPO);
    
    if (!hasEscalate) {
      await createAuditLog({
        actor_user_id: user.id,
        action: 'DPO_ESCALATION_DENIED',
        module: 'Privacy',
        target_id: undefined,
        details: 'Unauthorized attempt to escalate to DPO'
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body = {};
    try {
      body = await req.json();
    } catch {}

    const parsed = DpoEscalationPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const result = await escalateToDPO(user.id, parsed.data.requestId, parsed.data.reason);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
