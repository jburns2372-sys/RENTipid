import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { correctUserData } from '@/lib/privacy/privacy-workflow';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Server Session Identity Used
    const actorUserId = (session.user as any).id;
    const body = await req.json().catch(() => ({}));
    const targetUserId = body.targetUserId || actorUserId;
    const updates = body.updates || {};

    // Workflow enforces protected field rejection and cross user rejection
    await correctUserData(actorUserId, targetUserId, updates);

    return NextResponse.json({ success: true, updatedFields: Object.keys(updates) }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: (error as Error).message.includes('Unauthorized') ? 403 : 500 });
  }
}
