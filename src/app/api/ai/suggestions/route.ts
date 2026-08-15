import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SupportSuggestionEngine } from '@/lib/ai/suggestions/engine';
import { SupportInteractionTelemetry } from '@/lib/ai/analytics/SupportInteractionTelemetry';

const telemetry = new SupportInteractionTelemetry();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Fallback to Guest if unauthenticated
    const userRole = (session?.user as any)?.role || 'Guest';

    // Optional: Extract route and lifecycle from query params if passed
    const { searchParams } = new URL(req.url);
    const currentRoute = searchParams.get('route') || undefined;
    const lifecycle = searchParams.get('lifecycle') || undefined;

    const result = SupportSuggestionEngine.getSuggestions({ userRole, currentRoute, lifecycle });

    const userId = (session?.user as any)?.id;
    const allSuggestions = [...result.topics, ...result.questions];
    await telemetry.recordSuggestionImpressions(userId, currentRoute, allSuggestions).catch(
      err => console.error('Failed to record suggestion impressions', err)
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Suggestions Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
