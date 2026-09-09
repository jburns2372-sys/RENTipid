import { prisma } from '@/lib/prisma';
import { normalizeQuestionText } from './canonical-intent-registry';
import { CANONICAL_CUSTOMER_OBJECTIVES, type CustomerObjectiveDefinition } from './customer-objective-catalog';

export interface ResolvedCanonicalIntentMatch {
  intentId: string;
  intentKey: string;
  canonicalQuestion: string;
  normalizedQuestion: string;
  domain: string;
  feature: string;
  matchType: 'EXACT_CANONICAL' | 'EXACT_ALIAS' | 'NORMALIZED_MATCH';
  confidence: number;
  matchedText: string;
  /** Existing specialist contract key used after canonical resolution. */
  compatibilityIntent?: string;
  selectedScope: {
    id: string;
    audience: string;
    role: string;
    requiredPermission?: string | null;
    answerClass: string;
    authorityType: string;
    authorityReference: string;
    knowledgeSourceKey?: string | null;
    knowledgeSectionKey?: string | null;
    liveServiceKey?: string | null;
    toolKey?: string | null;
  };
}

function compatibilityIntent(intentKey: string, feature: string): string | undefined {
  const byFeature: Record<string, string> = {
    listing_creation: 'provider_operational_support',
    listing_review: 'listing_status',
    password_reset: 'kyc_account_support',
    provider_payout: 'payout_status',
    booking_cancellation: 'booking_cancel',
    prohibited_items: 'provider_operational_support',
  };
  if (byFeature[feature]) return byFeature[feature];
  if (intentKey.startsWith('knowledge.')) return 'support_info';
  return intentKey.startsWith('internal.') ? undefined : undefined;
}

export async function resolveCanonicalIntent(
  userQuery: string,
  userRole = 'Guest',
  userPermissions: string[] = []
): Promise<ResolvedCanonicalIntentMatch | null> {
  const normalizedQuery = normalizeQuestionText(userQuery);
  if (!normalizedQuery) return null;

  try {
    // 1. Level 1: Exact Canonical Question or Normalized Match in Database
    const exactCanonical = await prisma.canonicalQuestionIntent.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [
          { canonicalQuestion: userQuery },
          { normalizedQuestion: normalizedQuery }
        ]
      },
      include: {
        accessScopes: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    if (exactCanonical) {
      const scope = filterAccessScope(exactCanonical.accessScopes, userRole, userPermissions);
      if (scope) {
        return {
          intentId: exactCanonical.id,
          intentKey: exactCanonical.intentKey,
          canonicalQuestion: exactCanonical.canonicalQuestion,
          normalizedQuestion: exactCanonical.normalizedQuestion,
          domain: exactCanonical.domain,
          feature: exactCanonical.feature,
          matchType: 'EXACT_CANONICAL',
          confidence: 1.0,
          matchedText: exactCanonical.canonicalQuestion,
          compatibilityIntent: compatibilityIntent(exactCanonical.intentKey, exactCanonical.feature),
          selectedScope: scope
        };
      }
    }

    // 2. Level 2: Exact Approved Alias or Normalized Alias Match in Database
    const aliasMatch = await prisma.canonicalQuestionAlias.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [
          { aliasText: userQuery },
          { normalizedAliasText: normalizedQuery }
        ]
      },
      include: {
        canonicalIntent: {
          include: {
            accessScopes: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      }
    });

    if (aliasMatch && aliasMatch.canonicalIntent && aliasMatch.canonicalIntent.status === 'ACTIVE') {
      const intent = aliasMatch.canonicalIntent;
      const scope = filterAccessScope(intent.accessScopes, userRole, userPermissions);
      if (scope) {
        return {
          intentId: intent.id,
          intentKey: intent.intentKey,
          canonicalQuestion: intent.canonicalQuestion,
          normalizedQuestion: intent.normalizedQuestion,
          domain: intent.domain,
          feature: intent.feature,
          matchType: 'EXACT_ALIAS',
          confidence: aliasMatch.confidence ?? 0.95,
          matchedText: aliasMatch.aliasText,
          compatibilityIntent: compatibilityIntent(intent.intentKey, intent.feature),
          selectedScope: scope
        };
      }
    }

    // 3. Level 3: Normalized Brand-Agnostic / Phrase Match in Database
    const strippedQuery = stripBrandNoise(normalizedQuery);
    if (strippedQuery && strippedQuery.length >= 3) {
      const activeAliases = await prisma.canonicalQuestionAlias.findMany({
        where: { status: 'ACTIVE' },
        include: {
          canonicalIntent: {
            include: {
              accessScopes: { where: { status: 'ACTIVE' } }
            }
          }
        }
      });

      for (const alias of activeAliases) {
        if (!alias.canonicalIntent || alias.canonicalIntent.status !== 'ACTIVE') continue;
        const strippedAlias = stripBrandNoise(alias.normalizedAliasText);
        if (!strippedAlias) continue;

        const isExactMatch = strippedQuery === strippedAlias;
        const isSubMatch = strippedQuery.length >= 6 && strippedAlias.length >= 6 && (
          strippedQuery.includes(strippedAlias) ||
          strippedAlias.includes(strippedQuery)
        );

        if (isExactMatch || isSubMatch) {
          const intent = alias.canonicalIntent;
          const scope = filterAccessScope(intent.accessScopes, userRole, userPermissions);
          if (scope) {
            return {
              intentId: intent.id,
              intentKey: intent.intentKey,
              canonicalQuestion: intent.canonicalQuestion,
              normalizedQuestion: intent.normalizedQuestion,
              domain: intent.domain,
              feature: intent.feature,
              matchType: 'NORMALIZED_MATCH',
              confidence: isExactMatch ? 0.95 : 0.90,
              matchedText: alias.aliasText,
              compatibilityIntent: compatibilityIntent(intent.intentKey, intent.feature),
              selectedScope: scope
            };
          }
        }
      }
    }
  } catch (error) {
    // Database query failed or unpopulated; fall through to in-memory catalog
  }

  // 4. In-Memory Resilient Fallback: Match against Authoritative Customer Objective Catalog
  return resolveInMemoryObjective(userQuery, normalizedQuery, userRole, userPermissions);
}

function resolveInMemoryObjective(
  userQuery: string,
  normalizedQuery: string,
  userRole: string,
  userPermissions: string[]
): ResolvedCanonicalIntentMatch | null {
  const strippedQuery = stripBrandNoise(normalizedQuery);

  for (const objective of CANONICAL_CUSTOMER_OBJECTIVES) {
    const normalizedCanonical = normalizeQuestionText(objective.canonicalQuestion);

    // Level 1: Canonical Match
    if (userQuery.trim().toLowerCase() === objective.canonicalQuestion.trim().toLowerCase() || normalizedQuery === normalizedCanonical) {
      const scope = objectiveToScope(objective, userRole);
      if (scope) {
        return {
          intentId: `obj:${objective.objectiveId}`,
          intentKey: objective.objectiveId,
          canonicalQuestion: objective.canonicalQuestion,
          normalizedQuestion: normalizedCanonical,
          domain: objective.domain,
          feature: objective.subdomain,
          matchType: 'EXACT_CANONICAL',
          confidence: 1.0,
          matchedText: objective.canonicalQuestion,
          compatibilityIntent: compatibilityIntent(objective.objectiveId, objective.subdomain),
          selectedScope: scope
        };
      }
    }

    // Level 2: Alias / Phrase Matching
    for (const alias of objective.aliases) {
      const normalizedAlias = normalizeQuestionText(alias.text);
      const strippedAlias = stripBrandNoise(normalizedAlias);

      const isExactAlias = userQuery.trim().toLowerCase() === alias.text.trim().toLowerCase() || normalizedQuery === normalizedAlias;
      const isStrippedExact = strippedQuery && strippedAlias && strippedQuery === strippedAlias;
      const isSubMatch = strippedQuery && strippedAlias && strippedQuery.length >= 6 && strippedAlias.length >= 6 && (
        strippedQuery.includes(strippedAlias) ||
        strippedAlias.includes(strippedQuery)
      );

      if (isExactAlias || isStrippedExact || isSubMatch) {
        const scope = objectiveToScope(objective, userRole);
        if (scope) {
          return {
            intentId: `obj:${objective.objectiveId}`,
            intentKey: objective.objectiveId,
            canonicalQuestion: objective.canonicalQuestion,
            normalizedQuestion: normalizedCanonical,
            domain: objective.domain,
            feature: objective.subdomain,
            matchType: isExactAlias ? 'EXACT_ALIAS' : 'NORMALIZED_MATCH',
            confidence: isExactAlias ? 0.95 : (isStrippedExact ? 0.92 : 0.88),
            matchedText: alias.text,
            compatibilityIntent: compatibilityIntent(objective.objectiveId, objective.subdomain),
            selectedScope: scope
          };
        }
      }
    }

    // Level 3: Specific Entity Matching
    if (objective.answerContract.specificEntity) {
      const entity = objective.answerContract.specificEntity.toLowerCase();
      const entityKeywords: Record<string, RegExp> = {
        medicine: /\b(?:medicine|medicines|drug|drugs|gamot|pharmaceutical|vaccine|vitamins|supplements)\b/i,
        medicines: /\b(?:medicine|medicines|drug|drugs|gamot|pharmaceutical|vaccine|vitamins|supplements)\b/i,
        firearm: /\b(?:firearm|firearms|gun|guns|baril|weapon|weapons|pistol|rifle|airsoft|ammunition|explosives)\b/i,
        firearms: /\b(?:firearm|firearms|gun|guns|baril|weapon|weapons|pistol|rifle|airsoft|ammunition|explosives)\b/i,
        vehicle: /\b(?:vehicle|vehicles|car|cars|motorcycle|motorcycles|motor|kotse|van|scooter|auto)\b/i,
        vehicles: /\b(?:vehicle|vehicles|car|cars|motorcycle|motorcycles|motor|kotse|van|scooter|auto)\b/i,
      };
      const entityPattern = entityKeywords[entity];
      if (entityPattern && entityPattern.test(userQuery)) {
        const scope = objectiveToScope(objective, userRole);
        if (scope) {
          return {
            intentId: `obj:${objective.objectiveId}`,
            intentKey: objective.objectiveId,
            canonicalQuestion: objective.canonicalQuestion,
            normalizedQuestion: normalizedCanonical,
            domain: objective.domain,
            feature: objective.subdomain,
            matchType: 'NORMALIZED_MATCH',
            confidence: 0.90,
            matchedText: entity,
            compatibilityIntent: compatibilityIntent(objective.objectiveId, objective.subdomain),
            selectedScope: scope
          };
        }
      }
    }
  }

  // Level 4: Domain & Lifecycle Semantic Classification Match
  for (const objective of CANONICAL_CUSTOMER_OBJECTIVES) {
    const q = userQuery.toLowerCase();
    const normalizedCanonical = normalizeQuestionText(objective.canonicalQuestion);

    let isSemanticMatch = false;
    if (objective.objectiveId === 'insurance.coverage.scope' && (/\b(?:insurance|insured|insurer|perils?|coverage|wear and tear|rental protection)\b/i.test(q) && !/\b(?:claim|damage|broken|sira)\b/i.test(q))) {
      isSemanticMatch = true;
    } else if (objective.objectiveId === 'insurance.claim.filing' && /\b(?:claim|claims|damage claim|broken|masira|nasira|break|incident)\b/i.test(q)) {
      isSemanticMatch = true;
    } else if (objective.objectiveId === 'renter.refund.status' && /\b(?:refund|refunded|money back)\b/i.test(q)) {
      isSemanticMatch = true;
    } else if (objective.objectiveId === 'renter.deposit.release' && /\b(?:deposit|security deposit)\b/i.test(q) && !/\b(?:how much deposit)\b/i.test(q)) {
      isSemanticMatch = true;
    } else if (objective.objectiveId === 'provider.payout.status' && /\b(?:payout|earnings)\b.{0,30}\b(?:pending|hold|delayed|status|where|saan|bakit)\b/i.test(q)) {
      isSemanticMatch = true;
    } else if (objective.objectiveId === 'provider.payout.schedule' && /\b(?:payout|earnings|kita)\b/i.test(q) && !/\b(?:hold|pending|status)\b/i.test(q)) {
      isSemanticMatch = true;
    } else if (objective.objectiveId === 'booking.extension.process' && /\b(?:extend|extension|dagdag.*araw|more days)\b/i.test(q)) {
      isSemanticMatch = true;
    } else if (objective.objectiveId === 'booking.cancel.process' && /\b(?:cancel|cancellation|kansela)\b/i.test(q)) {
      isSemanticMatch = true;
    } else if (objective.objectiveId === 'account.kyc.verification' && /\b(?:kyc|verify|id|passport|umid|license|selfie)\b/i.test(q) && !/\b(?:password)\b/i.test(q)) {
      isSemanticMatch = true;
    } else if (objective.objectiveId === 'account.password.reset' && /\b(?:password|reset password|forgot password|nakalimutan.*password|mfa|two factor)\b/i.test(q)) {
      isSemanticMatch = true;
    } else if (objective.objectiveId === 'listing.create.how_to' && (/\b(?:how.*list|create.*listing|add.*item|post.*item|mag-post|lst my car)\b/i.test(q) && !/\b(?:review|pending|approved)\b/i.test(q))) {
      isSemanticMatch = true;
    } else if (objective.objectiveId === 'listing.review.reason' && /\b(?:listing)\b.{0,30}\b(?:review|pending|approval|approved|rejected|take)\b/i.test(q)) {
      isSemanticMatch = true;
    } else if (objective.objectiveId === 'listing.item.restriction' && (/\b(?:bawal|prohibited|restricted|banned|forbidden|not allowed)\b/i.test(q) || /\b(?:drones?|cameras?|electronics|tools|machinery)\b/i.test(q))) {
      isSemanticMatch = true;
    }

    if (isSemanticMatch) {
      const scope = objectiveToScope(objective, userRole);
      if (scope) {
        return {
          intentId: `obj:${objective.objectiveId}`,
          intentKey: objective.objectiveId,
          canonicalQuestion: objective.canonicalQuestion,
          normalizedQuestion: normalizedCanonical,
          domain: objective.domain,
          feature: objective.subdomain,
          matchType: 'NORMALIZED_MATCH',
          confidence: 0.85,
          matchedText: userQuery,
          compatibilityIntent: compatibilityIntent(objective.objectiveId, objective.subdomain),
          selectedScope: scope
        };
      }
    }
  }

  return null;
}

function objectiveToScope(objective: CustomerObjectiveDefinition, userRole: string) {
  const contract = objective.answerContract;
  return {
    id: `scope:${objective.objectiveId}:${userRole}`,
    audience: objective.persona === 'ALL_CUSTOMERS' ? 'PUBLIC' : objective.persona,
    role: userRole,
    requiredPermission: null,
    answerClass: contract.authorityClass === 'POLICY_AUTHORITY' ? 'ELIGIBILITY_POLICY'
      : contract.authorityClass === 'ACTION_TOOL' ? 'ACTION'
      : contract.authorityClass === 'LIVE_SERVICE' ? 'PERSONALIZED_READ'
      : 'INFORMATION',
    authorityType: contract.authorityClass === 'POLICY_AUTHORITY' ? 'POLICY_TAXONOMY'
      : contract.authorityClass === 'ACTION_TOOL' ? 'TOOL_GATEWAY'
      : contract.authorityClass === 'LIVE_SERVICE' ? 'LIVE_SERVICE'
      : 'KNOWLEDGE_CENTER',
    authorityReference: contract.authorityReference,
    knowledgeSourceKey: contract.knowledgeSourceKey ?? null,
    knowledgeSectionKey: contract.knowledgeSectionKey ?? null,
    liveServiceKey: contract.liveServiceKey ?? null,
    toolKey: contract.toolKey ?? null,
  };
}

function stripBrandNoise(text: string): string {
  return text
    .replace(/\b(?:on|in|from|at|for|through|via)?\s*rentipid\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function filterAccessScope(
  scopes: any[],
  userRole: string,
  userPermissions: string[]
) {
  const normalizedUserRole = userRole.toUpperCase().trim();

  return scopes.find(scope => {
    const scopeRole = scope.role.toUpperCase().trim();

    // Super Admin / Owner bypass
    if (normalizedUserRole === 'SUPER ADMIN' || normalizedUserRole === 'OWNER') {
      return true;
    }

    // Role check
    let roleMatches = false;
    if (scopeRole === 'PUBLIC' || scope.audience === 'PUBLIC') {
      roleMatches = true;
    } else if (scopeRole === normalizedUserRole) {
      roleMatches = true;
    } else if (normalizedUserRole === 'RENTER' && scopeRole === 'RENTER') {
      roleMatches = true;
    } else if (
      (normalizedUserRole === 'PROVIDER' || normalizedUserRole === 'INDIVIDUAL PROVIDER' || normalizedUserRole === 'BUSINESS PROVIDER') &&
      (scopeRole === 'INDIVIDUAL PROVIDER' || scopeRole === 'BUSINESS PROVIDER' || scopeRole === 'PROVIDER')
    ) {
      roleMatches = true;
    } else if (normalizedUserRole === 'ADMIN' && (scopeRole === 'ADMIN' || scopeRole === 'OPERATOR')) {
      roleMatches = true;
    }

    if (!roleMatches) return false;

    // Permission check if specified
    if (scope.requiredPermission) {
      return userPermissions.includes(scope.requiredPermission);
    }

    return true;
  });
}
