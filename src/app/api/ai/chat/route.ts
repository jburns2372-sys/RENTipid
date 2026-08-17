import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { processAICommand, AIRequest } from '@/lib/ai/ai-command-layer';
import { BotId } from '@/lib/ai/ai-permissions';
import { resolveCurrentAiActor, AiAuthorizationError } from '@/lib/ai/authorization/actor';
import { AiEntityAccessError } from '@/lib/ai/authorization/domain-state';
import { AiConversationContinuity } from '@/lib/ai/conversations/AiConversationContinuity';
import { SupportInteractionTelemetry } from '@/lib/ai/analytics/SupportInteractionTelemetry';
import { Prisma } from '@prisma/client';

const continuity = AiConversationContinuity.getInstance();
const telemetry = new SupportInteractionTelemetry();

function sessionUserId(session: unknown) {
  if (!session || typeof session !== 'object' || !('user' in session)) return undefined;
  const user = session.user;
  if (!user || typeof user !== 'object' || !('id' in user) || typeof user.id !== 'string') return undefined;
  return user.id.trim() || undefined;
}

function stringField(value: unknown, maxLength: number) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength ? value.trim() : undefined;
}

function errorResponse(error: unknown) {
  if (error instanceof AiAuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 });
  }
  if (error instanceof AiEntityAccessError || (error instanceof Error && error.message.includes('Unauthorized'))) {
    return NextResponse.json({ error: 'Conversation or entity access denied' }, { status: 403 });
  }
  if (error instanceof Error && error.message.includes('not found')) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }
  console.error('AI Chat Error:', error);
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = sessionUserId(session);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    await resolveCurrentAiActor(userId);

    const url = new URL(req.url);
    const conversationId = stringField(url.searchParams.get('conversationId'), 200);
    const module = stringField(url.searchParams.get('module'), 100);
    const recordId = stringField(url.searchParams.get('recordId'), 200);
    const history = await continuity.getResumableHistory(userId, conversationId, module, recordId);

    if (!history) return NextResponse.json({ conversationId: null, caseId: null, messages: [] });
    return NextResponse.json({
      conversationId: history.conversation.id,
      caseId: history.conversation.activeCaseId,
      messages: history.messages.map(message => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const botId = stringField(body.botId, 100);
    const prompt = stringField(body.prompt, 10_000);
    const module = stringField(body.module, 100);
    const recordId = stringField(body.recordId, 200);
    const requestedConversationId = stringField(body.conversationId, 200);
    const channel = stringField(body.channel, 50) ?? 'text';

    if (!botId || !prompt || !module) {
      return NextResponse.json({ error: 'Missing or invalid botId, prompt, or module.' }, { status: 400 });
    }

    const userId = sessionUserId(session);
    const actor = userId ? await resolveCurrentAiActor(userId) : null;
    let persisted: Awaited<ReturnType<typeof continuity.continueForMessage>> | null = null;
    let userMessageId: string | undefined;
    let conversationContext: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (actor) {
      persisted = await continuity.continueForMessage({
        userId: actor.id,
        prompt,
        module,
        recordId,
        channel,
        conversationId: requestedConversationId,
      });
      const priorHistory = await continuity.getResumableHistory(actor.id, persisted.conversation.id);
      conversationContext = (priorHistory?.messages ?? [])
        .filter((message): message is typeof message & { role: 'user' | 'assistant' } =>
          message.role === 'user' || message.role === 'assistant')
        .slice(-6)
        .map(message => ({ role: message.role, content: message.content.slice(0, 2_000) }));
      const userMessage = await continuity.appendMessage(persisted.conversation.id, actor.id, 'user', prompt, channel);
      userMessageId = userMessage.id;
    }

    const aiRequest: AIRequest = {
      botId: botId as BotId,
      prompt,
      module,
      recordId,
      userRole: actor?.role ?? 'Guest',
      userId: actor?.id,
      sessionId: persisted?.conversation.id,
      caseId: persisted?.supportCase.id,
      conversationContext,
    };
    
    const startedAt = Date.now();
    const result = await processAICommand(aiRequest);
    const latencyMs = Date.now() - startedAt;

    if (persisted && actor) {
      const persistedTrace = result.trace ? {
        ...result.trace,
        conversationId: persisted.conversation.id,
        caseId: persisted.supportCase.id,
        finalResponseRef: result.trace.traceId,
      } : null;
      const safePayload: Prisma.InputJsonObject = {
        isBlocked: !!result.isBlocked,
        ...(persistedTrace
          ? { specialistTrace: JSON.parse(JSON.stringify(persistedTrace)) as Prisma.InputJsonObject }
          : {}),
        ...(result.grounding
          ? { grounding: JSON.parse(JSON.stringify(result.grounding)) as Prisma.InputJsonObject }
          : {}),
      };
      const assistantMessage = await continuity.appendMessage(
        persisted.conversation.id,
        actor.id,
        'assistant',
        result.message,
        channel,
        undefined,
        safePayload,
        result.trace?.traceId,
      );

      // Record non-behavioral telemetry
      await telemetry.recordInput({
        userId: actor.id,
        conversationId: persisted.conversation.id,
        caseId: persisted.supportCase.id,
        messageId: userMessageId,
        source: 'FREE_TEXT',
        route: module,
        intent: result.trace?.intent,
        specialistId: result.trace?.selectedSpecialist,
      }).catch(err => console.error('Telemetry input recording failed', err));

      await telemetry.recordResponse({
        userId: actor.id,
        conversationId: persisted.conversation.id,
        caseId: persisted.supportCase.id,
        messageId: assistantMessage.id,
        source: 'FREE_TEXT',
        route: module,
        intent: result.trace?.intent,
        specialistId: result.trace?.selectedSpecialist,
        latencyMs,
        outcome: result.isBlocked ? 'BLOCKED' : result.success ? 'SUCCESS' : 'FAILED',
      }).catch(err => console.error('Telemetry response recording failed', err));
    }

    const response = NextResponse.json({
      message: result.message,
      isBlocked: !!result.isBlocked,
      conversationId: persisted?.conversation.id ?? null,
      caseId: persisted?.supportCase.id ?? null,
    });
    if (persisted && result.trace) {
      response.headers.set('x-rentipid-ai-trace-id', result.trace.traceId);
    }
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
