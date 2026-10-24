import { composeCanonicalInformationAnswer } from './canonical-information-answer';
import { buildCustomerEvidenceBundle } from './customer-evidence-bundle';
import { classifyRentipidQuestion } from './question-classifier';
import type { RetrievedKnowledgeMatch } from './knowledge-retrieval';
import type {
  GroundedInformationProvider,
  GroundedSynthesisInput,
  GroundedSynthesisOutput,
} from '../providers/grounded-information-provider';

const CONTENT = 'Send a booking request for the dates you want.';

function evidence(): RetrievedKnowledgeMatch {
  return {
    sourceKey: 'marketplace.customer-guide',
    version: '1.0',
    sourceType: 'PUBLISHED_GUIDANCE',
    title: 'Customer Guide',
    module: 'Marketplace',
    topic: 'booking',
    chunkKey: 'booking-process',
    headingPath: 'Customer Guide > Booking Process',
    sectionKey: 'marketplace-customer-guide:booking-process',
    sectionTitle: 'Booking Process',
    ordinal: 0,
    visibility: 'PUBLIC',
    audience: 'CUSTOMER',
    answerClass: 'INFORMATION',
    entities: ['booking'],
    content: CONTENT,
    score: 20,
    coverage: 1,
    attempt: 1,
    customerProjected: true,
    evidenceRole: 'SEED',
  };
}

class RetryProvider implements GroundedInformationProvider {
  readonly name = 'retry-provider';
  readonly mode = 'GROUNDED_GENERATIVE' as const;
  calls = 0;

  available() {
    return true;
  }

  async synthesize(input: GroundedSynthesisInput): Promise<GroundedSynthesisOutput> {
    this.calls += 1;
    const ref = input.bundle.evidenceRefs[0];
    if (this.calls === 1) {
      return {
        answer: 'Bookings are handled by RENTipid.',
        answeredIntent: input.bundle.classification.intent,
        coveredEntities: [],
        claims: [{ text: 'Bookings are handled by RENTipid.', evidenceRefs: [ref], supportingText: CONTENT }],
      };
    }
    return {
      answer: 'To book an item, send a booking request for the dates you want.',
      answeredIntent: input.bundle.classification.intent,
      coveredEntities: [],
      claims: [{ text: CONTENT, evidenceRefs: [ref], supportingText: CONTENT }],
    };
  }
}

describe('canonical information answer retry', () => {
  test('recomposes exactly once when sufficient evidence produces a non-responsive first answer', async () => {
    const question = 'How does booking work?';
    const classification = classifyRentipidQuestion(question);
    const match = evidence();
    const bundle = buildCustomerEvidenceBundle(question, classification, [match]);
    const provider = new RetryProvider();
    const result = await composeCanonicalInformationAnswer({
      question,
      effectiveQuestion: classification.effectiveQuestion,
      classification: classification.kind,
      questionAnalysis: classification,
      evidence: [match],
      evidenceBundle: bundle,
    }, {
      providerMode: 'openai',
      provider,
      systemPrompt: 'Use only supplied evidence.',
      conversationContext: '[]',
    });

    expect(provider.calls).toBe(2);
    expect(result.composerMode).toBe('GROUNDED_GENERATIVE');
    expect(result.retryUsed).toBe(true);
    expect(result.compositionAttempts).toBe(2);
    expect(result.adequacyPassed).toBe(true);
    expect(result.message).toMatch(/send a booking request/i);
  });
});
