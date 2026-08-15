import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hasPermission, UserRole } from '@/lib/permissions';

const ANALYTICS_FEATURE_KEY = 'ai_module_analytics_enabled';
const TERMINAL_CASE_STATES = ['RESOLVED', 'CLOSED', 'SYSTEM_BLOCKED'];

export const SUPPORT_ANALYTICS_RANGES = ['24h', '7d', '30d'] as const;
export type SupportAnalyticsRange = (typeof SUPPORT_ANALYTICS_RANGES)[number];
export type MetricStatus = 'IMPLEMENTED' | 'DERIVABLE_NOW' | 'NOT_CURRENTLY_MEASURABLE' | 'DEFERRED';

export class SupportAnalyticsError extends Error {
  constructor(message: string, readonly code: 'UNAUTHORIZED' | 'FEATURE_DISABLED' | 'INVALID_RANGE') {
    super(message);
    this.name = 'SupportAnalyticsError';
  }
}

function metric<T>(value: T | null, source: string, status: MetricStatus = 'IMPLEMENTED') {
  return { status, value, source };
}

function percentage(numerator: number, denominator: number) {
  return denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(2)) : null;
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[middle - 1] + sorted[middle]) / 2)
    : sorted[middle];
}

function percentile(values: number[], percentileValue: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1)];
}

function grouped(values: Array<string | null | undefined>) {
  const counts: Record<string, number> = {};
  for (const value of values) {
    const key = value?.trim();
    if (key) counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function utcStartOfDay(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function rangeStart(range: SupportAnalyticsRange, now: Date) {
  const milliseconds = range === '24h'
    ? 24 * 60 * 60 * 1000
    : range === '7d'
      ? 7 * 24 * 60 * 60 * 1000
      : 30 * 24 * 60 * 60 * 1000;
  return new Date(now.getTime() - milliseconds);
}

function isRange(value: unknown): value is SupportAnalyticsRange {
  return typeof value === 'string' && (SUPPORT_ANALYTICS_RANGES as readonly string[]).includes(value);
}

export class SupportAnalyticsService {
  constructor(
    private readonly db: PrismaClient = prisma,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async getControlCenter(actorUserId: string | undefined, requestedRange: unknown) {
    if (!actorUserId?.trim()) throw new SupportAnalyticsError('Authentication required', 'UNAUTHORIZED');
    if (!isRange(requestedRange)) throw new SupportAnalyticsError('Range must be 24h, 7d, or 30d', 'INVALID_RANGE');

    const actor = await this.db.user.findUnique({
      where: { id: actorUserId },
      select: { role: true, status: true },
    });
    if (
      !actor
      || actor.status.trim().toLowerCase() !== 'verified'
      || !hasPermission(actor.role as UserRole, 'audit_logs', 'read')
    ) {
      throw new SupportAnalyticsError('Administrative analytics access denied', 'UNAUTHORIZED');
    }
    const feature = await this.db.systemSetting.findUnique({
      where: { setting_key: ANALYTICS_FEATURE_KEY },
      select: { setting_value: true },
    });
    if (feature?.setting_value.trim().toLowerCase() !== 'true') {
      throw new SupportAnalyticsError('AI support analytics is disabled', 'FEATURE_DISABLED');
    }

    const now = this.clock();
    const from = rangeStart(requestedRange, now);
    const today = utcStartOfDay(now);
    const [
      conversationsToday,
      assistantMessages,
      cases,
      resolvedCases,
      feedback,
      events,
      resolutions,
      toolFailures,
      providerSessions,
      followUpBacklog,
      policyConflicts,
      knowledgeSources,
      digitalSessions,
      auditLogs,
      blockedAiLogs,
    ] = await Promise.all([
      this.db.aiConversation.count({ where: { createdAt: { gte: today, lte: now } } }),
      this.db.aiMessage.count({ where: { role: 'assistant', createdAt: { gte: from, lte: now } } }),
      this.db.aiSupportCase.findMany({
        where: { lastActivityAt: { lte: now } },
        select: { id: true, status: true, category: true, openedAt: true, resolvedAt: true, lastActivityAt: true },
      }),
      this.db.aiSupportCase.findMany({
        where: { resolvedAt: { gte: from, lte: now }, status: { in: ['RESOLVED', 'CLOSED'] } },
        select: { id: true, openedAt: true, resolvedAt: true },
      }),
      this.db.aiInteractionFeedback.findMany({
        where: { createdAt: { gte: from, lte: now } },
        select: { messageId: true, rating: true },
      }),
      this.db.aiInteractionEvent.findMany({
        where: { createdAt: { gte: from, lte: now } },
        select: {
          eventType: true,
          interactionSource: true,
          suggestionId: true,
          route: true,
          intent: true,
          specialistId: true,
          knowledgeSourceKey: true,
          knowledgeChunkKey: true,
          toolExecutionId: true,
          responseLatencyMs: true,
          knowledgeMatched: true,
          outcome: true,
          caseId: true,
          messageId: true,
        },
      }),
      this.db.aiResolution.findMany({
        where: { resolutionType: 'final', resolutionStatus: 'executed', verifiedAt: { gte: from, lte: now } },
        select: { caseId: true },
      }),
      this.db.aiToolExecution.count({
        where: { startedAt: { gte: from, lte: now }, executionStatus: { in: ['failed', 'blocked'] } },
      }),
      this.db.aiProviderSession.findMany({
        where: { createdAt: { gte: from, lte: now } },
        select: { status: true, provider: true },
      }),
      this.db.aiFollowUp.count({ where: { status: 'pending', triggerAt: { lte: now } } }),
      this.db.aiPolicyDecision.count({
        where: { createdAt: { gte: from, lte: now }, decision: { in: ['denied', 'hold'] } },
      }),
      this.db.aiKnowledgeSource.findMany({
        select: { status: true, approvalStatus: true, effectiveUntil: true },
      }),
      this.db.aiServiceSession.findMany({
        where: { startedAt: { gte: from, lte: now }, channel: 'digital_human' },
        select: { status: true },
      }),
      this.db.auditLog.findMany({
        where: {
          created_at: { gte: from, lte: now },
          action: {
            in: [
              'AI_FEEDBACK_DENIED_OWNERSHIP',
              'TOOL_PROHIBITED_DENIAL',
              'TOOL_RBAC_DENIAL',
            ],
          },
        },
        select: { action: true },
      }),
      this.db.aIBotLog.count({
        where: { created_at: { gte: from, lte: now }, action_status: 'Blocked' },
      }),
    ]);

    const activeCases = cases.filter(item => !TERMINAL_CASE_STATES.includes(item.status)).length;
    const safeHolds = cases.filter(item => item.status === 'SAFE_HOLD' && item.lastActivityAt >= from).length;
    const systemBlocked = cases.filter(item => item.status === 'SYSTEM_BLOCKED' && item.lastActivityAt >= from).length;
    const positive = feedback.filter(item => item.rating === 'THUMBS_UP').length;
    const negative = feedback.filter(item => item.rating === 'THUMBS_DOWN').length;
    const totalFeedback = positive + negative;
    const resolvedIds = new Set(resolvedCases.map(item => item.id));
    const verifiedAutonomous = new Set(resolutions.map(item => item.caseId).filter(caseId => resolvedIds.has(caseId))).size;
    const resolutionDurations = resolvedCases
      .filter((item): item is typeof item & { resolvedAt: Date } => item.resolvedAt !== null)
      .map(item => Math.max(0, item.resolvedAt.getTime() - item.openedAt.getTime()));

    const impressions = events.filter(item => item.eventType === 'SUGGESTION_IMPRESSION').length;
    const inputEvents = events.filter(item => item.eventType === 'INPUT_SUBMITTED');
    const suggestionInputs = inputEvents.filter(item => item.interactionSource === 'SUGGESTION');
    const topicInputs = inputEvents.filter(item => item.interactionSource === 'TOPIC_CHIP');
    const freeTextInputs = inputEvents.filter(item => item.interactionSource === 'FREE_TEXT');
    const contextualInputs = inputEvents.filter(item => item.interactionSource === 'CONTEXTUAL_ENTRY');
    const proactiveInputs = inputEvents.filter(item => item.interactionSource === 'PROACTIVE_FOLLOWUP');
    const suggestionResolvedCases = new Set(
      suggestionInputs.map(item => item.caseId).filter((caseId): caseId is string => !!caseId && resolvedIds.has(caseId)),
    ).size;
    const responseEvents = events.filter(item => item.eventType === 'AI_RESPONSE');
    const latencyValues = responseEvents
      .map(item => item.responseLatencyMs)
      .filter((value): value is number => value !== null);
    const knowledgeMeasured = responseEvents.filter(item => item.knowledgeMatched !== null);
    const noKnowledgeMatch = knowledgeMeasured.filter(item => item.knowledgeMatched === false).length;
    const responseFailures = responseEvents.filter(item => item.outcome === 'FAILED' || item.outcome === 'BLOCKED').length;
    const feedbackEventMap = new Map(
      responseEvents.filter(item => item.messageId).map(item => [item.messageId!, item]),
    );
    const feedbackEvents = feedback.map(item => feedbackEventMap.get(item.messageId)).filter(Boolean);
    const staleKnowledge = knowledgeSources.filter(source =>
      ['SUPERSEDED', 'ARCHIVED', 'RETIRED'].includes(source.status)
      || (source.effectiveUntil !== null && source.effectiveUntil <= now),
    ).length;
    const providerFailures = providerSessions.filter(session => session.status === 'failed').length;
    const crossUserDenials = auditLogs.filter(log => log.action === 'AI_FEEDBACK_DENIED_OWNERSHIP').length;
    const prohibitedTools = auditLogs.filter(log => log.action === 'TOOL_PROHIBITED_DENIAL').length;
    const toolRbacDenials = auditLogs.filter(log => log.action === 'TOOL_RBAC_DENIAL').length;

    return {
      contractVersion: 'p7a.1',
      range: requestedRange,
      from: from.toISOString(),
      to: now.toISOString(),
      executive: {
        conversationsToday: metric(conversationsToday, 'AiConversation.createdAt UTC day'),
        activeCases: metric(activeCases, 'AiSupportCase current non-terminal status'),
        resolvedCases: metric(resolvedCases.length, 'AiSupportCase.resolvedAt within range'),
        autonomousResolutionRate: metric(
          percentage(verifiedAutonomous, resolvedCases.length),
          'Verified executed final AiResolution / resolved AiSupportCase',
        ),
        medianResolutionTimeMs: metric(median(resolutionDurations), 'AiSupportCase.resolvedAt - openedAt'),
        positiveFeedback: metric(positive, 'AiInteractionFeedback.rating'),
        negativeFeedback: metric(negative, 'AiInteractionFeedback.rating'),
        positiveFeedbackPercent: metric(percentage(positive, totalFeedback), 'Positive / all feedback'),
        negativeFeedbackPercent: metric(percentage(negative, totalFeedback), 'Negative / all feedback'),
        feedbackRate: metric(percentage(totalFeedback, assistantMessages), 'Feedback rows / assistant AiMessage count'),
      },
      discovery: {
        suggestionImpressions: metric(impressions, 'AiInteractionEvent.SUGGESTION_IMPRESSION'),
        suggestionClicks: metric(suggestionInputs.length, 'AiInteractionEvent INPUT_SUBMITTED/SUGGESTION'),
        suggestionSelectionRate: metric(percentage(suggestionInputs.length, impressions), 'Suggestion clicks / impressions'),
        suggestionResolvedCases: metric(suggestionResolvedCases, 'Suggestion input caseId joined to resolved AiSupportCase'),
        topicChipUsage: metric(topicInputs.length, 'AiInteractionEvent INPUT_SUBMITTED/TOPIC_CHIP'),
        freeTextUsage: metric(freeTextInputs.length, 'AiInteractionEvent INPUT_SUBMITTED/FREE_TEXT'),
        contextualEntryUsage: metric(contextualInputs.length, 'AiInteractionEvent INPUT_SUBMITTED/CONTEXTUAL_ENTRY'),
        proactiveFollowUpUsage: metric(proactiveInputs.length, 'AiInteractionEvent INPUT_SUBMITTED/PROACTIVE_FOLLOWUP'),
        rephrasingRate: metric(null, 'No deterministic rephrasing marker', 'NOT_CURRENTLY_MEASURABLE'),
        abandonmentRate: metric(null, 'No deterministic abandonment event', 'NOT_CURRENTLY_MEASURABLE'),
        medianResponseLatencyMs: metric(median(latencyValues), 'AiInteractionEvent.responseLatencyMs'),
        p95ResponseLatencyMs: metric(percentile(latencyValues, 95), 'AiInteractionEvent.responseLatencyMs'),
      },
      operations: {
        safeHoldCount: metric(safeHolds, 'AiSupportCase.status/lastActivityAt'),
        systemBlockedCount: metric(systemBlocked, 'AiSupportCase.status/lastActivityAt'),
        toolFailures: metric(toolFailures, 'AiToolExecution.executionStatus'),
        providerFailures: metric(providerFailures, 'AiProviderSession.status'),
        responseFailures: metric(responseFailures, 'AiInteractionEvent.AI_RESPONSE outcome'),
        followUpBacklog: metric(followUpBacklog, 'AiFollowUp pending and due'),
        policyConflicts: metric(policyConflicts, 'AiPolicyDecision denied/hold'),
      },
      knowledge: {
        noMatchRate: metric(
          knowledgeMeasured.length ? percentage(noKnowledgeMatch, knowledgeMeasured.length) : null,
          'AI_RESPONSE events with explicit knowledgeMatched',
          knowledgeMeasured.length ? 'IMPLEMENTED' : 'NOT_CURRENTLY_MEASURABLE',
        ),
        selectedProvenance: metric(
          grouped(events
            .filter(item => item.knowledgeSourceKey && item.knowledgeChunkKey)
            .map(item => `${item.knowledgeSourceKey}:${item.knowledgeChunkKey}`)),
          'AiInteractionEvent bounded source/chunk references',
        ),
        staleCount: metric(staleKnowledge, 'AiKnowledgeSource status/effectiveUntil'),
        invalidCount: metric(null, 'No canonical invalid-health classification', 'NOT_CURRENTLY_MEASURABLE'),
        missingCount: metric(null, 'No canonical expected-source gap record', 'NOT_CURRENTLY_MEASURABLE'),
        duplicateCount: metric(null, 'Database uniqueness prevents duplicate source/version and chunk keys', 'NOT_CURRENTLY_MEASURABLE'),
      },
      security: {
        blockedPrompts: metric(blockedAiLogs, 'AIBotLog.action_status=Blocked'),
        crossUserDenials: metric(crossUserDenials, 'AuditLog AI_FEEDBACK_DENIED_OWNERSHIP'),
        prohibitedToolAttempts: metric(prohibitedTools, 'AuditLog TOOL_PROHIBITED_DENIAL'),
        toolRbacDenials: metric(toolRbacDenials, 'AuditLog TOOL_RBAC_DENIAL'),
        confirmationBypassAttempts: metric(null, 'No canonical bypass-attempt event', 'NOT_CURRENTLY_MEASURABLE'),
        replayEvents: metric(null, 'P5 rejects replay without a dedicated aggregate event', 'NOT_CURRENTLY_MEASURABLE'),
      },
      domainDistribution: metric(
        grouped(cases.filter(item => item.openedAt >= from && item.openedAt <= now).map(item => item.category)),
        'AiSupportCase.category',
      ),
      digitalHuman: {
        sessionCreation: metric(digitalSessions.length, 'AiServiceSession channel=digital_human'),
        providerHealth: metric(grouped(providerSessions.map(session => `${session.provider}:${session.status}`)), 'AiProviderSession'),
        fallbackRate: metric(null, 'No canonical Digital Human fallback marker', 'DEFERRED'),
        textContinuitySuccess: metric(null, 'No explicit provider-to-text continuity outcome', 'DEFERRED'),
      },
      feedbackBreakdowns: {
        intent: metric(grouped(feedbackEvents.map(event => event?.intent)), 'Feedback joined to AI_RESPONSE intent'),
        route: metric(grouped(feedbackEvents.map(event => event?.route)), 'Feedback joined to AI_RESPONSE route'),
        specialist: metric(grouped(feedbackEvents.map(event => event?.specialistId)), 'Feedback joined to AI_RESPONSE specialist'),
        suggestion: metric(grouped(feedbackEvents.map(event => event?.suggestionId)), 'Feedback joined to AI_RESPONSE suggestion'),
        knowledgePath: metric(grouped(feedbackEvents.map(event =>
          event?.knowledgeSourceKey && event.knowledgeChunkKey
            ? `${event.knowledgeSourceKey}:${event.knowledgeChunkKey}`
            : undefined)), 'Feedback joined to bounded knowledge provenance'),
        toolPath: metric(grouped(feedbackEvents.map(event => event?.toolExecutionId)), 'Feedback joined to tool execution reference'),
      },
    };
  }
}
