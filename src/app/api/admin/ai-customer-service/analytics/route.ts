import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  SupportAnalyticsError,
  SupportAnalyticsService,
} from '@/lib/ai/analytics/SupportAnalyticsService';

const analyticsService = new SupportAnalyticsService();

function sessionUserId(session: unknown) {
  if (!session || typeof session !== 'object' || !('user' in session)) return undefined;
  const user = session.user;
  if (!user || typeof user !== 'object' || !('id' in user) || typeof user.id !== 'string') return undefined;
  return user.id.trim() || undefined;
}

function errorResponse(error: unknown) {
  if (error instanceof SupportAnalyticsError) {
    const status = error.code === 'UNAUTHORIZED'
      ? 403
      : error.code === 'INVALID_RANGE'
        ? 400
        : 503;
    return NextResponse.json({ error: error.message }, { status });
  }
  console.error('AI Support Analytics Error:', error);
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = sessionUserId(session);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const range = new URL(req.url).searchParams.get('range') ?? '24h';
    const analytics = await analyticsService.getControlCenter(userId, range);
    return NextResponse.json({ analytics });
  } catch (error) {
    return errorResponse(error);
  }
}
