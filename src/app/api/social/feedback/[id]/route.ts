import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hasSocialPermission, SOCIAL_PERMISSIONS } from '../../../../../lib/social/social-permissions';
import { SocialFeedbackService } from '../../../../../lib/social/social-feedback-service';

const prisma = new PrismaClient();
const feedbackService = new SocialFeedbackService();

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const userId = request.headers.get('x-user-id') || 'test-user-id';
    const hasPerm = await hasSocialPermission(userId, SOCIAL_PERMISSIONS.VIEW);
    if (!hasPerm) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const feedback = await prisma.socialFeedback.findUnique({
      where: { id: params.id },
      include: {
        socialAccount: true,
        campaign: true,
        marketingPost: true
      }
    });

    if (!feedback) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data: feedback });
  } catch (error: any) {
    console.error('Failed to fetch social feedback', error);
    return NextResponse.json({ error: 'Failed to fetch social feedback' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const userId = request.headers.get('x-user-id') || 'test-user-id';
    const hasPerm = await hasSocialPermission(userId, SOCIAL_PERMISSIONS.FEEDBACK_RESPOND);
    if (!hasPerm) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const body = await request.json();
    const actorUserId = userId;
    
    // Actions:
    // override, escalate, request_draft
    const action = body.action;

    let result;
    if (action === 'override') {
      result = await feedbackService.overrideClassification(params.id, userId || 'unknown_admin', {
        sentiment: body.sentiment,
        severity: body.severity,
        topic: body.topic
      });
    } else if (action === 'escalate') {
      result = await feedbackService.escalateToCase(params.id, body.caseType, userId || undefined);
    } else if (action === 'request_draft') {
      const draft = await feedbackService.requestAiResponseDraft(params.id);
      return NextResponse.json({ data: { draft } });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Failed to update social feedback', error);
    return NextResponse.json({ error: 'Failed to update social feedback' }, { status: 500 });
  }
}
