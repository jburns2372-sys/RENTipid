import { composeGroundedAnswer } from './grounded-answer-composer';
import type { RetrievedKnowledgeMatch } from './knowledge-retrieval';

function evidence(content: string, overrides: Partial<RetrievedKnowledgeMatch> = {}): RetrievedKnowledgeMatch {
  return {
    sourceKey: 'core.customer-guide',
    version: '1.0',
    sourceType: 'MANUAL',
    title: 'Customer Guide',
    module: 'Core',
    topic: 'customer-guidance',
    chunkKey: 'customer-steps',
    headingPath: 'Customer Guide > Steps',
    sectionKey: 'core-customer-guide:customer-guide-steps',
    sectionTitle: 'Steps',
    ordinal: 0,
    visibility: 'PUBLIC',
    audience: 'CUSTOMER',
    answerClass: 'INFORMATION',
    entities: ['customer', 'guide', 'steps'],
    content,
    score: 12,
    coverage: 1,
    attempt: 1,
    evidenceRole: 'SEED',
    ...overrides,
  };
}

describe('grounded answer composer', () => {
  test('turns approved procedural evidence into concise numbered steps with claim linkage', () => {
    const source = evidence([
      '## Provider Quick Procedure',
      '1. Complete provider onboarding and verification.',
      '2. Create a listing with photos and category details.',
      '3. Submit the listing for review.',
      '4. Check the listing status in your dashboard.',
    ].join('\n'), {
      module: 'Marketplace',
      topic: 'listing-creation',
      sectionTitle: 'Provider listing procedure',
      entities: ['provider', 'listing', 'item'],
    });
    const result = composeGroundedAnswer({
      question: 'How do I list an item?',
      effectiveQuestion: 'How do I list an item?',
      classification: 'STATIC_RENTIPID_KNOWLEDGE',
      evidence: [source],
    });

    expect(result.message).toContain('1. Complete provider onboarding and verification.');
    expect(result.message).toContain('2. Create a listing with photos and category details.');
    expect(result.message).not.toContain(source.sourceKey);
    expect(result.message).not.toContain(source.chunkKey);
    expect(result.materialClaims).toHaveLength(4);
    expect(result.materialClaims.every(claim => claim.evidenceRefs.length > 0)).toBe(true);
    expect(result.evidenceRefs).toEqual([`knowledge:${source.sourceKey}:${source.chunkKey}`]);
  });

  test('does not dump raw documentation or internal markers', () => {
    const source = evidence('RENTipid users can browse listings. Database migration PASS4 source key internal details are excluded.');
    const result = composeGroundedAnswer({
      question: 'How can I browse rentals?',
      effectiveQuestion: 'How can I browse rentals?',
      classification: 'STATIC_RENTIPID_KNOWLEDGE',
      evidence: [source],
    });
    expect(result.message).toBe('RENTipid users can browse listings.');
    expect(result.message).not.toMatch(/database|migration|source key|PASS4/i);
    expect(result.message.length).toBeLessThan(source.content.length);
  });

  test('rewrites sensitive terminology without a customer debug label', () => {
    const source = evidence('Keep passwords out of support notes. Use the support process for help.');
    const result = composeGroundedAnswer({
      question: 'What safety guidance should I follow?',
      effectiveQuestion: 'What safety guidance should I follow?',
      classification: 'STATIC_RENTIPID_KNOWLEDGE',
      evidence: [source],
    });
    expect(result.message).toContain('sign-in secrets');
    expect(result.message).not.toMatch(/password|mock|source|chunk/i);
  });

  test('does not invent a timeline absent from approved evidence', () => {
    const result = composeGroundedAnswer({
      question: 'How long does provider approval take?',
      effectiveQuestion: 'How do I become a provider? Follow-up: How long does it take?',
      classification: 'STATIC_RENTIPID_KNOWLEDGE',
      evidence: [evidence('Complete identity verification and submit the required business documents.')],
    });
    expect(result.safelyUncertain).toBe(true);
    expect(result.materialClaims).toEqual([]);
    expect(result.message).toContain("don't have an approved RENTipid timeline");
  });

  test('answers live state only from an authorized domain-state result', () => {
    const result = composeGroundedAnswer({
      question: 'What is my booking status?',
      effectiveQuestion: 'What is my booking status?',
      classification: 'LIVE_RENTIPID_STATE',
      evidence: [],
      authorizedLiveContext: 'Authoritative booking state: status=Confirmed; payment=Paid; refreshedAt=2026-08-17T00:00:00.000Z',
      liveEvidenceRef: 'live:Booking:booking-1',
    });
    expect(result.message).toContain('status: Confirmed');
    expect(result.message).toContain('payment: Paid');
    expect(result.message).not.toContain('refreshedAt');
    expect(result.materialClaims[0].evidenceRefs).toEqual(['live:Booking:booking-1']);
  });

  test('declines live state when no authorized record is available', () => {
    const result = composeGroundedAnswer({
      question: 'What is my booking status?',
      effectiveQuestion: 'What is my booking status?',
      classification: 'LIVE_RENTIPID_STATE',
      evidence: [],
    });
    expect(result.safelyUncertain).toBe(true);
    expect(result.evidenceRefs).toEqual([]);
  });

  test('keeps external questions inside the RENTipid scope boundary', () => {
    const result = composeGroundedAnswer({
      question: 'Who is the president of France?',
      effectiveQuestion: 'Who is the president of France?',
      classification: 'OUT_OF_SCOPE_OR_UNSUPPORTED',
      evidence: [],
    });
    expect(result.message).toContain('Please ask me a RENTipid question.');
    expect(result.materialClaims).toEqual([]);
  });
});
