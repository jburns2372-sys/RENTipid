import {
  assessEvidenceSufficiency,
  validateAnswerAdequacy,
} from './answer-adequacy';
import {
  composeGroundedAnswer,
  type GroundedAnswerDiagnostic,
} from './grounded-answer-composer';
import type { RetrievedKnowledgeMatch } from './knowledge-retrieval';
import { classifyRentipidQuestion } from './question-classifier';

function evidence(
  content: string,
  overrides: Partial<RetrievedKnowledgeMatch> = {},
): RetrievedKnowledgeMatch {
  return {
    sourceKey: 'customer.approved-guidance',
    version: '1.0',
    sourceType: 'MANUAL',
    title: 'Approved Customer Guidance',
    module: 'Marketplace',
    topic: 'customer-guidance',
    chunkKey: 'approved-process',
    headingPath: 'Customer Guidance > Process',
    content,
    score: 20,
    coverage: 1,
    attempt: 1,
    customerProjected: true,
    ...overrides,
  };
}

function evidenceRef(match: RetrievedKnowledgeMatch): string {
  return `knowledge:${match.sourceKey}:${match.chunkKey}`;
}

function evaluate(
  question: string,
  sources: readonly RetrievedKnowledgeMatch[],
  message: string,
  claims: readonly string[],
) {
  const classification = classifyRentipidQuestion(question);
  const sufficiency = assessEvidenceSufficiency({
    classification,
    question,
    evidence: sources,
  });
  const result = validateAnswerAdequacy({
    classification,
    message,
    materialClaims: claims.map(text => ({ text, evidenceRefs: [evidenceRef(sources[0])] })),
    safelyUncertain: false,
    evidence: sources,
    evidenceSufficiency: sufficiency,
  });
  return { classification, sufficiency, result };
}

describe('answer adequacy evidence-relative validation', () => {
  test.each([
    {
      question: 'How does booking work?',
      source: evidence('## Booking Process\nSend a booking request for the dates you want.'),
      answer: 'To book an item, send a booking request for the dates you want.',
      claim: 'Send a booking request for the dates you want.',
    },
    {
      question: 'How do providers get paid?',
      source: evidence('## Provider Payout Process\nProviders can check payout status in My Payouts.', {
        module: 'Payments',
        topic: 'provider-payments',
      }),
      answer: 'Providers can check their payment status in My Payouts.',
      claim: 'Providers can check payout status in My Payouts.',
    },
    {
      question: 'I am already a provider. How do I list an item?',
      source: evidence('## Listing Creation\nCreate a listing and submit it for review.', {
        topic: 'listing-creation',
      }),
      answer: 'Create your listing, then submit it for review.',
      claim: 'Create a listing and submit it for review.',
    },
  ])('accepts a concise answer that covers all facts the evidence supports: $question', ({
    question,
    source,
    answer,
    claim,
  }) => {
    const assessed = evaluate(question, [source], answer, [claim]);
    expect(assessed.sufficiency.sufficient).toBe(true);
    expect({ pass: assessed.result.pass, reasons: assessed.result.reasons })
      .toEqual({ pass: true, reasons: [] });
    expect(assessed.result.procedureCount).toBe(0);
    expect(assessed.result.conceptCount).toBeGreaterThan(0);
  });

  test('rejects a correct-domain booking answer that does not explain booking', () => {
    const source = evidence('## Booking Process\nChoose dates and send a booking request to the provider.');
    const assessed = evaluate(
      'How does booking work?',
      [source],
      'Bookings are handled by RENTipid.',
      ['Bookings are handled by RENTipid.'],
    );
    expect(assessed.sufficiency.sufficient).toBe(true);
    expect(assessed.result.pass).toBe(false);
    expect(assessed.result.reasons).toContain('INTENT_NOT_ANSWERED');
  });

  test('rejects a provider-payment answer containing only a safety disclaimer', () => {
    const source = evidence('## Provider Payout Process\nCheck payout status in My Payouts.', {
      module: 'Payments',
    });
    const assessed = evaluate(
      'How do providers get paid?',
      [source],
      'Payout actions require safety controls.',
      ['Payout actions require safety controls.'],
    );
    expect(assessed.result.pass).toBe(false);
    expect(assessed.result.reasons).toEqual(expect.arrayContaining([
      'UNGROUNDED_CLAIM',
      'INTENT_NOT_ANSWERED',
    ]));
  });

  test('rejects onboarding guidance for an existing-provider listing question', () => {
    const source = evidence('## Listing Creation\nCreate a listing and submit it for review.');
    const assessed = evaluate(
      'I already have a provider account. How do I add another rental?',
      [source],
      'Register as a provider and complete KYC.',
      ['Register as a provider and complete KYC.'],
    );
    expect(assessed.classification.providerContext).toBe('EXISTING_PROVIDER');
    expect(assessed.result.pass).toBe(false);
    expect(assessed.result.reasons).toContain('INTENT_NOT_ANSWERED');
  });

  test('rejects a multi-category answer that omits one requested category', () => {
    const source = evidence([
      '## Supported Rental Categories',
      '- Cars (cars): Sedans, Vans',
      '- Condominiums & Apartments (condominiums-apartments): Condominiums, Apartments',
    ].join('\n'), { sourceKey: 'provider.marketplace-taxonomy' });
    const assessed = evaluate(
      'Can I list cars and condominiums?',
      [source],
      'Cars are supported.',
      ['Cars are supported.'],
    );
    expect(assessed.sufficiency.sufficient).toBe(true);
    expect(assessed.result.pass).toBe(false);
    expect(assessed.result.reasons).toContain('INTENT_NOT_ANSWERED');
  });

  test('treats unrelated evidence as insufficient', () => {
    const source = evidence('## Provider Payout Process\nCheck payout status in My Payouts.', {
      module: 'Payments',
      topic: 'provider-payments',
    });
    const assessed = evaluate(
      'How does booking work?',
      [source],
      'Check payout status in My Payouts.',
      ['Check payout status in My Payouts.'],
    );
    expect(assessed.sufficiency.sufficient).toBe(false);
    expect(assessed.sufficiency.reasons).toContain('EVIDENCE_INTENT_MISMATCH');
    expect(assessed.result.pass).toBe(false);
  });

  test('rejects an invented procedural claim even when its evidence reference is real', () => {
    const source = evidence('## Booking Process\nSend a booking request for the dates you want.');
    const assessed = evaluate(
      'How does booking work?',
      [source],
      'Send a booking request. Then pay a refundable reservation fee.',
      [
        'Send a booking request for the dates you want.',
        'Pay a refundable reservation fee.',
      ],
    );
    expect(assessed.sufficiency.sufficient).toBe(true);
    expect(assessed.result.pass).toBe(false);
    expect(assessed.result.reasons).toContain('UNGROUNDED_CLAIM');
  });

  test('performs one bounded recomposition from the same sufficient evidence', () => {
    const source = evidence([
      '## Booking Process',
      'Bookings are handled by RENTipid.',
      'Choose dates and send the request to the provider.',
    ].join('\n'));
    const diagnostics: GroundedAnswerDiagnostic[] = [];
    const classification = classifyRentipidQuestion('How does booking work?');
    const answer = composeGroundedAnswer({
      question: 'How does booking work?',
      effectiveQuestion: classification.effectiveQuestion,
      classification: classification.kind,
      questionAnalysis: classification,
      evidence: [source],
      onDiagnostic: diagnostic => diagnostics.push(diagnostic),
    });

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].evidenceSufficient).toBe(true);
    expect(diagnostics[0].adequacyReasons).toContain('INTENT_NOT_ANSWERED');
    expect(diagnostics[0].recompositionAttempted).toBe(true);
    expect(answer.compositionAttempts).toBe(2);
    expect(answer.adequacyPassed).toBe(true);
    expect(answer.safelyUncertain).toBe(false);
    expect(answer.message).toMatch(/choose dates/i);
    expect(answer.message).toMatch(/send the request/i);
    expect(answer.materialClaims.every(claim => claim.evidenceRefs[0] === evidenceRef(source))).toBe(true);
  });
});
