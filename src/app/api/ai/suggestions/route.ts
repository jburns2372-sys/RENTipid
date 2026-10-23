import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SupportSuggestionEngine } from '@/lib/ai/suggestions/engine';
import { SupportInteractionTelemetry } from '@/lib/ai/analytics/SupportInteractionTelemetry';
import { getCanonicalQuestionSuggestions } from '@/lib/ai/context/canonical-intent-registry';

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
    const canonicalQuestions = await getCanonicalQuestionSuggestions(userRole);
    const existingQuestionTexts = new Set(result.questions.map(question => question.text.toLowerCase()));
    const questions = [...canonicalQuestions, ...result.questions]
      .filter(question => {
        const key = question.text.toLowerCase();
        if (existingQuestionTexts.has(key) && !question.id.startsWith('canonical:')) return false;
        existingQuestionTexts.add(key);
        return true;
      })
      .slice(0, 4);
    const mergedResult = { ...result, questions };

    const userId = (session?.user as any)?.id;
    const allSuggestions = [...mergedResult.topics, ...mergedResult.questions];
    await telemetry.recordSuggestionImpressions(userId, currentRoute, allSuggestions).catch(
      err => console.error('Failed to record suggestion impressions', err)
    );

    return NextResponse.json(mergedResult);
  } catch (error) {
    console.error('AI Suggestions Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
