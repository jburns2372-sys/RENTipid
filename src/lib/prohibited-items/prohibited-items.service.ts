import { PrismaClient, ProhibitedItemPolicy } from "@prisma/client";

const prisma = new PrismaClient();

export interface PolicyEvaluationRequest {
  listingId: string;
  providerUserId: string;
  evaluationSource: string;
  submittedTitle: string;
  submittedDescription: string;
}

export interface PolicyEvaluationResult {
  decision: "ALLOW" | "BLOCK" | "HOLD_FOR_REVIEW" | "REQUIRE_DOCUMENTS" | "TAKEDOWN" | "ESCALATE";
  classification: "PROHIBITED" | "RESTRICTED" | "UNSUPPORTED" | "ALLOWED";
  riskScore: number;
  reasonCode: string;
  userSafeReason: string;
  internalReason: string;
  matchedPolicyId: string | null;
  matchedTerms: string;
  requiresManualReview: boolean;
}

export class ProhibitedItemsService {
  private static RULES_ENGINE_VERSION = "PH-V1.0-ENGINE-1.0";

  /**
   * Evaluate a listing against active policies.
   */
  static async evaluateListingPolicy(req: PolicyEvaluationRequest): Promise<PolicyEvaluationResult> {
    const policies = await prisma.prohibitedItemPolicy.findMany({
      where: { isActive: true },
      orderBy: { riskLevel: "asc" }, // CRITICAL first (assume string sorting may not work, so we evaluate all and take worst)
    });

    const normalizedTitle = (req.submittedTitle || "").toLowerCase();
    const normalizedDesc = (req.submittedDescription || "").toLowerCase();

    let worstResult: PolicyEvaluationResult = {
      decision: "ALLOW",
      classification: "ALLOWED",
      riskScore: 0,
      reasonCode: "OK",
      userSafeReason: "Listing allowed",
      internalReason: "No policy matched",
      matchedPolicyId: null,
      matchedTerms: "",
      requiresManualReview: false,
    };

    for (const policy of policies) {
      // Basic keyword evaluation with word boundaries to avoid partial matches
      const keywords = policy.prohibitedKeywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
      const reviewWords = policy.reviewKeywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
      const exclusions = (policy.exclusions || "").split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
      
      const isExcluded = exclusions.some((ex) => normalizedTitle.includes(ex) || normalizedDesc.includes(ex));

      let isProhibitedMatch = false;
      let isReviewMatch = false;

      if (!isExcluded) {
        isProhibitedMatch = keywords.some(
          (kw) => (new RegExp(`\\b${kw}\\b`, 'i')).test(normalizedTitle) || (new RegExp(`\\b${kw}\\b`, 'i')).test(normalizedDesc)
        );
        
        isReviewMatch = reviewWords.some(
          (kw) => (new RegExp(`\\b${kw}\\b`, 'i')).test(normalizedTitle) || (new RegExp(`\\b${kw}\\b`, 'i')).test(normalizedDesc)
        );
      }

      if (isProhibitedMatch || isReviewMatch) {
        let riskScore = 0;
        let decision: PolicyEvaluationResult["decision"] = "HOLD_FOR_REVIEW";
        
        if (policy.riskLevel === "CRITICAL") riskScore = 100;
        else if (policy.riskLevel === "HIGH") riskScore = 80;
        else if (policy.riskLevel === "MEDIUM") riskScore = 50;
        else if (policy.riskLevel === "LOW") riskScore = 20;

        if (policy.classification === "PROHIBITED" && (isProhibitedMatch || policy.automaticBlockEnabled)) {
          decision = "BLOCK";
        } else if (policy.classification === "RESTRICTED") {
          decision = "REQUIRE_DOCUMENTS";
        } else if (policy.classification === "UNSUPPORTED") {
          decision = "BLOCK";
        }

        // Keep the worst match
        if (riskScore > worstResult.riskScore) {
          worstResult = {
            decision,
            classification: policy.classification as "PROHIBITED" | "RESTRICTED" | "UNSUPPORTED" | "ALLOWED",
            riskScore,
            reasonCode: `MATCH-${policy.policyCode}`,
            userSafeReason: policy.publicGuidance || "This listing appears to match our prohibited items policy.",
            internalReason: `Matched terms for ${policy.policyCode}`,
            matchedPolicyId: policy.id,
            matchedTerms: isProhibitedMatch ? "Prohibited term" : "Review term",
            requiresManualReview: policy.manualReviewRequired || decision === "HOLD_FOR_REVIEW",
          };
        }
      }
    }

    return worstResult;
  }

  /**
   * Evaluate and record the evaluation result in the database.
   */
  static async createPolicyEvaluation(req: PolicyEvaluationRequest) {
    try {
      const result = await this.evaluateListingPolicy(req);
      const activePolicyVersion = "PH-V1.0"; // Should be fetched from system settings in production

      const evaluation = await prisma.listingPolicyEvaluation.create({
        data: {
          listingId: req.listingId,
          providerUserId: req.providerUserId,
          evaluationSource: req.evaluationSource,
          policyVersion: activePolicyVersion,
          submittedTitle: req.submittedTitle,
          submittedDescriptionHash: "SIMULATED_HASH", // In prod, compute SHA-256
          matchedPolicyId: result.matchedPolicyId,
          matchedTerms: result.matchedTerms,
          riskScore: result.riskScore,
          classification: result.classification,
          decision: result.decision,
          reasonCode: result.reasonCode,
          userSafeReason: result.userSafeReason,
          internalReason: result.internalReason,
          rulesEngineVersion: this.RULES_ENGINE_VERSION,
          requiresManualReview: result.requiresManualReview,
        },
      });

      if (["BLOCK", "HOLD_FOR_REVIEW", "REQUIRE_DOCUMENTS", "TAKEDOWN", "ESCALATE"].includes(result.decision)) {
        if (result.matchedPolicyId) {
          await this.createEnforcementCase(evaluation.id, result.matchedPolicyId);
        }
      }

      // Security Event for CRITICAL violations
      if (result.riskScore >= 100) {
        try {
          const { logApiSecurityEvent } = await import('../../lib/security/events/writers/api-security-writer');
          await logApiSecurityEvent({
            event_code: 'CRITICAL_PROHIBITED_LISTING_DETECTED',
            outcome: 'DENIED',
            raw_ip: 'system-evaluation',
            safe_route_family: 'LISTING_POLICY_EVALUATION',
            http_method: 'INTERNAL',
            policy_family: 'PROHIBITED_ITEMS',
            sanitized_metadata: {
              listingId: req.listingId,
              policyCode: result.reasonCode,
              decision: result.decision
            }
          });
        } catch (err) {
          console.error("Failed to log security event", err);
        }
      }

      return evaluation;
    } catch (error) {
      console.error("Policy evaluation failed safely:", error);
      // Safe fallback
      return await prisma.listingPolicyEvaluation.create({
        data: {
          listingId: req.listingId || "UNKNOWN",
          providerUserId: req.providerUserId || "UNKNOWN",
          evaluationSource: req.evaluationSource || "SYSTEM",
          policyVersion: "FAIL-SAFE",
          submittedTitle: req.submittedTitle || "FAILED_TITLE",
          submittedDescriptionHash: "FAIL_HASH",
          matchedTerms: "",
          riskScore: 0,
          classification: "PROHIBITED",
          decision: "HOLD_FOR_REVIEW",
          reasonCode: "PI-SYS-ERROR",
          userSafeReason: "This listing requires manual review.",
          internalReason: "Policy evaluation failed",
          rulesEngineVersion: this.RULES_ENGINE_VERSION,
          requiresManualReview: true,
        },
      });
    }
  }

  static async createEnforcementCase(evaluationId: string, policyId: string) {
    const evaluation = await prisma.listingPolicyEvaluation.findUniqueOrThrow({
      where: { id: evaluationId },
      include: { matchedPolicy: true },
    });

    const caseNumber = `CASE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return await prisma.listingEnforcementCase.create({
      data: {
        caseNumber,
        listingId: evaluation.listingId,
        userId: evaluation.providerUserId,
        evaluationId: evaluation.id,
        policyId: policyId,
        caseStatus: "OPEN",
        severity: evaluation.matchedPolicy?.riskLevel || "MEDIUM",
        enforcementAction: evaluation.decision,
        appealEligible: true,
      },
    });
  }

  static async resolveEnforcementCase(caseId: string, reviewerId: string, resolution: string, status: string) {
    return await prisma.listingEnforcementCase.update({
      where: { id: caseId },
      data: {
        caseStatus: status,
        resolution,
        resolvedAt: new Date(),
        resolvedByUserId: reviewerId,
      },
    });
  }

  static async submitPolicyAppeal(caseId: string, userId: string, reason: string, statement: string) {
    const enforcementCase = await prisma.listingEnforcementCase.findUniqueOrThrow({
      where: { id: caseId }
    });

    if (!enforcementCase.appealEligible) {
      throw new Error('Case is not eligible for appeal.');
    }

    const daysSinceOpened = (new Date().getTime() - enforcementCase.openedAt.getTime()) / (1000 * 3600 * 24);
    if (daysSinceOpened > 30) {
      throw new Error('Appeal window has expired.');
    }

    const existingAppeal = await prisma.listingPolicyAppeal.findFirst({
      where: {
        enforcementCaseId: caseId,
        status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED'] }
      }
    });

    if (existingAppeal) {
      throw new Error('An active appeal already exists for this case.');
    }

    return await prisma.listingPolicyAppeal.create({
      data: {
        enforcementCaseId: caseId,
        appellantUserId: userId,
        appealReason: reason,
        supportingStatement: statement,
        submittedDocumentIds: "[]",
        status: "SUBMITTED",
      },
    });
  }

  static async resolvePolicyAppeal(appealId: string, reviewerId: string, decision: string, notes: string) {
    const reviewer = await prisma.user.findUniqueOrThrow({
      where: { id: reviewerId }
    });
    if (reviewer.role !== 'Super Admin' && reviewer.role !== 'Compliance Admin') {
      throw new Error('UNAUTHORIZED');
    }

    const appeal = await prisma.listingPolicyAppeal.findUniqueOrThrow({
      where: { id: appealId },
      include: { enforcementCase: true },
    });

    return await prisma.$transaction(async (tx) => {
      const updatedAppeal = await tx.listingPolicyAppeal.update({
        where: { id: appealId },
        data: {
          status: decision,
          reviewerUserId: reviewerId,
          reviewerDecision: decision,
          reviewerNotes: notes,
          reviewedAt: new Date(),
        },
      });

      // Update enforcement case status if appeal is approved or denied
      if (decision === 'APPROVED') {
        await tx.listingEnforcementCase.update({
          where: { id: appeal.enforcementCaseId },
          data: {
            caseStatus: 'REVERSED',
            resolution: 'Appeal Approved',
            resolvedAt: new Date(),
            resolvedByUserId: reviewerId,
          },
        });

        // Restore listing status
        await tx.listing.update({
          where: { id: appeal.enforcementCase.listingId },
          data: { status: 'ACTIVE' },
        });
      } else if (decision === 'DENIED') {
        await tx.listingEnforcementCase.update({
          where: { id: appeal.enforcementCaseId },
          data: {
            caseStatus: 'UPHELD',
            resolution: 'Appeal Denied',
            resolvedAt: new Date(),
            resolvedByUserId: reviewerId,
          },
        });
      }

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          actor_user_id: reviewerId,
          action: 'POLICY_APPEAL_RESOLVED',
          module: 'APPEAL',
          target_id: appealId,
          details: JSON.stringify({ decision, notes }),
          ip_address: 'system',
        },
      });

      return updatedAppeal;
    });
  }
}
