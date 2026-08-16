import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SupportAnalyticsService, SupportAnalyticsError } from '@/lib/ai/analytics/SupportAnalyticsService';

const analyticsService = new SupportAnalyticsService();

function sessionUserId(session: unknown) {
  if (!session || typeof session !== 'object' || !('user' in session)) return undefined;
  const user = session.user;
  if (!user || typeof user !== 'object' || !('id' in user) || typeof user.id !== 'string') return undefined;
  return user.id.trim() || undefined;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = sessionUserId(session);

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const traceId = searchParams.get('traceId');
    const range = searchParams.get('range') || '24h';

    const result = traceId
      ? await analyticsService.getTraceDetail(userId, traceId)
      : await analyticsService.getControlCenter(userId, range);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SupportAnalyticsError) {
      const status = error.code === 'UNAUTHORIZED' ? 403
        : error.code === 'INVALID_RANGE' ? 400
        : error.code === 'INVALID_TRACE_ID' ? 400
        : error.code === 'TRACE_NOT_FOUND' ? 404
        : error.code === 'FEATURE_DISABLED' ? 403
        : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error('AI Analytics Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
