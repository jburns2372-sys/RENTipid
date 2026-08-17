import {
  composeGroundedDraft,
  type GroundedAnswerInput,
  type GroundedAnswerResult,
} from './grounded-answer-composer';
import { buildCustomerEvidenceBundle } from './customer-evidence-bundle';
import { verifyGroundedAnswer } from './grounded-answer-verifier';
import { resolveStructuredCategories } from './structured-category-resolver';
import {
  resolveGroundedInformationProvider,
  type GroundedInformationProvider,
  type GroundedSynthesisOutput,
} from '../providers/grounded-information-provider';
import { AiCircuitBreaker } from '../resilience/AiCircuitBreaker';

export interface CanonicalInformationAnswerOptions {
  providerMode: string;
  systemPrompt: string;
  conversationContext: string;
  provider?: GroundedInformationProvider | null;
}

function generatedResult(output: GroundedSynthesisOutput, input: GroundedAnswerInput): GroundedAnswerResult {
  const refs = [...new Set(output.claims.flatMap(claim => claim.evidenceRefs))];
  const categoryFacts = input.evidenceBundle ? resolveStructuredCategories(input.evidenceBundle) : [];
  return {
    message: output.answer.trim(),
    evidenceRefs: refs,
    materialClaims: output.claims.map(claim => ({
      text: claim.text,
      evidenceRefs: [...claim.evidenceRefs],
      supportingText: claim.supportingText,
    })),
    safelyUncertain: categoryFacts.some(fact => fact.status === 'UNCONFIRMED'),
    answeredIntent: output.answeredIntent,
    coveredEntities: [...output.coveredEntities],
  };
}

function decorateFallback(draft: GroundedAnswerResult, input: GroundedAnswerInput): GroundedAnswerResult {
  return {
    ...draft,
    answeredIntent: input.questionAnalysis?.intent,
    coveredEntities: input.evidenceBundle?.requestedEntities ?? [],
    composerMode: 'DETERMINISTIC_FALLBACK',
    composerProvider: 'deterministic-evidence-fallback',
    retryUsed: false,
  };
}

function uncertainty(
  input: GroundedAnswerInput,
  evidenceSufficient: boolean,
  attempts: 1 | 2,
  reasons: readonly string[],
  fallbackReason: string,
): GroundedAnswerResult {
  return {
    message: evidenceSufficient
      ? 'Approved RENTipid information is not sufficient to answer that clearly. Please be more specific.'
      : 'I do not have enough approved RENTipid information to answer that. Could you be more specific?',
    evidenceRefs: [],
    materialClaims: [],
    safelyUncertain: true,
    adequacyPassed: !evidenceSufficient,
    evidenceSufficient,
    compositionAttempts: attempts,
    answeredIntent: input.questionAnalysis?.intent,
    coveredEntities: [],
    composerMode: 'DETERMINISTIC_FALLBACK',
    composerProvider: 'deterministic-evidence-fallback',
    verifierReasons: reasons,
    retryUsed: attempts === 2,
    fallbackReason,
  };
}

export async function composeCanonicalInformationAnswer(
  input: GroundedAnswerInput,
  options: CanonicalInformationAnswerOptions,
): Promise<GroundedAnswerResult> {
  if (input.classification !== 'STATIC_RENTIPID_KNOWLEDGE') {
    return decorateFallback(composeGroundedDraft(input), input);
  }
  const analysis = input.questionAnalysis;
  if (!analysis) throw new Error('QUESTION_ANALYSIS_REQUIRED');
  const bundle = input.evidenceBundle ?? buildCustomerEvidenceBundle(input.question, analysis, input.evidence);
  const groundedInput = { ...input, evidenceBundle: bundle };
  const categoryFacts = analysis.intent === 'CATEGORY_ELIGIBILITY'
    ? resolveStructuredCategories(bundle)
    : [];
  const provider = options.provider === undefined
    ? resolveGroundedInformationProvider(options.providerMode)
    : options.provider;
    
  const breaker = AiCircuitBreaker.getInstance();
  const providerName = provider?.name ?? 'unknown';
  const circuitOpen = breaker.isCircuitOpen(providerName);

  let fallbackReason = bundle.sections.length === 0
    ? 'INSUFFICIENT_CUSTOMER_EVIDENCE'
    : provider?.available()
      ? (circuitOpen ? 'GENERATOR_CIRCUIT_OPEN' : 'GENERATOR_VERIFICATION_FAILED')
      : 'GENERATOR_UNAVAILABLE';

  if (bundle.sections.length > 0 && provider?.available() && !circuitOpen && provider.mode === 'GROUNDED_GENERATIVE') {
    for (const attempt of [1, 2] as const) {
      try {
        const output = await provider.synthesize({
          question: input.question,
          conversationContext: options.conversationContext,
          systemPrompt: options.systemPrompt,
          bundle,
          structuredCategoryFacts: categoryFacts,
          semanticContext: input.semanticContext,
          attempt,
        });
        const candidate = generatedResult(output, groundedInput);
        const verification = verifyGroundedAnswer({ bundle, answer: candidate, structuredCategoryFacts: categoryFacts });
        if (verification.pass) {
          return {
            ...candidate,
            adequacyPassed: true,
            evidenceSufficient: true,
            compositionAttempts: attempt,
            composerMode: 'GROUNDED_GENERATIVE',
            composerProvider: provider.name,
            verifierReasons: [],
            retryUsed: attempt === 2,
          };
        }
        fallbackReason = `VERIFIER_${verification.reasons.join('_')}`;
      } catch (error) {
        breaker.recordError(providerName);
        fallbackReason = error instanceof Error ? error.message : 'GENERATOR_ERROR';
        break; // Stop retrying on provider-level network/auth errors, failover immediately
      }
    }
  }

  // Use Local Grounded Composer for failover or if OpenAI is disabled/unhealthy
  const localProvider = resolveGroundedInformationProvider('local-grounded-composer');
  if (localProvider && bundle.sections.length > 0) {
    try {
      const output = await localProvider.synthesize({
        question: input.question,
        conversationContext: options.conversationContext,
        systemPrompt: options.systemPrompt,
        bundle,
        structuredCategoryFacts: categoryFacts,
        semanticContext: input.semanticContext,
        attempt: 1,
      });
      const candidate = generatedResult(output, groundedInput);
      const verification = verifyGroundedAnswer({ bundle, answer: candidate, structuredCategoryFacts: categoryFacts });
      if (verification.pass) {
        return {
          ...candidate,
          adequacyPassed: true,
          evidenceSufficient: true,
          compositionAttempts: 1,
          composerMode: 'DETERMINISTIC_FALLBACK',
          composerProvider: localProvider.name,
          verifierReasons: [],
          retryUsed: false,
          fallbackReason, // preserve the reason why we fell back
        };
      }
    } catch (error) {
       // fallback below
    }
  }

  const fallback = decorateFallback(composeGroundedDraft(groundedInput), groundedInput);
  const verification = verifyGroundedAnswer({ bundle, answer: fallback, structuredCategoryFacts: categoryFacts });
  if (!verification.pass) {
    return uncertainty(
      groundedInput,
      bundle.sections.length > 0,
      provider?.available() ? 2 : 1,
      verification.reasons,
      fallbackReason,
    );
  }
  return {
    ...fallback,
    adequacyPassed: true,
    evidenceSufficient: bundle.sections.length > 0,
    compositionAttempts: 1,
    verifierReasons: [],
    fallbackReason,
  };
}
