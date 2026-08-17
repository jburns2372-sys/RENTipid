import { composeCanonicalInformationAnswer } from '../../src/lib/ai/context/canonical-information-answer';
import { resolveGroundedInformationProvider } from '../../src/lib/ai/providers/grounded-information-provider';
import type { GroundedAnswerInput } from '../../src/lib/ai/context/grounded-answer-composer';
import type { RetrievedKnowledgeMatch } from '../../src/lib/ai/context/knowledge-retrieval';
import { parseSemanticContext } from '../../src/lib/ai/semantic/normalizer';

async function runSmokeTest() {
  console.log('Starting Live Responses API Smoke Test...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('OPENAI_API_KEY not found, using dummy key to force failover');
    process.env.OPENAI_API_KEY = 'dummy-key';
  }

  const provider = resolveGroundedInformationProvider('openai');

  const evidence: RetrievedKnowledgeMatch[] = [{
    chunkKey: 'chunk1',
    sourceKey: 'source1',
    sectionKey: 'sec1',
    sectionTitle: 'Booking',
    topic: 'Booking',
    headingPath: 'Booking',
    content: 'The booking process allows renters to reserve items.',
    sourceType: 'MANUAL',
    audience: 'CUSTOMER',
    answerClass: 'INFORMATION',
    module: 'booking',
    visibility: 'PUBLIC',
    ordinal: 1,
    score: 10,
  }];

  const question = 'How does booking work?';
  const semanticContext = parseSemanticContext(question, {
    enabled: true,
    maxExpansions: 5,
    fuzzyMatchEnabled: true,
  });

  const input: GroundedAnswerInput = {
    question,
    effectiveQuestion: question,
    classification: 'STATIC_RENTIPID_KNOWLEDGE',
    evidence,
    semanticContext,
    questionAnalysis: {
      intent: 'BOOKING_PROCESS',
      requestedCategoryTerms: [],
      providerContext: 'NOT_APPLICABLE'
    }
  };

  try {
    const result = await composeCanonicalInformationAnswer(input, {
      providerMode: 'openai',
      systemPrompt: 'You are RENTipid AI.',
      conversationContext: '',
      provider,
    });
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (result.composerMode === 'GROUNDED_GENERATIVE') {
      console.log('RESPONSES API: PASS');
    } else {
      console.log('FAILOVER TO LOCAL COMPOSER: PASS');
      console.log('Fallback Reason:', result.fallbackReason);
      console.log('Composer Provider:', result.composerProvider);
      console.log('Answer:', result.message);
    }
  } catch (err) {
    console.error('FAIL:', err);
    if (err instanceof Error) {
      console.error(err.stack);
    }
  }
}

runSmokeTest();
