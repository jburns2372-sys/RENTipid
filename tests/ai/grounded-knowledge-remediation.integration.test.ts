import { prisma } from '@/lib/prisma';
import { composeGroundedAnswer } from '@/lib/ai/context/grounded-answer-composer';
import {
  retrieveApprovedKnowledgeEvidence,
  retrieveApprovedKnowledgeMatches,
} from '@/lib/ai/context/knowledge-retrieval';
import { classifyRentipidQuestion, type ConversationContextMessage } from '@/lib/ai/context/question-classifier';
import { getSynchronizableKnowledgeRegistry } from '@/lib/ai/knowledge/source-registry';
import { canAccessKnowledge } from '@/lib/ai/knowledge/visibility';

const CUSTOMER_ROLES = ['Guest', 'Renter', 'Individual Provider', 'Business Provider'] as const;

const MODULE_EVALUATIONS: Record<string, { question: string; role: string }> = {
  Core: { question: 'How do I register and start using RENTipid?', role: 'Guest' },
  Insurance: { question: 'How are rental insurance claims handled?', role: 'Renter' },
  Legal: { question: 'Which laws and terms govern RENTipid?', role: 'Guest' },
  Marketplace: { question: 'How do I browse and book a rental listing?', role: 'Renter' },
  Payments: { question: 'How do payments, deposits, and refunds work?', role: 'Renter' },
  Privacy: { question: 'How can I request correction of my personal data?', role: 'Renter' },
  Security: { question: 'What security permissions does a renter have?', role: 'Renter' },
  Social: { question: 'What social promotion features can a provider use?', role: 'Business Provider' },
  'Trust & Safety': { question: 'What safety guidance should renters follow?', role: 'Renter' },
  'Unified AI': { question: 'What authority does Unified AI have?', role: 'Renter' },
};

const WORKFLOW_EVALUATIONS = [
  ['account registration', 'How can I open a RENTipid account?', 'Guest', ['Core', 'Profile']],
  ['renter onboarding', 'What should a new renter do first?', 'Renter', ['Core', 'Marketplace']],
  ['provider onboarding', 'How do I become a rental provider?', 'Business Provider', ['Core', 'Marketplace']],
  ['listing creation', 'How do I create a rental listing?', 'Business Provider', ['Core', 'Marketplace']],
  ['listing editing', 'What can I edit on a draft listing?', 'Business Provider', ['Core', 'Marketplace']],
  ['listing publishing', 'How do I submit a listing for publication?', 'Business Provider', ['Core', 'Marketplace']],
  ['search and browse', 'How can I browse available rental categories?', 'Renter', ['Marketplace']],
  ['booking', 'How does the item booking process work?', 'Renter', ['Core', 'Marketplace']],
  ['rental lifecycle', 'What happens during inspection, turnover, and return?', 'Renter', ['Core', 'Marketplace']],
  ['payments and deposits', 'How do rental payments and deposits work?', 'Renter', ['Payments', 'Marketplace', 'Core']],
  ['cancellations and refunds', 'How do cancellation and refund requests work?', 'Renter', ['Payments', 'Marketplace', 'Core']],
  ['profile and account', 'How can I update supported profile information?', 'Renter', ['Core', 'Profile']],
  ['verification', 'How does identity verification work?', 'Renter', ['Core', 'Trust & Safety']],
  ['insurance', 'How are rental insurance claims handled?', 'Renter', ['Insurance', 'Trust & Safety']],
  ['mediation and disputes', 'How are rental disputes mediated?', 'Renter', ['Trust & Safety', 'Marketplace']],
  ['reviews and feedback', 'How can I leave a review or send feedback?', 'Renter', ['Core', 'Marketplace']],
  ['safety', 'What safety guidance should renters follow?', 'Renter', ['Trust & Safety', 'Security']],
  ['privacy', 'How can I request correction of personal data?', 'Renter', ['Privacy']],
  ['policies', 'Which legal terms and policies govern RENTipid?', 'Guest', ['Legal', 'Privacy']],
  ['help and support', 'Where can I get help using RENTipid?', 'Renter', ['Core']],
  ['notifications', 'How can I turn email notifications on or off?', 'Renter', ['Core', 'Profile']],
] as const;

function customerSources() {
  return getSynchronizableKnowledgeRegistry().filter(entry =>
    CUSTOMER_ROLES.some(role => entry.roles.includes(role)));
}

function answerFor(question: string, retrieval: Awaited<ReturnType<typeof retrieveApprovedKnowledgeEvidence>>) {
  return composeGroundedAnswer({
    question,
    effectiveQuestion: retrieval.classification.effectiveQuestion,
    classification: retrieval.classification.kind,
    evidence: retrieval.matches,
  });
}

describe('autonomous grounded knowledge remediation', () => {
  test('all customer-answerable canonical sources are dynamically accounted for by their registered domain', async () => {
    const registrySources = customerSources();
    expect(registrySources).toHaveLength(27);
    expect(registrySources.every(entry => MODULE_EVALUATIONS[entry.module])).toBe(true);

    const activeSources = await prisma.aiKnowledgeSource.findMany({
      where: { sourceKey: { in: registrySources.map(entry => entry.sourceKey) }, status: 'ACTIVE', approvalStatus: 'APPROVED' },
      select: { sourceKey: true, visibility: true, roles: true, applicableRoles: true },
    });
    expect(new Set(activeSources.map(source => source.sourceKey)).size).toBe(registrySources.length);
    for (const entry of registrySources) {
      const stored = activeSources.find(source => source.sourceKey === entry.sourceKey);
      expect(stored).toBeDefined();
      expect(CUSTOMER_ROLES.some(role => canAccessKnowledge(stored!.visibility, entry.roles, role))).toBe(true);
    }
  });

  test.each(Object.entries(MODULE_EVALUATIONS))('%s customer domain retrieves approved evidence', async (module, evaluation) => {
    const retrieval = await retrieveApprovedKnowledgeEvidence(evaluation.question, evaluation.role);
    expect(retrieval.classification.kind).toBe('STATIC_RENTIPID_KNOWLEDGE');
    expect(retrieval.matches.length).toBeGreaterThan(0);
    expect(retrieval.matches.some(match => match.module === module)).toBe(true);
    expect(retrieval.matches.every(match => match.attempt <= 2)).toBe(true);
  });

  test.each(WORKFLOW_EVALUATIONS)('%s is retrievable and produces a grounded customer answer', async (_workflow, question, role, expectedModules) => {
    const retrieval = await retrieveApprovedKnowledgeEvidence(question, role);
    expect(retrieval.matches.length).toBeGreaterThan(0);
    expect(retrieval.matches.some(match => expectedModules.includes(match.module as never))).toBe(true);
    expect(retrieval.matches[0].sourceKey).not.toMatch(/(?:contract-policy|finance-reconciliation|incident-rca)/);

    const answer = answerFor(question, retrieval);
    expect(answer.safelyUncertain).toBe(false);
    expect(answer.materialClaims.length).toBeGreaterThan(0);
    expect(answer.materialClaims.every(claim => claim.evidenceRefs.length > 0)).toBe(true);
    expect(answer.message).not.toMatch(/\[[^\]]+\s*>|source key|chunk|registry|database|mock|provider mode/i);
    expect(answer.message.length).toBeLessThan(900);
  });

  test.each([
    'How do I list an item?',
    'How do I create a listing?',
    'How can I put something up for rent?',
    'I want to offer my equipment.',
    'Where do I add a rental?',
  ])('listing paraphrase recovers relevant approved evidence: %s', async question => {
    const retrieval = await retrieveApprovedKnowledgeEvidence(question, 'Business Provider');
    expect(retrieval.matches.length).toBeGreaterThan(0);
    expect(retrieval.matches.some(match => ['Core', 'Marketplace'].includes(match.module))).toBe(true);
    expect(retrieval.matches[0].module).not.toBe('Legal');
    expect(retrieval.attempts).toBeLessThanOrEqual(2);
    const answer = answerFor(question, retrieval);
    expect(answer.safelyUncertain).toBe(false);
    expect(answer.message).toMatch(/listing|provider|rent/i);
  });

  test('a weak listing paraphrase uses bounded second-pass recovery', async () => {
    const retrieval = await retrieveApprovedKnowledgeEvidence('How can I put something up for rent?', 'Business Provider');
    expect(retrieval.attempts).toBe(2);
    expect(retrieval.matches.some(match => match.attempt === 2)).toBe(true);
  });

  test.each([
    ['How can I register an account?', ['compliance.', 'ai.contract-policy']],
    ['How do I reserve a rental item?', ['ai.finance-reconciliation']],
    ['How can I become a provider?', ['ai.incident-rca']],
    ['How can I get help using RENTipid?', ['ai.contract-policy', 'compliance.']],
  ])('cross-domain contamination is demoted for %s', async (question, forbiddenPrefixes) => {
    const matches = await retrieveApprovedKnowledgeMatches(question, 'Renter');
    expect(matches.length).toBeGreaterThan(0);
    expect(forbiddenPrefixes.some(prefix => matches[0].sourceKey.startsWith(prefix))).toBe(false);
  });

  test('a genuine legal question still retrieves legal customer knowledge', async () => {
    const matches = await retrieveApprovedKnowledgeMatches('Which legal jurisdiction and regulations govern RENTipid?', 'Guest');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].module).toBe('Legal');
  });

  test('renter and provider roles cannot retrieve restricted operational knowledge', async () => {
    for (const role of ['Renter', 'Business Provider']) {
      const matches = await retrieveApprovedKnowledgeMatches('internal deployment repository evidence and incident operations', role);
      const stored = await prisma.aiKnowledgeSource.findMany({
        where: { sourceKey: { in: matches.map(match => match.sourceKey) }, status: 'ACTIVE' },
        select: { visibility: true, roles: true, applicableRoles: true },
      });
      expect(stored.every(source => source.visibility !== 'SYSTEM_ONLY' && source.visibility !== 'SUPER_ADMIN_ONLY')).toBe(true);
    }
  });

  test('multi-turn provider follow-up retrieves documents but does not invent an approval timeline', async () => {
    const context: ConversationContextMessage[] = [
      { role: 'user', content: 'How do I become a provider?' },
      { role: 'assistant', content: 'Complete the approved provider onboarding process.' },
    ];
    const documentRetrieval = await retrieveApprovedKnowledgeEvidence('What documents do I need?', 'Business Provider', context);
    expect(documentRetrieval.classification.usedConversationContext).toBe(true);
    expect(documentRetrieval.matches.some(match => /document|verification/i.test(match.content))).toBe(true);
    expect(answerFor('What documents do I need?', documentRetrieval).safelyUncertain).toBe(false);

    const durationRetrieval = await retrieveApprovedKnowledgeEvidence('How long does it take?', 'Business Provider', context);
    expect(durationRetrieval.classification.usedConversationContext).toBe(true);
    const durationAnswer = answerFor('How long does it take?', durationRetrieval);
    expect(durationAnswer.safelyUncertain).toBe(true);
    expect(durationAnswer.message).toContain("don't have an approved RENTipid timeline");
  });

  test.each([
    ['How do refunds work?', 'STATIC_RENTIPID_KNOWLEDGE'],
    ['Has my refund been paid?', 'LIVE_RENTIPID_STATE'],
    ['How does KYC work?', 'STATIC_RENTIPID_KNOWLEDGE'],
    ['Is my KYC approved?', 'LIVE_RENTIPID_STATE'],
    ['How does booking work?', 'STATIC_RENTIPID_KNOWLEDGE'],
    ['What is my booking status?', 'LIVE_RENTIPID_STATE'],
  ])('static/live authority is separated: %s', async (question, expectedClass) => {
    const classification = classifyRentipidQuestion(question);
    expect(classification.kind).toBe(expectedClass);
    const retrieval = await retrieveApprovedKnowledgeEvidence(question, 'Renter');
    if (expectedClass === 'LIVE_RENTIPID_STATE') {
      expect(retrieval.matches).toEqual([]);
      expect(retrieval.attempts).toBe(0);
    } else {
      expect(retrieval.matches.length).toBeGreaterThan(0);
    }
  });

  test('unsupported and external questions do not gain factual evidence', async () => {
    for (const question of ['Which RENTipid items predict earthquakes?', 'How do I bake sourdough bread?']) {
      const retrieval = await retrieveApprovedKnowledgeEvidence(question, 'Renter');
      expect(retrieval.matches).toEqual([]);
      expect(answerFor(question, retrieval).safelyUncertain).toBe(true);
    }
  });
});
