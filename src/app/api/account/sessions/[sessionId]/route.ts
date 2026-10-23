import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/security/authorization';
import { resolveCurrentSessionBinding } from '@/lib/security/auth/mfa-session-assurance';
import { revokeUserSession } from '@/lib/auth/session-registry';

export async function DELETE(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const user = await requireAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const binding = await resolveCurrentSessionBinding();
    const { sessionId } = await params;
    if (!binding || binding.userId !== user.id || !sessionId || sessionId.length > 100) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const result = await revokeUserSession(user.id, sessionId, binding.sessionKeyHash);
    if (!result.found) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (result.current) return NextResponse.json({ error: 'Use normal logout for the current session' }, { status: 400 });
    return NextResponse.json({ success: result.revoked });
  } catch { return NextResponse.json({ error: 'Unable to revoke session' }, { status: 500 }); }
}
