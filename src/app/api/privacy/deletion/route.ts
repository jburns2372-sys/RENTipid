import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { requestAccountDeletion } from '@/lib/privacy/privacy-workflow';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Server Session Identity Used
    const actorUserId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const targetUserId = body.targetUserId || actorUserId;

    // Workflow enforces holds and cross user rejection
    const result = await requestAccountDeletion(actorUserId, targetUserId);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: (error as Error).message.includes('Unauthorized') ? 403 : 400 });
  }
}
