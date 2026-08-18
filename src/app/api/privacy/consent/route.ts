import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { withdrawConsent } from '@/lib/privacy/privacy-workflow';
import { authOptions } from '@/lib/auth';
import { ConsentWithdrawalPayloadSchema } from '@/lib/privacy/validation';

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
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const parsed = ConsentWithdrawalPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const purpose = parsed.data.purpose;

    const result = await withdrawConsent(actorUserId, purpose);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
