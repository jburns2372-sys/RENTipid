import { NextResponse } from 'next/server';
import { revokeCurrentSessionAal2 } from '@/lib/security/auth/mfa-session-assurance';
import { resolveCurrentSessionBinding } from '@/lib/security/auth/mfa-session-assurance';
import { revokeCurrentUserSession } from '@/lib/auth/session-registry';

export async function POST() {
  await revokeCurrentSessionAal2();
  const binding = await resolveCurrentSessionBinding();
  if (binding) await revokeCurrentUserSession(binding);

  const response = NextResponse.json({ success: true });
  response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  response.cookies.set('mfa_step_up', '', {
    path: '/',
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return response;
}
