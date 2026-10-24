import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/security/authorization';
import { resolveCurrentSessionBinding } from '@/lib/security/auth/mfa-session-assurance';
import { revokeOtherUserSessions } from '@/lib/auth/session-registry';

export async function POST() {
  try {
    const user = await requireAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const binding = await resolveCurrentSessionBinding();
    if (!binding || binding.userId !== user.id) return NextResponse.json({ error: 'Session unavailable' }, { status: 401 });
    const revokedCount = await revokeOtherUserSessions(user.id, binding.sessionKeyHash);
    return NextResponse.json({ success: true, revokedCount });
  } catch { return NextResponse.json({ error: 'Unable to revoke sessions' }, { status: 500 }); }
}
