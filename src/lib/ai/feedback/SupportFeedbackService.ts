import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  FeedbackRating,
  FeedbackReason,
  isFeedbackRating,
  isFeedbackReason,
  isReasonAllowed,
} from './registry';

const FEEDBACK_FEATURE_KEY = 'ai_module_feedback_enabled';
const MAX_MESSAGE_ID_LENGTH = 200;
const MAX_COMMENT_LENGTH = 500;
const DENIED_ACCOUNT_STATES = new Set(['suspended', 'blacklisted', 'deleted', 'disabled']);

export type FeedbackErrorCode =
  | 'FEATURE_DISABLED'
  | 'UNAUTHENTICATED'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'INVALID_FEEDBACK';

export class SupportFeedbackError extends Error {
  constructor(message: string, readonly code: FeedbackErrorCode) {
    super(message);
    this.name = 'SupportFeedbackError';
  }
}

export interface SubmitFeedbackInput {
  messageId: unknown;
  rating: unknown;
  reason?: unknown;
  comment?: unknown;
}

function normalizeComment(value: unknown) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new SupportFeedbackError('Comment must be text', 'INVALID_FEEDBACK');
  const normalized = value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized || normalized.length > MAX_COMMENT_LENGTH) {
    throw new SupportFeedbackError('Comment must be between 1 and 500 characters', 'INVALID_FEEDBACK');
  }
  return normalized;
}

function normalizeInput(input: SubmitFeedbackInput): {
  messageId: string;
  rating: FeedbackRating;
  reason: FeedbackReason | null;
  comment: string | null;
} {
  if (
    typeof input.messageId !== 'string'
    || !input.messageId.trim()
    || input.messageId.length > MAX_MESSAGE_ID_LENGTH
  ) {
    throw new SupportFeedbackError('Invalid messageId', 'INVALID_FEEDBACK');
  }
  if (!isFeedbackRating(input.rating)) {
    throw new SupportFeedbackError('Invalid feedback rating', 'INVALID_FEEDBACK');
  }
  const reason = input.reason === undefined || input.reason === null || input.reason === ''
    ? null
    : isFeedbackReason(input.reason)
      ? input.reason
      : (() => { throw new SupportFeedbackError('Invalid feedback reason', 'INVALID_FEEDBACK'); })();
  if (reason && !isReasonAllowed(input.rating, reason)) {
    throw new SupportFeedbackError('Feedback reason does not match rating', 'INVALID_FEEDBACK');
  }
  const comment = normalizeComment(input.comment);
  if (comment && reason !== 'OTHER') {
    throw new SupportFeedbackError('A comment is accepted only with the OTHER reason', 'INVALID_FEEDBACK');
  }
  return { messageId: input.messageId.trim(), rating: input.rating, reason, comment };
}

export class SupportFeedbackService {
  constructor(private readonly db: PrismaClient = prisma) {}

  async submit(actorUserId: string | undefined, input: SubmitFeedbackInput) {
    if (!actorUserId?.trim()) {
      throw new SupportFeedbackError('Authentication required', 'UNAUTHENTICATED');
    }
    const normalized = normalizeInput(input);

    return this.db.$transaction(async tx => {
      const feature = await tx.systemSetting.findUnique({ where: { setting_key: FEEDBACK_FEATURE_KEY } });
      if (feature?.setting_value.trim().toLowerCase() !== 'true') {
        throw new SupportFeedbackError('AI feedback is disabled', 'FEATURE_DISABLED');
      }

      const actor = await tx.user.findUnique({
        where: { id: actorUserId },
        select: { id: true, status: true },
      });
      if (!actor || DENIED_ACCOUNT_STATES.has(actor.status.trim().toLowerCase())) {
        throw new SupportFeedbackError('Account is not authorized', 'UNAUTHORIZED');
      }

      const message = await tx.aiMessage.findUnique({
        where: { id: normalized.messageId },
        select: {
          id: true,
          role: true,
          conversationId: true,
          conversation: { select: { userId: true, activeCaseId: true } },
        },
      });
      if (!message) throw new SupportFeedbackError('AI message not found', 'NOT_FOUND');
      if (message.role !== 'assistant') {
        throw new SupportFeedbackError('Feedback is accepted only for AI answers', 'INVALID_FEEDBACK');
      }
      if (message.conversation.userId !== actor.id) {
        await tx.auditLog.create({
          data: {
            actor_user_id: actor.id,
            action: 'AI_FEEDBACK_DENIED_OWNERSHIP',
            module: 'SupportFeedbackService',
            target_id: message.id,
            details: JSON.stringify({
              schemaVersion: 'p7a.1',
              result: 'DENIED',
              reason: 'MESSAGE_OWNERSHIP_MISMATCH',
              messageId: message.id,
              conversationId: message.conversationId,
              occurredAt: new Date().toISOString(),
            }),
          },
        });
        throw new SupportFeedbackError('AI message access denied', 'UNAUTHORIZED');
      }

      const previous = await tx.aiInteractionFeedback.findUnique({
        where: { userId_messageId: { userId: actor.id, messageId: message.id } },
        select: { rating: true },
      });
      const feedback = await tx.aiInteractionFeedback.upsert({
        where: { userId_messageId: { userId: actor.id, messageId: message.id } },
        create: {
          userId: actor.id,
          conversationId: message.conversationId,
          messageId: message.id,
          caseId: message.conversation.activeCaseId,
          rating: normalized.rating,
          reason: normalized.reason,
          comment: normalized.comment,
        },
        update: {
          caseId: message.conversation.activeCaseId,
          rating: normalized.rating,
          reason: normalized.reason,
          comment: normalized.comment,
        },
      });
      await tx.auditLog.create({
        data: {
          actor_user_id: actor.id,
          action: previous ? 'AI_FEEDBACK_UPDATED' : 'AI_FEEDBACK_CREATED',
          module: 'SupportFeedbackService',
          target_id: feedback.id,
          details: JSON.stringify({
            schemaVersion: 'p7a.1',
            feedbackId: feedback.id,
            messageId: message.id,
            conversationId: message.conversationId,
            previousRating: previous?.rating ?? null,
            rating: feedback.rating,
            result: 'SUCCESS',
            occurredAt: new Date().toISOString(),
          }),
        },
      });

      return {
        id: feedback.id,
        messageId: feedback.messageId,
        rating: feedback.rating,
        reason: feedback.reason,
        comment: feedback.comment,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt,
      };
    });
  }
}
