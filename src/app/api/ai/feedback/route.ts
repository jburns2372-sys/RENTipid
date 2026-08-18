import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  SupportFeedbackError,
  SupportFeedbackService,
} from '@/lib/ai/feedback/SupportFeedbackService';

const feedbackService = new SupportFeedbackService();

function sessionUserId(session: unknown) {
  if (!session || typeof session !== 'object' || !('user' in session)) return undefined;
  const user = session.user;
  if (!user || typeof user !== 'object' || !('id' in user) || typeof user.id !== 'string') return undefined;
  return user.id.trim() || undefined;
}

function errorResponse(error: unknown) {
  if (error instanceof SupportFeedbackError) {
    const status = error.code === 'UNAUTHENTICATED'
      ? 401
      : error.code === 'UNAUTHORIZED'
        ? 403
        : error.code === 'NOT_FOUND'
          ? 404
          : error.code === 'FEATURE_DISABLED'
            ? 503
            : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  console.error('AI Feedback Error:', error);
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = sessionUserId(session);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const body = await req.json();
    const result = await feedbackService.submit(userId, {
      messageId: body?.messageId,
      rating: body?.rating,
      reason: body?.reason,
      comment: body?.comment,
    });
    return NextResponse.json({ feedback: result });
  } catch (error) {
    return errorResponse(error);
  }
}
