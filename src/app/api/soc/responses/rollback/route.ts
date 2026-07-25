import { NextResponse } from 'next/server';
import { rollbackSecurityResponse, ExecutionError } from '@/lib/security/responses/execution.service';
import { requireAuth } from '@/lib/auth/requireAuth';

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { execution_id } = body;

    if (!execution_id) {
      return NextResponse.json({ error: 'Missing execution_id' }, { status: 400 });
    }

    const execution = await rollbackSecurityResponse(user.id, execution_id);

    return NextResponse.json(execution, { status: 200 });
  } catch (error: any) {
    if (error instanceof ExecutionError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }
    
    console.error('Rollback error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
