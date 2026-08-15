import { NextResponse } from 'next/server';
import { MediationService } from '@/lib/ai/mediation/MediationService';

export async function POST(request: Request) {
  const renterId = request.headers.get('x-user-id'); // Simulated auth
  if (!renterId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const { requestId, consequenceVersion, action } = await request.json();
    const service = MediationService.getInstance();

    if (action === 'CONFIRM') {
      const result = await service.confirmByRenter(requestId, renterId, consequenceVersion);
      return NextResponse.json({ success: true, result });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
