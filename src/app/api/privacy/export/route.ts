import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { exportUserData } from '@/lib/privacy/privacy-workflow';
import { authOptions } from '@/lib/auth'; // Ensure this matches actual auth path, typical NextAuth path

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Server Session Identity Used. Client supplied target ID is not trusted as authority.
    const actorUserId = (session.user as any).id;

    // Parse body for target ID if admin export is allowed, otherwise strictly self
    const body = await req.json().catch(() => ({}));
    const targetUserId = body.targetUserId || actorUserId;

    // The workflow layer enforces RBAC rechecks and ownership server-side
    const exportResult = await exportUserData(actorUserId, targetUserId);

    return NextResponse.json(exportResult, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: (error as Error).message.includes('Unauthorized') ? 403 : 500 });
  }
}
