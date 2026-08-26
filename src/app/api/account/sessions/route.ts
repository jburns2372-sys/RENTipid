import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/security/authorization';
import { resolveCurrentSessionBinding } from '@/lib/security/auth/mfa-session-assurance';
import { listActiveUserSessions } from '@/lib/auth/session-registry';

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const binding = await resolveCurrentSessionBinding();
    if (!binding || binding.userId !== user.id) return NextResponse.json({ error: 'Session unavailable' }, { status: 401 });
    const sessions = await listActiveUserSessions(user.id, binding.sessionKeyHash);
    return NextResponse.json({ sessions }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
}
