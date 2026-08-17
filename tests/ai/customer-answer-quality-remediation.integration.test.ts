import { readFileSync } from 'fs';
import { resolve } from 'path';
import { CUSTOMER_FACING_BOT_IDS, getAllowedBotsForRole } from '@/lib/ai/ai-permissions';
import {
  composeGroundedAnswer,
  type GroundedAnswerDiagnostic,
} from '@/lib/ai/context/grounded-answer-composer';
import { processMockAIRequest } from '@/lib/ai/mock-ai';
import { retrieveApprovedKnowledgeEvidence } from '@/lib/ai/context/knowledge-retrieval';
import { classifyRentipidQuestion } from '@/lib/ai/context/question-classifier';
import { projectCustomerAnswerableText } from '@/lib/ai/context/customer-knowledge-projection';

const INTERNAL_OUTPUT =
  /taxonomy fields|reads only|ingested|negative test fixtures|sample users|sample bookings|source\s*key|chunk\s*(?:id|key)|registry|freeze hash|booking mutation|domain authority|deterministic policy|internal specialist|mock provider|recalled car seat|damaged helmet/i;

async function finalAnswer(
  question: string,
  role: string,
  onDiagnostic?: (diagnostic: GroundedAnswerDiagnostic) => void,
) {
  const retrieval = await retrieveApprovedKnowledgeEvidence(question, role);
  const answer = composeGroundedAnswer({
    question,
    effectiveQuestion: retrieval.classification.effectiveQuestion,
    classification: retrieval.classification.kind,
    evidence: retrieval.matches,
    questionAnalysis: retrieval.classification,
    onDiagnostic,
  });
  return { retrieval, answer };
}

function expectGroundedCustomerAnswer(
  result: Awaited<ReturnType<typeof finalAnswer>>,
  intent: string,
  domain: string,
) {
  expect(result.retrieval.classification.kind).toBe('STATIC_RENTIPID_KNOWLEDGE');
  expect(result.retrieval.classification.intent).toBe(intent);
  expect(result.retrieval.classification.domains).toContain(domain);
  expect(result.retrieval.matches.length).toBeGreaterThan(0);
  expect(result.retrieval.matches.every(match => match.customerProjected)).toBe(true);
  expect(result.retrieval.matches.map(match => match.content).join('\n')).not.toMatch(INTERNAL_OUTPUT);
  expect(result.answer.safelyUncertain).toBe(false);
  expect(result.answer.adequacyPassed).toBe(true);
  expect(result.answer.materialClaims.length).toBeGreaterThan(0);
  expect(result.answer.materialClaims.every(claim => claim.evidenceRefs.length > 0)).toBe(true);
  expect(result.answer.message).not.toMatch(INTERNAL_OUTPUT);
  expect(result.answer.message).not.toMatch(/\[[^\]]+\s*>|provider mode|implementation|governance/i);
}

const BOOKING_QUESTIONS = [
  'How does booking work?',
  'Can you explain the booking process?',
  'What happens when I book an item?',
  'How do I reserve something?',
];

const PAYMENT_QUESTIONS = [
  'How do providers get paid?',
  'How can I receive payment as a provider?',
  'When do I receive my rental payment?',
  'How does provider payout work?',
];

const LISTING_QUESTIONS = [
  'I am already a provider. How do I list an item?',
  'I already have a provider account. How do I add another rental?',
  'My provider account is active. How can I create another listing?',
  'How can an existing provider add a rental?',
];

const CATEGORY_QUESTIONS = [
  'Can I list cars for rent?',
  'Can I rent out a condominium?',
  'Can I list cars and condominiums?',
  'What types of rentals are allowed?',
];

const REGISTRATION_QUESTIONS = [
  'How do I register?',
  'How do I create a RENTipid account?',
  'I am new. How can I join RENTipid?',
];

describe('customer answer quality remediation', () => {
  test.each([
    ['How does booking work?', 'Renter', 'BOOKING_PROCESS'],
    ['How do providers get paid?', 'Business Provider', 'PROVIDER_PAYMENT_PROCESS'],
    ['I already have a provider account. How do I add another rental?', 'Business Provider', 'CREATE_LISTING'],
  ])('records the proven pre-adequacy path internally: %s', async (question, role, intent) => {
    const diagnostics: GroundedAnswerDiagnostic[] = [];
    const result = await finalAnswer(question, role, diagnostic => diagnostics.push(diagnostic));
    expect(result.retrieval.classification.intent).toBe(intent);
    expect(result.retrieval.matches.length).toBeGreaterThan(0);
    expect(result.retrieval.matches.every(match => match.customerProjected)).toBe(true);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      intent,
      evidenceSufficient: true,
    });
    expect(diagnostics[0].evidenceRefs.length).toBeGreaterThan(0);
    expect(diagnostics[0].projectedEvidence.join('\n')).not.toMatch(INTERNAL_OUTPUT);
    expect(diagnostics[0].preAdequacyAnswer).not.toMatch(/not sufficient to answer/i);
    expect(diagnostics[0].requestedConcepts.length).toBeGreaterThan(0);
    expect(diagnostics[0].finalAnswer).toBe(result.answer.message);
    expect(result.answer.safelyUncertain).toBe(false);
  });

  test.each(BOOKING_QUESTIONS)('booking answer is procedural and direct: %s', async question => {
    const result = await finalAnswer(question, 'Renter');
    expectGroundedCustomerAnswer(result, 'BOOKING_PROCESS', 'Marketplace');
    expect(result.answer.message).toMatch(/booking on rentipid works like this/i);
    expect(result.answer.message).toMatch(/browse|listing/i);
    expect(result.answer.message).toMatch(/booking request/i);
    expect(result.answer.message).toMatch(/provider/i);
    expect(result.answer.message).toMatch(/payment|agreement|return/i);
    expect(result.answer.message.match(/^\d+[.)]\s+/gm)).toHaveLength(4);
  });

  test.each(PAYMENT_QUESTIONS)('provider payment answer explains payout: %s', async question => {
    const result = await finalAnswer(question, 'Business Provider');
    expectGroundedCustomerAnswer(result, 'PROVIDER_PAYMENT_PROCESS', 'Payments');
    expect(result.answer.message).toMatch(/provider.*(?:payment|payout)|payout process/i);
    expect(result.answer.message).toMatch(/my payouts/i);
    expect(result.answer.message).toMatch(/finance review/i);
    expect(result.answer.message).toMatch(/manually|processing is complete/i);
    expect(result.answer.message.match(/^\d+[.)]\s+/gm)?.length).toBeGreaterThanOrEqual(3);
  });

  test.each(LISTING_QUESTIONS)('existing provider gets listing creation, not onboarding: %s', async question => {
    const result = await finalAnswer(question, 'Business Provider');
    expectGroundedCustomerAnswer(result, 'CREATE_LISTING', 'Marketplace');
    expect(result.retrieval.classification.providerContext).toBe('EXISTING_PROVIDER');
    expect(result.answer.message).toMatch(/already have a provider account/i);
    expect(result.answer.message).toMatch(/provider listings|create new listing/i);
    expect(result.answer.message).toMatch(/draft/i);
    expect(result.answer.message).toMatch(/submit for review/i);
    expect(result.answer.message).not.toMatch(/provider onboarding|register as|kyc|business registration/i);
  });

  test.each(CATEGORY_QUESTIONS)('category eligibility answers every requested category: %s', async question => {
    const result = await finalAnswer(question, 'Business Provider');
    expectGroundedCustomerAnswer(result, 'CATEGORY_ELIGIBILITY', 'Marketplace');
    if (/cars/i.test(question)) expect(result.answer.message).toMatch(/cars:\s*supported/i);
    if (/condominium/i.test(question)) {
      expect(result.answer.message).toMatch(/condominiums & apartments:\s*supported/i);
    }
    if (/types/i.test(question)) {
      expect(result.answer.message).toMatch(/supported rental categories include/i);
      expect(result.answer.message).toMatch(/cars/i);
      expect(result.answer.message).toMatch(/condominiums & apartments/i);
    }
  });

  test('mixed knowledge is structurally projected before customer composition', () => {
    const projected = projectCustomerAnswerableText([
      '# Marketplace Category Taxonomy',
      'This provider reads only taxonomy fields; sample users and negative test fixtures are never ingested.',
      '- Cars (cars): Economy Cars, Sedans',
      'Examples: Recalled car seat, Damaged helmet.',
    ].join('\n'));
    expect(projected).toContain('# Rental Categories');
    expect(projected).toContain('- Cars (cars): Economy Cars, Sedans');
    expect(projected).not.toMatch(INTERNAL_OUTPUT);
  });

  test.each(REGISTRATION_QUESTIONS)('registration answer explains account creation: %s', async question => {
    const result = await finalAnswer(question, 'Guest');
    expectGroundedCustomerAnswer(result, 'REGISTRATION', 'Core');
    expect(result.answer.message).toMatch(/create a rentipid account/i);
    expect(result.answer.message).toMatch(/register|sign up/i);
    expect(result.answer.message).toMatch(/name|email|mobile/i);
    expect(result.answer.message).toMatch(/terms and conditions|privacy policy/i);
  });

  test('all ordinary customer bots share the same grounded final-answer contract', async () => {
    const union = new Set([
      ...getAllowedBotsForRole('Guest'),
      ...getAllowedBotsForRole('Renter'),
      ...getAllowedBotsForRole('Individual Provider'),
      ...getAllowedBotsForRole('Business Provider'),
    ]);
    expect(new Set(CUSTOMER_FACING_BOT_IDS)).toEqual(union);
    expect(CUSTOMER_FACING_BOT_IDS).toHaveLength(18);

    const question = 'How does booking work?';
    const retrieval = await retrieveApprovedKnowledgeEvidence(question, 'Renter');
    const grounding = {
      question,
      effectiveQuestion: retrieval.classification.effectiveQuestion,
      classification: retrieval.classification.kind,
      evidence: retrieval.matches,
      questionAnalysis: retrieval.classification,
    };
    const answers = await Promise.all(CUSTOMER_FACING_BOT_IDS.map(botId =>
      processMockAIRequest(botId, question, 'approved evidence', 'simple English', grounding)));
    expect(new Set(answers.map(answer => answer.message))).toEqual(new Set([answers[0].message]));
    expect(answers.every(answer => answer.adequacyPassed && !answer.safelyUncertain)).toBe(true);
  });

  test('multi-turn context keeps existing-provider listing state without granting authority', async () => {
    const context = [
      { role: 'user' as const, content: 'I am already a provider.' },
      { role: 'assistant' as const, content: 'What would you like to do?' },
    ];
    const result = await retrieveApprovedKnowledgeEvidence(
      'How do I list another item?',
      'Business Provider',
      context,
    );
    expect(result.classification.usedConversationContext).toBe(true);
    expect(result.classification.providerContext).toBe('EXISTING_PROVIDER');
    expect(result.classification.intent).toBe('CREATE_LISTING');
    expect(result.matches[0].headingPath).toMatch(/listing/i);
    expect(result.matches[0].headingPath).not.toMatch(/onboarding|registration/i);
  });

  test.each([
    ['How do refunds work?', 'STATIC_RENTIPID_KNOWLEDGE'],
    ['Has my refund been issued?', 'LIVE_RENTIPID_STATE'],
    ['How do provider payments work?', 'STATIC_RENTIPID_KNOWLEDGE'],
    ['Has my payout been sent?', 'LIVE_RENTIPID_STATE'],
    ['How does KYC work?', 'STATIC_RENTIPID_KNOWLEDGE'],
    ['Is my KYC approved?', 'LIVE_RENTIPID_STATE'],
    ['Cancel this booking.', 'CONSEQUENTIAL_ACTION'],
    ['Release my deposit now.', 'CONSEQUENTIAL_ACTION'],
    ['Send my payout.', 'CONSEQUENTIAL_ACTION'],
  ])('separates static, live, and action authority: %s', (question, expected) => {
    expect(classifyRentipidQuestion(question).kind).toBe(expected);
  });

  test('unsupported RENTipid claim and external question use safe boundaries', async () => {
    const unsupported = await finalAnswer('Does RENTipid guarantee same-day provider payouts?', 'Renter');
    expect(unsupported.retrieval.matches).toEqual([]);
    expect(unsupported.answer.safelyUncertain).toBe(true);
    expect(unsupported.answer.materialClaims).toEqual([]);

    const external = await finalAnswer('How do I bake sourdough bread?', 'Renter');
    expect(external.retrieval.classification.kind).toBe('OUT_OF_SCOPE_OR_UNSUPPORTED');
    expect(external.answer.message).toMatch(/ask me a rentipid question/i);
    expect(external.answer.materialClaims).toEqual([]);
  });

  test('owner questions exist only as tests, not production routing rules', () => {
    const runtimeFiles = [
      'src/lib/ai/context/question-classifier.ts',
      'src/lib/ai/context/knowledge-retrieval.ts',
      'src/lib/ai/context/grounded-answer-composer.ts',
      'src/lib/ai/ai-command-layer.ts',
    ];
    const production = runtimeFiles
      .map(file => readFileSync(resolve(process.cwd(), file), 'utf8'))
      .join('\n');
    const ownerQuestions = [
      ...BOOKING_QUESTIONS,
      ...PAYMENT_QUESTIONS,
      ...LISTING_QUESTIONS,
      ...CATEGORY_QUESTIONS,
    ];
    for (const question of ownerQuestions) expect(production).not.toContain(question);
  });
});
