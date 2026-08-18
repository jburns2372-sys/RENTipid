import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processPrivacyRequest } from '@/lib/privacy/privacy-workflow';
import { encryptPrivacyField } from '@/lib/privacy/encryption';
import { PrivacyRequestPayloadSchema } from '@/lib/privacy/validation';
import { prisma } from '@/lib/prisma';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';
import { assertSecurityPermissionForService } from '@/lib/security/authorization';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('userId');
  const user = session.user as { id: string; role?: string };

  if (targetUserId && targetUserId !== user.id) {
    const hasReadAll = await assertSecurityPermissionForService(user.id, SECURITY_PERMISSIONS.PRIVACY_REQUEST_READ_ALL);
    const hasManage = await assertSecurityPermissionForService(user.id, SECURITY_PERMISSIONS.PRIVACY_REQUEST_MANAGE);
    
    if (!hasReadAll && !hasManage) {
      // Intentionally do not disclose whether the target user exists
      await createAuditLog({
        actor_user_id: user.id,
        action: 'DSR_ACCESS_DENIED',
        module: 'Privacy',
        target_id: targetUserId,
        details: 'Unauthorized cross-user access attempt to DSR'
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const queryUserId = targetUserId || user.id;

  const requests = await prisma.dataSubjectRequest.findMany({ 
    where: { user_id: queryUserId }, 
    orderBy: { created_at: 'desc' } 
  });

  return NextResponse.json({ data: requests });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const user = session.user as { id: string; role?: string };
  
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }
  
  const parsed = PrivacyRequestPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }
  
  try {
    let encryptedEmail;
    if (parsed.data.requester_email) {
      encryptedEmail = encryptPrivacyField(parsed.data.requester_email);
    }

    const result = await processPrivacyRequest(
      user.id, 
      parsed.data.request_type, 
      user.id,
      encryptedEmail,
      parsed.data.requester_message
    );
    
    return NextResponse.json({ success: true, referenceNumber: result.reference_number });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed processing request' }, { status: 500 });
  }
}
