import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// The states defined in prisma/schema.prisma for AiSupportCase.status
export type CaseState = 
  | "OPEN" 
  | "UNDERSTANDING" 
  | "DIAGNOSING" 
  | "AWAITING_EVIDENCE" 
  | "AWAITING_USER_CONFIRMATION" 
  | "POLICY_EVALUATION" 
  | "EXECUTING" 
  | "VERIFYING" 
  | "SAFE_HOLD" 
  | "RESOLVED" 
  | "CLOSED" 
  | "SYSTEM_BLOCKED";

export class AiCasePlatform {
  private static instance = new AiCasePlatform();

  static getInstance() {
    return this.instance;
  }

  // Idempotent resume/create for cross-channel
  async resumeCase(userId: string, category: string, entityType?: string, entityId?: string) {
    // 1. Duplicate-case suppression: find existing open case for same issue/entity
    let existingCaseQuery: any = {
      userId,
      category,
      status: { notIn: ['CLOSED', 'RESOLVED', 'SYSTEM_BLOCKED'] }
    };

    const cases = await prisma.aiSupportCase.findMany({ where: existingCaseQuery });

    if (entityType && entityId && cases.length > 0) {
      // Find the one with the matching entity link
      for (const c of cases) {
        const link = await prisma.aiCaseEntityLink.findFirst({
          where: { caseId: c.id, entityType, entityId }
        });
        if (link) return c;
      }
    } else if (cases.length > 0) {
      return cases[0]; // Return most recent open if no entity constraint
    }

    // 2. Not found, create new
    return this.createCase(userId, category, entityType, entityId);
  }

  async createCase(userId: string, category: string, entityType?: string, entityId?: string) {
    const caseNumber = `CAS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const newCase = await prisma.aiSupportCase.create({
      data: {
        userId,
        caseNumber,
        category,
        severity: 'medium',
        riskLevel: 'safe',
        status: 'OPEN'
      }
    });

    if (entityType && entityId) {
      await this.linkEntity(newCase.id, userId, entityType, entityId, 'primary');
    }

    return newCase;
  }

  async getCase(caseId: string, userId: string) {
    const c = await prisma.aiSupportCase.findUnique({ where: { id: caseId } });
    if (!c) throw new Error('Case not found');
    if (c.userId !== userId) throw new Error('Unauthorized');
    return c;
  }

  async linkEntity(caseId: string, userId: string, entityType: string, entityId: string, relationship: string) {
    await this.getCase(caseId, userId); // Ownership enforcement
    
    // In a real system, verify the user actually owns `entityId` in `entityType` table.
    // e.g. if Booking, check Booking.userId == userId.
    
    return prisma.aiCaseEntityLink.create({
      data: {
        caseId,
        entityType,
        entityId,
        relationship
      }
    });
  }

  async addEvidenceReference(caseId: string, userId: string, evidenceType: string, fileReference: string) {
    await this.getCase(caseId, userId);
    return prisma.aiCaseEvidence.create({
      data: {
        caseId,
        submittedByUserId: userId,
        evidenceType,
        fileReference,
        sourceChannel: 'web',
        verificationStatus: 'pending'
      }
    });
  }

  async evaluateEvidenceCompleteness(caseId: string, userId: string) {
    await this.getCase(caseId, userId);
    const evidence = await prisma.aiCaseEvidence.findMany({ where: { caseId } });
    // Mock logic: if we have any verified evidence, complete.
    if (evidence.some(e => e.verificationStatus === 'verified')) {
      await this.updateCaseState(caseId, userId, 'DIAGNOSING');
      return true;
    }
    return false;
  }

  async updateCaseState(caseId: string, userId: string, newState: CaseState) {
    await this.getCase(caseId, userId);
    return prisma.aiSupportCase.update({
      where: { id: caseId },
      data: { status: newState, lastActivityAt: new Date() }
    });
  }

  async createProposedResolution(caseId: string, userId: string, userFacingExplanation: string) {
    await this.getCase(caseId, userId);
    return prisma.aiResolution.create({
      data: {
        caseId,
        resolutionType: 'interim',
        resolutionStatus: 'proposed',
        userFacingExplanation
      }
    });
  }

  async requestConfirmation(caseId: string, userId: string) {
    return this.updateCaseState(caseId, userId, 'AWAITING_USER_CONFIRMATION');
  }

  async reconsiderCase(caseId: string, userId: string) {
    return this.updateCaseState(caseId, userId, 'UNDERSTANDING'); // Back to understanding
  }

  async scheduleFollowUp(caseId: string, userId: string, triggerAt: Date) {
    await this.getCase(caseId, userId);
    return prisma.aiFollowUp.create({
      data: {
        caseId,
        triggerAt,
        triggerType: 'recheck',
        status: 'pending'
      }
    });
  }

  async finalizeResolution(caseId: string, userId: string) {
    await this.updateCaseState(caseId, userId, 'RESOLVED');
    return prisma.aiSupportCase.update({
      where: { id: caseId },
      data: { resolvedAt: new Date() }
    });
  }

  async closeCase(caseId: string, userId: string) {
    await this.updateCaseState(caseId, userId, 'CLOSED');
    return prisma.aiSupportCase.update({
      where: { id: caseId },
      data: { closedAt: new Date() }
    });
  }

  async exportCase(caseId: string, userId: string) {
    const c = await this.getCase(caseId, userId);
    const evidence = await prisma.aiCaseEvidence.findMany({ where: { caseId } });
    const links = await prisma.aiCaseEntityLink.findMany({ where: { caseId } });
    const resolutions = await prisma.aiResolution.findMany({ where: { caseId } });
    return { ...c, evidence, links, resolutions };
  }
}
