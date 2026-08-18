import { createHash, randomUUID } from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AiEntityType, assertAiEntityAccess } from '../authorization/domain-state';

export type CaseState =
  | 'OPEN'
  | 'UNDERSTANDING'
  | 'DIAGNOSING'
  | 'AWAITING_EVIDENCE'
  | 'AWAITING_USER_CONFIRMATION'
  | 'POLICY_EVALUATION'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'SAFE_HOLD'
  | 'RESOLVED'
  | 'CLOSED'
  | 'SYSTEM_BLOCKED';

const TERMINAL_CASE_STATES: CaseState[] = ['RESOLVED', 'CLOSED', 'SYSTEM_BLOCKED'];

function normalizeIssuePart(value: string | undefined) {
  return value?.trim().toLowerCase() || '-';
}

export function buildActiveIssueKey(
  userId: string,
  category: string,
  subcategory?: string,
  entityType?: string,
  entityId?: string,
) {
  const material = [userId, category, subcategory, entityType, entityId].map(normalizeIssuePart).join('|');
  return `ai-issue-v1:${createHash('sha256').update(material).digest('hex')}`;
}

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export class AiCasePlatform {
  private static instance = new AiCasePlatform();

  constructor(private readonly db: PrismaClient = prisma) {}

  static getInstance() {
    return this.instance;
  }

  async resumeCase(userId: string, category: string, entityType?: string, entityId?: string, subcategory?: string) {
    if ((entityType && !entityId) || (!entityType && entityId)) {
      throw new Error('Both entityType and entityId are required');
    }
    if (entityType && entityId) {
      await assertAiEntityAccess(userId, entityType as AiEntityType, entityId);
    }

    const activeIssueKey = buildActiveIssueKey(userId, category, subcategory, entityType, entityId);
    const keyedCase = await this.db.aiSupportCase.findUnique({ where: { activeIssueKey } });
    if (keyedCase) return this.assertOwnedActiveCase(keyedCase, userId);

    const legacyCase = await this.findLegacyEquivalentCase(userId, category, subcategory, entityType, entityId);
    if (legacyCase) {
      try {
        return await this.db.aiSupportCase.update({
          where: { id: legacyCase.id },
          data: { activeIssueKey, lastActivityAt: new Date() },
        });
      } catch (error) {
        if (!isUniqueConflict(error)) throw error;
        const winner = await this.db.aiSupportCase.findUnique({ where: { activeIssueKey } });
        if (winner) return this.assertOwnedActiveCase(winner, userId);
      }
    }

    return this.createCase(userId, category, entityType, entityId, subcategory, activeIssueKey);
  }

  async createCase(
    userId: string,
    category: string,
    entityType?: string,
    entityId?: string,
    subcategory?: string,
    suppliedIssueKey?: string,
  ) {
    if (entityType && entityId) {
      await assertAiEntityAccess(userId, entityType as AiEntityType, entityId);
    }
    const activeIssueKey = suppliedIssueKey ?? buildActiveIssueKey(userId, category, subcategory, entityType, entityId);

    try {
      return await this.db.$transaction(async tx => {
        const created = await tx.aiSupportCase.create({
          data: {
            userId,
            caseNumber: `CAS-${randomUUID()}`,
            category,
            subcategory,
            activeIssueKey,
            severity: 'medium',
            riskLevel: 'safe',
            status: 'OPEN',
          },
        });

        if (entityType && entityId) {
          await tx.aiCaseEntityLink.create({
            data: { caseId: created.id, entityType, entityId, relationship: 'primary' },
          });
        }
        return created;
      });
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      const existing = await this.db.aiSupportCase.findUnique({ where: { activeIssueKey } });
      if (!existing) throw error;
      return this.assertOwnedActiveCase(existing, userId);
    }
  }

  async getCase(caseId: string, userId: string) {
    const supportCase = await this.db.aiSupportCase.findUnique({ where: { id: caseId } });
    if (!supportCase) throw new Error('Case not found');
    if (supportCase.userId !== userId) throw new Error('Unauthorized');
    return supportCase;
  }

  async validateCurrentCaseAccess(caseId: string, userId: string) {
    const supportCase = await this.getCase(caseId, userId);
    const primaryLinks = await this.db.aiCaseEntityLink.findMany({
      where: { caseId, relationship: 'primary' },
    });
    for (const link of primaryLinks) {
      await assertAiEntityAccess(userId, link.entityType as AiEntityType, link.entityId);
    }
    return supportCase;
  }

  async linkEntity(caseId: string, userId: string, entityType: string, entityId: string, relationship: string) {
    await this.getCase(caseId, userId);
    await assertAiEntityAccess(userId, entityType as AiEntityType, entityId);

    const existing = await this.db.aiCaseEntityLink.findFirst({
      where: { caseId, entityType, entityId, relationship },
    });
    if (existing) return existing;
    return this.db.aiCaseEntityLink.create({ data: { caseId, entityType, entityId, relationship } });
  }

  async addEvidenceReference(caseId: string, userId: string, evidenceType: string, fileReference: string) {
    await this.validateCurrentCaseAccess(caseId, userId);
    return this.db.aiCaseEvidence.create({
      data: { caseId, submittedByUserId: userId, evidenceType, fileReference, sourceChannel: 'web', verificationStatus: 'pending' },
    });
  }

  async evaluateEvidenceCompleteness(caseId: string, userId: string) {
    await this.validateCurrentCaseAccess(caseId, userId);
    const evidence = await this.db.aiCaseEvidence.findMany({ where: { caseId } });
    if (evidence.some(item => item.verificationStatus === 'verified')) {
      await this.updateCaseState(caseId, userId, 'DIAGNOSING');
      return true;
    }
    return false;
  }

  async updateCaseState(caseId: string, userId: string, newState: CaseState) {
    await this.validateCurrentCaseAccess(caseId, userId);
    return this.db.aiSupportCase.update({
      where: { id: caseId },
      data: {
        status: newState,
        lastActivityAt: new Date(),
        ...(TERMINAL_CASE_STATES.includes(newState) ? { activeIssueKey: null } : {}),
      },
    });
  }

  async createProposedResolution(caseId: string, userId: string, userFacingExplanation: string) {
    await this.validateCurrentCaseAccess(caseId, userId);
    return this.db.aiResolution.create({
      data: { caseId, resolutionType: 'interim', resolutionStatus: 'proposed', userFacingExplanation },
    });
  }

  async requestConfirmation(caseId: string, userId: string) {
    return this.updateCaseState(caseId, userId, 'AWAITING_USER_CONFIRMATION');
  }

  async reconsiderCase(caseId: string, userId: string) {
    return this.updateCaseState(caseId, userId, 'UNDERSTANDING');
  }

  async scheduleFollowUp(caseId: string, userId: string, triggerAt: Date) {
    await this.validateCurrentCaseAccess(caseId, userId);
    return this.db.aiFollowUp.create({ data: { caseId, triggerAt, triggerType: 'recheck', status: 'pending' } });
  }

  async finalizeResolution(caseId: string, userId: string) {
    await this.updateCaseState(caseId, userId, 'RESOLVED');
    return this.db.aiSupportCase.update({ where: { id: caseId }, data: { resolvedAt: new Date() } });
  }

  async closeCase(caseId: string, userId: string) {
    await this.updateCaseState(caseId, userId, 'CLOSED');
    return this.db.aiSupportCase.update({ where: { id: caseId }, data: { closedAt: new Date() } });
  }

  async exportCase(caseId: string, userId: string) {
    const supportCase = await this.validateCurrentCaseAccess(caseId, userId);
    const [evidence, links, resolutions] = await Promise.all([
      this.db.aiCaseEvidence.findMany({ where: { caseId } }),
      this.db.aiCaseEntityLink.findMany({ where: { caseId } }),
      this.db.aiResolution.findMany({ where: { caseId } }),
    ]);
    return { ...supportCase, evidence, links, resolutions };
  }

  private assertOwnedActiveCase<T extends { userId: string | null; status: string }>(supportCase: T, userId: string) {
    if (supportCase.userId !== userId) throw new Error('Unauthorized');
    if (TERMINAL_CASE_STATES.includes(supportCase.status as CaseState)) throw new Error('Case is not active');
    return supportCase;
  }

  private async findLegacyEquivalentCase(
    userId: string,
    category: string,
    subcategory?: string,
    entityType?: string,
    entityId?: string,
  ) {
    const candidates = await this.db.aiSupportCase.findMany({
      where: {
        userId,
        category,
        subcategory: subcategory ?? null,
        activeIssueKey: null,
        status: { notIn: TERMINAL_CASE_STATES },
      },
      orderBy: { lastActivityAt: 'desc' },
    });

    for (const candidate of candidates) {
      const primaryLinks = await this.db.aiCaseEntityLink.findMany({
        where: { caseId: candidate.id, relationship: 'primary' },
      });
      if (!entityType && !entityId && primaryLinks.length === 0) return candidate;
      if (primaryLinks.some(link => link.entityType === entityType && link.entityId === entityId)) return candidate;
    }
    return null;
  }
}
