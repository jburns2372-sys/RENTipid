import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { withdrawConsent } from '@/lib/privacy/privacy-workflow';
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
    const purpose = body.purpose;
    
    if (!purpose) {
      return NextResponse.json({ error: 'Missing purpose' }, { status: 400 });
    }
    
    const result = await withdrawConsent(actorUserId, purpose);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
