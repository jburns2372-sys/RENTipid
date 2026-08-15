import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { suggestionRegistry, SupportSuggestion } from '../suggestions/registry';

const ANALYTICS_FEATURE_KEY = 'ai_module_analytics_enabled';

export const INTERACTION_SOURCES = [
  'SUGGESTION',
  'TOPIC_CHIP',
  'FREE_TEXT',
  'CONTEXTUAL_ENTRY',
  'PROACTIVE_FOLLOWUP',
] as const;
export type InteractionSource = (typeof INTERACTION_SOURCES)[number];

function bounded(value: string | undefined, maximum: number) {
  const normalized = value?.trim();
  return normalized && normalized.length <= maximum ? normalized : undefined;
}

function isInteractionSource(value: unknown): value is InteractionSource {
  return typeof value === 'string' && (INTERACTION_SOURCES as readonly string[]).includes(value);
}

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export interface InteractionContext {
  userId?: string;
  conversationId?: string;
  messageId?: string;
  caseId?: string;
  source: InteractionSource;
  suggestionId?: string;
  route?: string;
  intent?: string;
  specialistId?: string;
}

export class SupportInteractionTelemetry {
  constructor(private readonly db: PrismaClient = prisma) {}

  async isEnabled() {
    const setting = await this.db.systemSetting.findUnique({
      where: { setting_key: ANALYTICS_FEATURE_KEY },
      select: { setting_value: true },
    });
    return setting?.setting_value.trim().toLowerCase() === 'true';
  }

  normalizeSource(value: unknown): InteractionSource {
    return isInteractionSource(value) ? value : 'FREE_TEXT';
  }

  async recordSuggestionImpressions(
    userId: string | undefined,
    route: string | undefined,
    suggestions: Array<Pick<SupportSuggestion, 'id' | 'type' | 'intent'>>,
  ) {
    if (!(await this.isEnabled()) || suggestions.length === 0) return 0;
    const safeRoute = bounded(route, 200);
    const result = await this.db.aiInteractionEvent.createMany({
      data: suggestions.map(suggestion => ({
        userId,
        eventType: 'SUGGESTION_IMPRESSION',
        interactionSource: suggestion.type === 'topic' ? 'TOPIC_CHIP' : 'SUGGESTION',
        suggestionId: suggestion.id,
        route: safeRoute,
        intent: bounded(suggestion.intent, 100),
        outcome: 'PRESENTED',
      })),
    });
    return result.count;
  }

  async recordInput(context: InteractionContext) {
    if (!(await this.isEnabled())) return null;
    const suggestion = this.validateSuggestionContext(context.source, context.suggestionId);
    return this.createIdempotent({
      userId: context.userId,
      conversationId: context.conversationId,
      messageId: context.messageId,
      caseId: context.caseId,
      eventType: 'INPUT_SUBMITTED',
      interactionSource: context.source,
      suggestionId: suggestion?.id,
      route: bounded(context.route, 200),
      intent: bounded(context.intent ?? suggestion?.intent, 100),
      specialistId: bounded(context.specialistId, 100),
      outcome: 'ACCEPTED',
      idempotencyKey: context.messageId ? `ai-input-v1:${context.messageId}` : undefined,
    });
  }

  async recordResponse(
    context: Omit<InteractionContext, 'source'> & {
      source: InteractionSource;
      latencyMs: number;
      outcome: 'SUCCESS' | 'BLOCKED' | 'FAILED';
      knowledgeMatched?: boolean;
      knowledgeSourceKey?: string;
      knowledgeChunkKey?: string;
      toolExecutionId?: string;
    },
  ) {
    if (!(await this.isEnabled())) return null;
    const latencyMs = Number.isInteger(context.latencyMs) && context.latencyMs >= 0
      ? Math.min(context.latencyMs, 10 * 60 * 1000)
      : null;
    return this.createIdempotent({
      userId: context.userId,
      conversationId: context.conversationId,
      messageId: context.messageId,
      caseId: context.caseId,
      eventType: 'AI_RESPONSE',
      interactionSource: context.source,
      suggestionId: bounded(context.suggestionId, 200),
      route: bounded(context.route, 200),
      intent: bounded(context.intent, 100),
      specialistId: bounded(context.specialistId, 100),
      knowledgeSourceKey: bounded(context.knowledgeSourceKey, 200),
      knowledgeChunkKey: bounded(context.knowledgeChunkKey, 200),
      toolExecutionId: bounded(context.toolExecutionId, 200),
      responseLatencyMs: latencyMs,
      knowledgeMatched: context.knowledgeMatched,
      outcome: context.outcome,
      idempotencyKey: context.messageId ? `ai-response-v1:${context.messageId}` : undefined,
    });
  }

  private validateSuggestionContext(source: InteractionSource, suggestionId: string | undefined) {
    if (source !== 'SUGGESTION' && source !== 'TOPIC_CHIP') return undefined;
    const safeId = bounded(suggestionId, 200);
    const suggestion = safeId ? suggestionRegistry.find(item => item.id === safeId && item.status === 'enabled') : undefined;
    const expectedType = source === 'TOPIC_CHIP' ? 'topic' : 'question';
    if (!suggestion || suggestion.type !== expectedType) {
      throw new Error('INVALID_SUGGESTION_CONTEXT');
    }
    return suggestion;
  }

  private async createIdempotent(data: Prisma.AiInteractionEventUncheckedCreateInput) {
    try {
      return await this.db.aiInteractionEvent.create({ data });
    } catch (error) {
      if (!isUniqueConflict(error) || !data.idempotencyKey) throw error;
      return this.db.aiInteractionEvent.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
    }
  }
}
