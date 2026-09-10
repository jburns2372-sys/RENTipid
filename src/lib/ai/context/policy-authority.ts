import { CANONICAL_CATEGORIES } from '@/lib/categories/canonical-categories';
import { CANONICAL_PROHIBITED_POLICIES } from '@/lib/prohibited-items/canonical-policies';
import type { RentipidQuestionClassification } from './question-classifier';
import type { GroundedAnswerResult } from './grounded-answer-composer';

export const POLICY_AUTHORITY_KEYS = Object.freeze([
  'RENTAL_CATEGORY_AND_PROHIBITED_ITEM_POLICY',
] as const);

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/s$/, '');
}

function phrases(value: string): string[] {
  return value.split(',').map(item => normalize(item)).filter(Boolean);
}

function includesTerm(candidate: string, requested: string): boolean {
  const left = normalize(candidate);
  const right = normalize(requested);
  return left === right || left.includes(right) || right.includes(left);
}

function categoryRequirements(category: (typeof CANONICAL_CATEGORIES)[number]): string[] {
  return [
    category.requires_admin_approval ? 'admin approval' : '',
    category.requires_deposit ? 'a security deposit' : '',
    category.requires_insurance ? 'insurance' : '',
    category.requires_permit ? 'permit documentation' : '',
  ].filter(Boolean);
}

function joinRequirements(requirements: readonly string[]): string {
  if (requirements.length < 2) return requirements[0] ?? '';
  return `${requirements.slice(0, -1).join(', ')}, and ${requirements.at(-1)}`;
}

function resolveOne(term: string) {
  const prohibited = CANONICAL_PROHIBITED_POLICIES.find(policy => [
    policy.name,
    policy.slug,
    ...phrases(policy.examples),
    ...phrases(policy.prohibitedKeywords),
    ...phrases(policy.reviewKeywords),
  ].some(candidate => includesTerm(candidate, term)));
  if (prohibited) {
    const status = prohibited.classification === 'PROHIBITED' ? 'PROHIBITED' : 'RESTRICTED';
    return {
      entity: term,
      status,
      message: `${prohibited.name} is ${status.toLowerCase()} under RENTipid's active listing policy.`,
      ref: `policy:RENTAL_CATEGORY_AND_PROHIBITED_ITEM_POLICY:${prohibited.policyCode}`,
      support: `${prohibited.policyCode}; ${prohibited.classification}; ${prohibited.summary}`,
    };
  }

  const category = CANONICAL_CATEGORIES.find(item => [item.name, item.slug]
    .some(candidate => includesTerm(candidate, term)));
  if (!category) {
    return {
      entity: term,
      status: 'UNKNOWN',
      message: `RENTipid cannot confirm ${term} from the active rental category and prohibited-item policies.`,
      ref: '',
      support: '',
    };
  }
  const requirements = categoryRequirements(category);
  const status = requirements.length > 0 ? 'REQUIRES_REVIEW' : 'ALLOWED';
  const condition = requirements.length > 0
    ? ` It requires ${joinRequirements(requirements)} before publication.`
    : '';
  return {
    entity: category.name,
    status,
    message: `${category.name} is a supported RENTipid rental category.${condition}`,
    ref: `policy:RENTAL_CATEGORY_AND_PROHIBITED_ITEM_POLICY:${category.slug}`,
    support: `${category.name}; ${category.risk_level}; ${requirements.join(', ') || 'standard listing review'}`,
  };
}

export function composePolicyAuthorityAnswer(
  authorityReference: string,
  classification: RentipidQuestionClassification,
): GroundedAnswerResult {
  if (!POLICY_AUTHORITY_KEYS.includes(authorityReference as (typeof POLICY_AUTHORITY_KEYS)[number])) {
    return {
      message: 'The required RENTipid policy authority is unavailable.',
      evidenceRefs: [],
      materialClaims: [],
      safelyUncertain: true,
      adequacyPassed: false,
      evidenceSufficient: false,
      answeredIntent: classification.intent,
      coveredEntities: [],
      composerMode: 'DETERMINISTIC_FALLBACK',
      composerProvider: 'deterministic-policy-authority',
      verifierReasons: ['POLICY_AUTHORITY_UNAVAILABLE'],
      fallbackReason: 'POLICY_AUTHORITY_UNAVAILABLE',
    };
  }

  if (classification.requestedCategoryTerms.length === 0) {
    if (
      /\b(?:prohibited|restricted|restrictions|not\s+allowed|aren\s*['’]?\s*t\s+allowed|cannot\s+list|cant\s+list|can\s*['’]?\s*t\s+list|banned|illegal|unsupported|bawal|ano-ano|ano\s+ano)\b/i.test(classification.effectiveQuestion) ||
      /\bwhat\s+(?:can\s*['’]?\s*t|cant|cannot)\s+i\s+list\b/i.test(classification.effectiveQuestion) ||
      /\bwhich\s+items\s+aren\s*['’]?\s*t\s+allowed\b/i.test(classification.effectiveQuestion) ||
      /\b(?:restrictions\s+on\s+what|what\s+(?:am\s+i\s+not\s+allowed|cannot\s+be))\b/i.test(classification.effectiveQuestion)
    ) {
      const blocked = CANONICAL_PROHIBITED_POLICIES
        .map(policy => `${policy.name} (${policy.classification.toLowerCase()})`);
      return {
        message: `RENTipid strictly prohibits illegal, hazardous, dangerous, or regulated items from being listed. Active prohibited listing policies include weapons, illegal drugs, prescription medications, adult content, and stolen goods. RENTipid's active listing policy prohibits or restricts these classes: ${blocked.join(', ')}.`,
        evidenceRefs: CANONICAL_PROHIBITED_POLICIES.map(policy =>
          `policy:RENTAL_CATEGORY_AND_PROHIBITED_ITEM_POLICY:${policy.policyCode}`),
        materialClaims: [
          {
            text: 'RENTipid strictly prohibits illegal, hazardous, dangerous, or regulated items from being listed.',
            evidenceRefs: ['policy:RENTAL_CATEGORY_AND_PROHIBITED_ITEM_POLICY:PI-001'],
            supportingText: 'PI-001; PROHIBITED; Strict prohibition on illegal, hazardous, and regulated items',
          },
          {
            text: 'Active prohibited listing policies include weapons, illegal drugs, prescription medications, adult content, and stolen goods.',
            evidenceRefs: ['policy:RENTAL_CATEGORY_AND_PROHIBITED_ITEM_POLICY:PI-002'],
            supportingText: 'PI-002; PROHIBITED; Active prohibited classes',
          },
          ...CANONICAL_PROHIBITED_POLICIES.map(policy => ({
            text: `${policy.name} is ${policy.classification.toLowerCase()}.`,
            evidenceRefs: [`policy:RENTAL_CATEGORY_AND_PROHIBITED_ITEM_POLICY:${policy.policyCode}`],
            supportingText: `${policy.policyCode}; ${policy.classification}; ${policy.summary}`,
          })),
        ],
        safelyUncertain: false,
        adequacyPassed: true,
        evidenceSufficient: true,
        answeredIntent: classification.intent,
        coveredEntities: [],
        composerMode: 'DETERMINISTIC_FALLBACK',
        composerProvider: 'deterministic-policy-authority',
        verifierReasons: [],
        retryUsed: false,
      };
    }
    const names = CANONICAL_CATEGORIES.map(category => category.name);
    return {
      message: `Supported RENTipid rental categories include ${names.join(', ')}. Items covered by an active prohibited or restricted policy cannot be listed without the policy's required review or are blocked.`,
      evidenceRefs: ['policy:RENTAL_CATEGORY_AND_PROHIBITED_ITEM_POLICY:catalog'],
      materialClaims: [{
        text: 'The response lists the active RENTipid rental categories and preserves prohibited-item controls.',
        evidenceRefs: ['policy:RENTAL_CATEGORY_AND_PROHIBITED_ITEM_POLICY:catalog'],
        supportingText: names.join(', '),
      }],
      safelyUncertain: false,
      adequacyPassed: true,
      evidenceSufficient: true,
      answeredIntent: classification.intent,
      coveredEntities: [],
      composerMode: 'DETERMINISTIC_FALLBACK',
      composerProvider: 'deterministic-policy-authority',
      verifierReasons: [],
      retryUsed: false,
    };
  }

  const results = classification.requestedCategoryTerms.map(resolveOne);
  const supported = results.filter(result => result.status !== 'UNKNOWN');
  const unknown = results.length !== supported.length;
  return {
    message: results.map(result => result.message).join('\n'),
    evidenceRefs: supported.map(result => result.ref),
    materialClaims: supported.map(result => ({
      text: result.message,
      evidenceRefs: [result.ref],
      supportingText: result.support,
    })),
    safelyUncertain: unknown,
    adequacyPassed: !unknown,
    evidenceSufficient: supported.length > 0,
    answeredIntent: classification.intent,
    coveredEntities: supported.map(result => result.entity),
    composerMode: 'DETERMINISTIC_FALLBACK',
    composerProvider: 'deterministic-policy-authority',
    verifierReasons: unknown ? ['POLICY_ENTITY_UNRESOLVED'] : [],
    retryUsed: false,
    fallbackReason: unknown ? 'POLICY_ENTITY_UNRESOLVED' : undefined,
  };
}
