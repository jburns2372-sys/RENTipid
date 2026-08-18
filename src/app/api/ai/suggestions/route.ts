import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SupportSuggestionEngine } from '@/lib/ai/suggestions/engine';
import { resolveCurrentAiActor } from '@/lib/ai/authorization/actor';
import { SupportInteractionTelemetry } from '@/lib/ai/analytics/SupportInteractionTelemetry';

const telemetry = new SupportInteractionTelemetry();

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
    const actor = userId ? await resolveCurrentAiActor(userId) : null;
    const userRole = actor?.role ?? 'Guest';

    // Optional: Extract route and lifecycle from query params if passed
    const { searchParams } = new URL(req.url);
    const currentRoute = searchParams.get('route') || undefined;
    const lifecycle = searchParams.get('lifecycle') || undefined;

    const result = SupportSuggestionEngine.getSuggestions({ userRole, currentRoute, lifecycle });
    try {
      await telemetry.recordSuggestionImpressions(
        actor?.id,
        currentRoute,
        [...result.questions, ...result.topics],
      );
    } catch (telemetryError) {
      console.error('AI suggestion telemetry failed:', telemetryError);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Suggestions Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
