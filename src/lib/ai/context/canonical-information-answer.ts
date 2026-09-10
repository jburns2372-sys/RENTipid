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
import { composePolicyAuthorityAnswer } from './policy-authority';
import { composeToolAuthorityExplanation } from './tool-authority';
import {
  composeCustomerContractAnswer,
  verifyCustomerAnswerContract,
  type CustomerAnswerContractVerification,
} from './customer-answer-contract';

function internalKnowledgeAnswer(input: GroundedAnswerInput): GroundedAnswerResult {
  const matches = input.evidence.filter(match => match.audience === 'INTERNAL');
  if (matches.length === 0) {
    return uncertainty(input, false, 1, ['INTERNAL_AUTHORITY_UNAVAILABLE'], 'INTERNAL_AUTHORITY_UNAVAILABLE');
  }
  const claims = matches.map(match => {
    const ref = `knowledge:${match.sourceKey}:${match.chunkKey}`;
    return { text: match.content, evidenceRefs: [ref], supportingText: match.content };
  });
  return {
    message: matches.map(match => match.content).join('\n\n'),
    evidenceRefs: claims.flatMap(claim => claim.evidenceRefs),
    materialClaims: claims,
    safelyUncertain: false,
    adequacyPassed: true,
    evidenceSufficient: true,
    compositionAttempts: 1,
    answeredIntent: input.questionAnalysis?.intent,
    coveredEntities: [],
    composerMode: 'DETERMINISTIC_FALLBACK',
    composerProvider: 'deterministic-internal-knowledge',
    verifierReasons: [],
    retryUsed: false,
  };
}

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

function contractDiagnostics(
  verification: CustomerAnswerContractVerification,
): Pick<GroundedAnswerResult,
  'contractVerified' | 'contractSafeHold' | 'contractMissingRequiredFacts' | 'contractForbiddenClaims'> {
  return {
    contractVerified: verification.pass,
    contractSafeHold: verification.safeHold,
    contractMissingRequiredFacts: verification.missingRequiredFacts,
    contractForbiddenClaims: verification.forbiddenClaims,
  };
}

function protectSpecialAuthorityAnswer(
  input: GroundedAnswerInput,
  draft: GroundedAnswerResult,
): GroundedAnswerResult {
  const objective = input.customerObjective;
  const bundle = input.evidenceBundle
    ?? buildCustomerEvidenceBundle(
      input.question,
      input.questionAnalysis ?? classifyFallback(input),
      input.evidence,
    );
  if (!objective) return draft;
  const authorityRefs = draft.evidenceRefs.filter(ref => ref.startsWith('policy:') || ref.startsWith('tool:') || ref.startsWith('live:'));
  if (authorityRefs.length === 0 && objective.answerContract.authorityReference) {
    if (objective.answerContract.authorityClass === 'POLICY_AUTHORITY') {
      authorityRefs.push(`policy:${objective.answerContract.authorityReference}:${objective.answerContract.specificEntity ?? 'catalog'}`);
    } else if (objective.answerContract.authorityClass === 'ACTION_TOOL') {
      authorityRefs.push(`tool:${objective.answerContract.toolKey ?? objective.answerContract.authorityReference}`);
    }
  }
  const contracted = composeCustomerContractAnswer(objective, authorityRefs);
  const message = draft.message && !draft.safelyUncertain && draft.coveredEntities && draft.coveredEntities.length > 0
    ? `${draft.message}\n\n${contracted.message}`
    : contracted.message;
  const candidate: GroundedAnswerResult = {
    ...draft,
    ...contracted,
    message,
    evidenceRefs: Object.freeze([...new Set([...draft.evidenceRefs, ...contracted.evidenceRefs, ...authorityRefs])]),
    materialClaims: [...draft.materialClaims, ...contracted.materialClaims],
    answeredIntent: objective.objectiveId,
    safelyUncertain: false,
    adequacyPassed: true,
  };
  const verification = verifyCustomerAnswerContract({
    objective,
    authority: input.bindingAuthority,
    bundle,
    answer: candidate,
    authorizedLiveEvidenceRef: input.liveEvidenceRef,
  });
  if (!verification.pass) {
    return {
      ...uncertainty(input, verification.evidencePassed, 1, verification.reasons, 'ANSWER_CONTRACT_FAILED'),
      ...contractDiagnostics(verification),
    };
  }
  return {
    ...candidate,
    adequacyPassed: true,
    evidenceSufficient: verification.evidencePassed,
    verifierReasons: [],
    ...contractDiagnostics(verification),
  };
}

function classifyFallback(input: GroundedAnswerInput) {
  if (!input.questionAnalysis) throw new Error('QUESTION_ANALYSIS_REQUIRED');
  return input.questionAnalysis;
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
  if (input.bindingAuthority?.authorityType === 'POLICY_TAXONOMY') {
    if (!input.questionAnalysis) throw new Error('QUESTION_ANALYSIS_REQUIRED');
    return protectSpecialAuthorityAnswer(input, composePolicyAuthorityAnswer(
      input.bindingAuthority.authorityReference,
      input.questionAnalysis,
    ));
  }
  if (input.bindingAuthority?.authorityType === 'TOOL_GATEWAY') {
    if (!input.questionAnalysis) throw new Error('QUESTION_ANALYSIS_REQUIRED');
    return protectSpecialAuthorityAnswer(input, composeToolAuthorityExplanation(
      input.bindingAuthority.toolKey ?? input.bindingAuthority.authorityReference,
      input.questionAnalysis,
    ));
  }
  if (input.bindingAuthority?.audience === 'INTERNAL') {
    return internalKnowledgeAnswer(input);
  }
  const analysis = input.questionAnalysis;
  const bundle = input.evidenceBundle ?? (analysis
    ? buildCustomerEvidenceBundle(input.question, analysis, input.evidence)
    : buildCustomerEvidenceBundle(input.question, classifyFallback(input), input.evidence));
  const groundedInput = { ...input, evidenceBundle: bundle };

  if (input.classification !== 'STATIC_RENTIPID_KNOWLEDGE' || (input.customerObjective && bundle.sections.length === 0)) {
    const draft = decorateFallback(composeGroundedDraft(groundedInput), groundedInput);
    if (!input.customerObjective) return draft;
    const contractRefs = input.liveEvidenceRef
      ? [input.liveEvidenceRef]
      : (input.customerObjective.answerContract.knowledgeSourceKey
          ? [`knowledge:${input.customerObjective.answerContract.knowledgeSourceKey}`]
          : [`knowledge:${input.customerObjective.objectiveId}`]);
    const contractAnswer = composeCustomerContractAnswer(input.customerObjective, contractRefs);
    const combined: GroundedAnswerResult = {
      ...draft,
      message: draft.message && !draft.safelyUncertain
        ? `${draft.message}\n\n${contractAnswer.message}`
        : contractAnswer.message,
      evidenceRefs: [...new Set([...draft.evidenceRefs, ...contractAnswer.evidenceRefs])],
      materialClaims: [...draft.materialClaims, ...contractAnswer.materialClaims],
      safelyUncertain: false,
    };
    const verification = verifyCustomerAnswerContract({
      objective: input.customerObjective,
      authority: input.bindingAuthority,
      bundle,
      answer: combined,
      authorizedLiveEvidenceRef: input.liveEvidenceRef,
    });
    if (!verification.pass) {
      return {
        ...uncertainty(groundedInput, verification.evidencePassed, 1, verification.reasons, 'ANSWER_CONTRACT_FAILED'),
        ...contractDiagnostics(verification),
      };
    }
    return {
      ...combined,
      adequacyPassed: true,
      evidenceSufficient: true,
      verifierReasons: [],
      ...contractDiagnostics(verification),
    };
  }

  const categoryFacts = analysis?.intent === 'CATEGORY_ELIGIBILITY'
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
          customerObjective: input.customerObjective,
          attempt,
        });
        const candidate = generatedResult(output, groundedInput);
        const verification = verifyGroundedAnswer({
          bundle,
          answer: candidate,
          structuredCategoryFacts: categoryFacts,
          customerObjective: input.customerObjective,
          bindingAuthority: input.bindingAuthority,
          authorizedLiveEvidenceRef: input.liveEvidenceRef,
        });
        if (verification.pass) {
          return {
            ...candidate,
            adequacyPassed: true,
            evidenceSufficient: true,
            compositionAttempts: attempt,
            composerMode: 'GROUNDED_GENERATIVE',
            composerProvider: provider.name,
            verifierReasons: [],
            ...(verification.customerContract ? contractDiagnostics(verification.customerContract) : {}),
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
        customerObjective: input.customerObjective,
        attempt: 1,
      });
      const candidate = generatedResult(output, groundedInput);
      const verification = verifyGroundedAnswer({
        bundle,
        answer: candidate,
        structuredCategoryFacts: categoryFacts,
        customerObjective: input.customerObjective,
        bindingAuthority: input.bindingAuthority,
        authorizedLiveEvidenceRef: input.liveEvidenceRef,
      });
      if (verification.pass) {
        return {
          ...candidate,
          adequacyPassed: true,
          evidenceSufficient: true,
          compositionAttempts: 1,
          composerMode: 'DETERMINISTIC_FALLBACK',
          composerProvider: localProvider.name,
          verifierReasons: [],
          ...(verification.customerContract ? contractDiagnostics(verification.customerContract) : {}),
          retryUsed: false,
          fallbackReason, // preserve the reason why we fell back
        };
      }
    } catch (error) {
       // fallback below
    }
  }

  const fallback = decorateFallback(composeGroundedDraft(groundedInput), groundedInput);
  const verification = verifyGroundedAnswer({
    bundle,
    answer: fallback,
    structuredCategoryFacts: categoryFacts,
    customerObjective: input.customerObjective,
    bindingAuthority: input.bindingAuthority,
    authorizedLiveEvidenceRef: input.liveEvidenceRef,
  });
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
    ...(verification.customerContract ? contractDiagnostics(verification.customerContract) : {}),
    fallbackReason,
  };
}
