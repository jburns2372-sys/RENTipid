import { PrismaClient } from "@prisma/client";
import {
  CANONICAL_PROHIBITED_POLICIES,
  CANONICAL_POLICY_VERSION,
} from "../src/lib/prohibited-items/canonical-policies";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Prohibited Item Policies from Canonical Registry...");

  for (const policy of CANONICAL_PROHIBITED_POLICIES) {
    const existing = await prisma.prohibitedItemPolicy.findUnique({
      where: { policyCode: policy.policyCode },
    });

    await prisma.prohibitedItemPolicy.upsert({
      where: { policyCode: policy.policyCode },
      update: {
        name: policy.name,
        slug: policy.slug,
        summary: policy.summary,
        fullDescription: policy.fullDescription,
        classification: policy.classification,
        riskLevel: policy.riskLevel,
        enforcementAction: policy.enforcementAction,
        examples: policy.examples,
        prohibitedKeywords: policy.prohibitedKeywords,
        reviewKeywords: policy.reviewKeywords,
        exclusions: policy.exclusions,
        displayOrder: policy.displayOrder ?? 0,
        policyVersion: CANONICAL_POLICY_VERSION,
        automaticBlockEnabled: policy.enforcementAction === "BLOCK",
        securityEscalationRequired: policy.riskLevel === "CRITICAL",
        manualReviewRequired: policy.enforcementAction === "HOLD_FOR_REVIEW",
        // Preserve existing effectiveFrom on update; only set on create
        effectiveFrom: existing?.effectiveFrom ?? new Date(),
      },
      create: {
        policyCode: policy.policyCode,
        name: policy.name,
        slug: policy.slug,
        summary: policy.summary,
        fullDescription: policy.fullDescription,
        classification: policy.classification,
        riskLevel: policy.riskLevel,
        enforcementAction: policy.enforcementAction,
        examples: policy.examples,
        prohibitedKeywords: policy.prohibitedKeywords,
        reviewKeywords: policy.reviewKeywords,
        exclusions: policy.exclusions,
        displayOrder: policy.displayOrder ?? 0,
        effectiveFrom: new Date(),
        policyVersion: CANONICAL_POLICY_VERSION,
        automaticBlockEnabled: policy.enforcementAction === "BLOCK",
        securityEscalationRequired: policy.riskLevel === "CRITICAL",
        manualReviewRequired: policy.enforcementAction === "HOLD_FOR_REVIEW",
      },
    });
  }

  console.log(`Seeding complete. ${CANONICAL_POLICY_VERSION} policy catalog is active (${CANONICAL_PROHIBITED_POLICIES.length} policies).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
