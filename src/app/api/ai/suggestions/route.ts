import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SupportSuggestionEngine } from '@/lib/ai/suggestions/engine';

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

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Suggestions Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
