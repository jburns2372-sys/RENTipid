import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { exportUserData } from '@/lib/privacy/privacy-workflow';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const ExportPayloadSchema = z.object({
  targetUserId: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as {id: string}).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const actorUserId = (session.user as {id: string}).id;

    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const parsed = ExportPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const targetUserId = parsed.data.targetUserId || actorUserId;

    // The workflow layer enforces RBAC rechecks and ownership server-side
    const exportResult = await exportUserData(actorUserId, targetUserId);

    return NextResponse.json(exportResult, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: (error as Error).message.includes('Unauthorized') ? 403 : 500 });
  }
}
