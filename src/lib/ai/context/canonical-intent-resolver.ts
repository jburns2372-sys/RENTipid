import { prisma } from '@/lib/prisma';
import { normalizeQuestionText } from './canonical-intent-registry';

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
  return byFeature[feature] ?? (intentKey.startsWith('internal.') ? undefined : undefined);
}

export async function resolveCanonicalIntent(
  userQuery: string,
  userRole = 'Guest',
  userPermissions: string[] = []
): Promise<ResolvedCanonicalIntentMatch | null> {
  const normalizedQuery = normalizeQuestionText(userQuery);
  if (!normalizedQuery) return null;

  // 1. Level 1: Exact Canonical Question or Normalized Match
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

  // 2. Level 2: Exact Approved Alias or Normalized Alias Match
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

  return null;
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
