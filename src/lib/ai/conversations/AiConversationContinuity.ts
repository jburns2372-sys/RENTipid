import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { resolveAiEntityHint, assertAiEntityAccess } from '../authorization/domain-state';
import { AiCasePlatform } from '../cases/AiCasePlatform';
import { resolveIntent } from '../specialists/intent-resolver';
import { routeToSpecialist } from '../specialists/router';

export type PersistedAiMessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ContinueConversationInput {
  userId: string;
  prompt: string;
  module: string;
  recordId?: string;
  channel: string;
  conversationId?: string;
}

export class AiConversationContinuity {
  private static instance = new AiConversationContinuity();

  constructor(
    private readonly db: PrismaClient = prisma,
    private readonly cases: AiCasePlatform = new AiCasePlatform(db),
  ) {}

  static getInstance() {
    return this.instance;
  }

  async continueForMessage(input: ContinueConversationInput) {
    const entityHint = resolveAiEntityHint(input.module, input.recordId, input.userId);
    if (entityHint) {
      await assertAiEntityAccess(input.userId, entityHint.entityType, entityHint.entityId);
    }

    const requestedConversation = input.conversationId
      ? await this.getOwnedConversation(input.conversationId, input.userId)
      : null;
    const resolvedIntent = resolveIntent(input.prompt);

    let supportCase;
    if (!resolvedIntent && requestedConversation?.activeCaseId) {
      supportCase = await this.cases.validateCurrentCaseAccess(requestedConversation.activeCaseId, input.userId);
    } else {
      const specialist = routeToSpecialist(resolvedIntent);
      const subcategory = resolvedIntent ?? `general:${input.module.trim().toLowerCase()}`;
      supportCase = await this.cases.resumeCase(
        input.userId,
        specialist.id,
        entityHint?.entityType,
        entityHint?.entityId,
        subcategory,
      );
    }

    const continuityKey = `ai-conversation-v1:${supportCase.id}`;
    let conversation = await this.db.aiConversation.findFirst({
      where: { userId: input.userId, activeCaseId: supportCase.id },
      orderBy: { updatedAt: 'desc' },
    });

    if (conversation) {
      try {
        conversation = await this.db.aiConversation.update({
          where: { id: conversation.id },
          data: {
            continuityKey,
            lastIntent: resolvedIntent ?? supportCase.subcategory,
            lastChannel: input.channel,
          },
        });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
        conversation = await this.db.aiConversation.findUnique({ where: { continuityKey } });
        if (!conversation) throw error;
      }
    } else {
      conversation = await this.db.aiConversation.upsert({
        where: { continuityKey },
        create: {
          userId: input.userId,
          activeCaseId: supportCase.id,
          continuityKey,
          lastIntent: resolvedIntent ?? supportCase.subcategory,
          lastChannel: input.channel,
        },
        update: {
          lastIntent: resolvedIntent ?? supportCase.subcategory,
          lastChannel: input.channel,
        },
      });
    }

    if (conversation.userId !== input.userId) throw new Error('Unauthorized conversation resume');
    return { conversation, supportCase, resolvedIntent };
  }

  async appendMessage(
    conversationId: string,
    userId: string,
    role: PersistedAiMessageRole,
    content: string,
    channel: string,
    sessionId?: string,
    safePayload?: Record<string, string | boolean | null>,
  ) {
    await this.getOwnedConversation(conversationId, userId);
    return this.db.$transaction(async tx => {
      const message = await tx.aiMessage.create({
        data: { conversationId, sessionId, role, channel, content, safePayload },
      });
      await tx.aiConversation.update({
        where: { id: conversationId },
        data: { lastChannel: channel },
      });
      return message;
    });
  }

  async getResumableHistory(userId: string, conversationId?: string, module?: string, recordId?: string) {
    let conversation = conversationId ? await this.getOwnedConversation(conversationId, userId) : null;

    if (!conversation) {
      const entityHint = module ? resolveAiEntityHint(module, recordId, userId) : undefined;
      if (entityHint) {
        await assertAiEntityAccess(userId, entityHint.entityType, entityHint.entityId);
        const links = await this.db.aiCaseEntityLink.findMany({
          where: { entityType: entityHint.entityType, entityId: entityHint.entityId, relationship: 'primary' },
          select: { caseId: true },
        });
        conversation = links.length
          ? await this.db.aiConversation.findFirst({
              where: { userId, activeCaseId: { in: links.map(link => link.caseId) } },
              orderBy: { updatedAt: 'desc' },
            })
          : null;
      } else {
        conversation = await this.db.aiConversation.findFirst({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
        });
      }
    }

    if (!conversation) return null;
    if (conversation.activeCaseId) {
      await this.cases.validateCurrentCaseAccess(conversation.activeCaseId, userId);
    }
    const messages = await this.db.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: { id: true, role: true, content: true, createdAt: true },
    });
    return { conversation, messages };
  }

  async getOwnedConversation(conversationId: string, userId: string) {
    const conversation = await this.db.aiConversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new Error('Conversation not found');
    if (conversation.userId !== userId) throw new Error('Unauthorized conversation resume');
    if (conversation.activeCaseId) {
      await this.cases.validateCurrentCaseAccess(conversation.activeCaseId, userId);
    }
    return conversation;
  }
}
