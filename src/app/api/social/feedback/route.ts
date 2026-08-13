import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hasSocialPermission, SOCIAL_PERMISSIONS } from '../../../../lib/social/social-permissions';
import { SocialFeedbackService } from '../../../../lib/social/social-feedback-service';
import { MockSocialAdapter } from '../../../../lib/social/social-adapters/mock-social-adapter'; // Mocking real hook behavior

const prisma = new PrismaClient();
const feedbackService = new SocialFeedbackService();

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id') || 'test-user-id';
    const hasPerm = await hasSocialPermission(userId, SOCIAL_PERMISSIONS.VIEW);
    if (!hasPerm) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    
    // Simulate real DB fetch
    const feedbacks = await prisma.socialFeedback.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { created_at: 'desc' },
      take: 50
    });

    return NextResponse.json({ data: feedbacks });
  } catch (error: any) {
    console.error('Failed to fetch social feedback', error);
    return NextResponse.json({ error: 'Failed to fetch social feedback' }, { status: 500 });
  }
}

// MOCK POST endpoint to simulate webhook ingestion from a provider
export async function POST(request: Request) {
  try {
    // In real env, provider webhooks validate signature here, not checkPermission
    // For now we just let this mock endpoint ingest
    const body = await request.json();
    
    const feedback = await feedbackService.ingestFeedback({
      provider: body.provider || 'MOCK',
      provider_feedback_id: body.provider_feedback_id || `fb_mock_${Date.now()}`,
      feedback_type: body.feedback_type || 'COMMENT',
      raw_text: body.raw_text,
      social_account_id: body.social_account_id,
      author_provider_id: body.author_provider_id
    });
    
    return NextResponse.json({ data: feedback });
  } catch (error: any) {
    console.error('Failed to ingest social feedback', error);
    return NextResponse.json({ error: 'Failed to ingest social feedback' }, { status: 500 });
  }
}
