import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { requestAccountDeletion } from '@/lib/privacy/privacy-workflow';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { encryptPrivacyField } from '@/lib/privacy/encryption';

const DeletionPayloadSchema = z.object({
  targetUserId: z.string().optional(),
  requester_email: z.string().email('Invalid email').optional(),
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

    const parsed = DeletionPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const targetUserId = parsed.data.targetUserId || actorUserId;
    let encryptedEmail;
    if (parsed.data.requester_email) {
      encryptedEmail = encryptPrivacyField(parsed.data.requester_email);
    }

    // Workflow enforces holds and cross user rejection
    const result = await requestAccountDeletion(actorUserId, targetUserId, encryptedEmail);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: (error as Error).message.includes('Unauthorized') ? 403 : 400 });
  }
}
