import { retrieveApprovedKnowledgeEvidence, retrieveApprovedKnowledgeMatches } from './knowledge-retrieval';
import { prisma } from '@/lib/prisma';
import { retrieveApprovedKnowledge } from './knowledge-retrieval';
import { processMockAIRequest } from '@/lib/ai/mock-ai';
import { canAccessKnowledge, parseStoredRoles } from '@/lib/ai/knowledge/visibility';

describe('General Knowledge Retrieval Quality (Audited)', () => {
  describe('Representative Semantic Retrieval', () => {
    it('retrieves registration/onboarding domain correctly', async () => {
      const queries = ['How to register?', 'Sign up for a new account', 'Join the platform'];
      for (const query of queries) {
        const matches = await retrieveApprovedKnowledgeMatches(query, undefined);
        expect(matches.length).toBeGreaterThan(0);
        expect(matches[0].sourceKey).toBe('core.registration-onboarding');
      }
    });

    it('retrieves legal/compliance domain correctly for genuine legal queries', async () => {
      const queries = ['What laws govern RENTipid?', 'Compliance regulations', 'Legal jurisdiction for the platform'];
      for (const query of queries) {
        const matches = await retrieveApprovedKnowledgeMatches(query, undefined);
        expect(matches.length).toBeGreaterThan(0);
        expect(['compliance.global-legal-register', 'route.terms', 'route.privacy']).toContain(matches[0].sourceKey);
      }
    });

    it('retrieves usage/marketplace domains correctly', async () => {
      const queries = [
        ['How do I create a listing?', 'Business Provider'],
        ['How to rent an item?', 'Renter'],
        ['Checkout process for items', 'Renter'],
      ];
      for (const [query, role] of queries) {
        const matches = await retrieveApprovedKnowledgeMatches(query, role);
        expect(matches.length).toBeGreaterThan(0);
        if (['compliance.global-legal-register', 'core.registration-onboarding'].includes(matches[0].sourceKey)) {
          throw new Error(`Unexpected marketplace result for ${query}: ${matches[0].sourceKey}`);
        }
      }
    });
  });

  describe('Cross-Domain Negative Tests', () => {
    it('ensures broad terms do not hijack queries to irrelevant compliance/legal documents', async () => {
      const queries = ['My account registration is stuck', 'Renter provider transaction dispute', 'How to book an item on the platform'];
      for (const query of queries) {
        const matches = await retrieveApprovedKnowledgeMatches(query, undefined);
        if (matches.length > 0) {
          expect(['compliance.global-legal-register']).not.toContain(matches[0].sourceKey);
        }
      }
    });

    it('ensures restricted documents (SYSTEM_ONLY) are not retrieved for unauthenticated/regular users', async () => {
      // Try to fetch registry.repository-evidence (SYSTEM_ONLY) using matching keywords
      const matches = await retrieveApprovedKnowledgeMatches('repository evidence registry details', undefined);
      if (matches.length > 0) {
        expect(matches[0].sourceKey).not.toBe('registry.repository-evidence');
      }
    });
  });

  describe('Safe Uncertainty & Live-State Separation', () => {
    it('returns empty for fully unrelated queries (safe uncertainty)', async () => {
      const matches = await retrieveApprovedKnowledgeMatches('How to bake a chocolate cake', undefined);
      // We expect low coverage and score, thus returning empty
      expect(matches.length).toBe(0);
    });

    it('returns empty for queries containing live-state signals (isStaticKnowledgeQuery guard)', async () => {
      const queries = [
        'What is my booking status?',
        'My payment for booking #12345 failed',
        'Check my KYC status please'
      ];
      for (const query of queries) {
        const matches = await retrieveApprovedKnowledgeMatches(query, undefined);
        expect(matches.length).toBe(0);
      }
    });
  });
});

describe('Final pre-deploy semantic knowledge audit', () => {
  test.each([
    ['registration', 'Where can a newcomer open a RENTipid account?', 'Guest', ['core.registration-onboarding']],
    ['registration paraphrase', 'I would like to join the platform as a new user', 'Guest', ['core.registration-onboarding']],
    ['provider onboarding', 'What steps let me become a rental provider?', 'Business Provider', ['core.registration-onboarding', 'core.user-manual', 'marketplace.']],
    ['renter usage', 'How does a renter use RENTipid?', 'Renter', ['core.user-manual', 'core.executive-overview', 'marketplace.']],
    ['listings', 'How can a provider create a rental listing?', 'Business Provider', ['marketplace.', 'provider.marketplace-taxonomy', 'provider.workflow-status', 'core.user-manual']],
    ['booking', 'How does the item booking process work?', 'Renter', ['provider.workflow-status', 'core.', 'marketplace.']],
    ['payments', 'How do deposits and refunds work?', 'Renter', ['provider.payment-status-currency', 'provider.workflow-status', 'core.', 'marketplace.']],
    ['profile', 'How can I update profile information?', 'Renter', ['profile.', 'core.user-manual', 'core.registration-onboarding', 'route.privacy']],
    ['help', 'Where can a renter find help using the app?', 'Renter', ['core.user-manual', 'marketplace.', 'ai.', 'route.']],
    ['safety', 'What safety guidance should renters follow?', 'Renter', ['route.safety', 'route.terms', 'core.user-manual', 'provider.ai-policy']],
    ['privacy', 'How can I request correction of personal data?', 'Renter', ['privacy.', 'route.privacy', 'core.registration-onboarding', 'provider.privacy-policy-retention']],
    ['legal', 'Which laws and jurisdictions govern RENTipid?', 'Guest', ['compliance.', 'route.terms', 'route.privacy']],
    ['mediation', 'How are rental disputes mediated?', 'Renter', ['marketplace.', 'provider.workflow-status', 'core.user-manual', 'ai.', 'route.terms']],
    ['identity verification', 'Why is identity verification required?', 'Renter', ['route.safety', 'provider.ai-policy', 'core.registration-onboarding']],
  ])('%s retrieves an approved relevant grounding set', async (_domain, query, role, expectedPrefixes) => {
    const matches = await retrieveApprovedKnowledgeMatches(query, role);
    if (matches.length === 0) throw new Error(`No match for ${_domain}: ${query}`);
    if (!matches.some(match => expectedPrefixes.some(prefix => match.sourceKey.startsWith(prefix)))) {
      throw new Error(`No relevant grounding match for ${_domain}: ${matches.map(match => match.sourceKey).join(', ')}`);
    }
    const sources = await prisma.aiKnowledgeSource.findMany({
      where: { sourceKey: { in: matches.map(match => match.sourceKey) }, status: 'ACTIVE' },
      select: { sourceKey: true, status: true, approvalStatus: true, visibility: true, roles: true, applicableRoles: true },
    });
    expect(sources).toHaveLength(new Set(matches.map(match => match.sourceKey)).size);
    for (const source of sources) {
      expect(source.status).toBe('ACTIVE');
      expect(source.approvalStatus).toBe('APPROVED');
      expect(canAccessKnowledge(source.visibility, parseStoredRoles(source.roles, source.applicableRoles), role)).toBe(true);
    }
  });

  test.each([
    ['What authority does RENTipid AI policy allow?', 'Renter'],
    ['How are rental insurance claims handled?', 'Renter'],
  ])('internal-only authority material does not become customer evidence: %s', async (query, role) => {
    const matches = await retrieveApprovedKnowledgeMatches(query, role);
    expect(matches.every(match => ![
      'provider.ai-policy',
      'provider.insurance-config-catalog',
      'insurance.full-documentation',
      'insurance.privacy-data-flow',
    ].includes(match.sourceKey))).toBe(true);
  });

  test.each([
    ['registration is not legal', 'How can I register an account?', ['compliance.', 'ai.contract-policy']],
    ['booking is not finance reconciliation', 'How do I reserve a rental item?', ['ai.finance-reconciliation']],
    ['provider onboarding is not incident RCA', 'How can I become a provider?', ['ai.incident-rca']],
    ['normal help is not internal contract policy', 'How can I get help using RENTipid?', ['ai.contract-policy', 'compliance.']],
  ])('%s', async (_label, query, forbiddenPrefixes) => {
    const matches = await retrieveApprovedKnowledgeMatches(query, 'Renter');
    expect(matches.length).toBeGreaterThan(0);
    expect(forbiddenPrefixes.some(prefix => matches[0].sourceKey.startsWith(prefix))).toBe(false);
  });

  test('a genuine legal query still selects legal or customer terms knowledge', async () => {
    const matches = await retrieveApprovedKnowledgeMatches('What legal jurisdiction and regulations govern RENTipid?', 'Guest');
    expect(matches.length).toBeGreaterThan(0);
    expect(['compliance.', 'route.terms', 'route.privacy'].some(prefix => matches[0].sourceKey.startsWith(prefix))).toBe(true);
  });

  test('lower roles cannot retrieve Super Admin or system-only operational knowledge', async () => {
    for (const role of ['Guest', 'Renter', 'Business Provider']) {
      const matches = await retrieveApprovedKnowledgeMatches('internal deployment repository evidence and operations registry', role);
      const sources = await prisma.aiKnowledgeSource.findMany({
        where: { sourceKey: { in: matches.map(match => match.sourceKey) } },
        select: { visibility: true, roles: true, applicableRoles: true },
      });
      expect(sources.every(source => source.visibility !== 'SYSTEM_ONLY' && source.visibility !== 'SUPER_ADMIN_ONLY')).toBe(true);
      expect(sources.every(source => canAccessKnowledge(
        source.visibility,
        parseStoredRoles(source.roles, source.applicableRoles),
        role,
      ))).toBe(true);
    }
  });

  test.each([
    'How do I bake sourdough bread?',
    'Which RENTipid items predict earthquakes?',
  ])('unsupported question returns no irrelevant confident grounding: %s', async query => {
    const matches = await retrieveApprovedKnowledgeMatches(query, 'Renter');
    expect(matches).toEqual([]);
  });

  test.each([
    'Does RENTipid guarantee every claim is approved?',
    'Can RENTipid promise an instant payout every time?',
  ])('unsupported guarantee is either uncertain or grounded in an explicit limitation: %s', async query => {
    const matches = await retrieveApprovedKnowledgeMatches(query, 'Renter');
    if (matches.length > 0) {
      expect(matches.every(match => /\b(?:no|not|cannot|does not|must not|never)\b/i.test(match.content))).toBe(true);
    }
  });

  test.each([
    'What is my booking status?',
    'Has my payment completed?',
    'What is my current KYC result?',
    'Where is my payout?',
    'Has my refund been processed?',
    'What is the current state of transaction TX-123?',
  ])('live state never uses static knowledge: %s', async query => {
    expect(await retrieveApprovedKnowledgeMatches(query, 'Renter')).toEqual([]);
  });

  test('answer text is a bounded rendering of approved retrieval with no mock label or invented fact', async () => {
    const query = 'Where can a newcomer open a RENTipid account?';
    const retrieval = await retrieveApprovedKnowledgeEvidence(query, 'Guest');
    expect(retrieval.matches.length).toBeGreaterThan(0);
    const answer = await processMockAIRequest(
      'RENTipid Concierge Bot',
      query,
      'Approved Knowledge Context',
      'Use only approved knowledge.',
      {
        question: query,
        effectiveQuestion: retrieval.classification.effectiveQuestion,
        classification: retrieval.classification.kind,
        evidence: retrieval.matches,
      },
    );
    expect(answer.message).toMatch(/register|account/i);
    expect(answer.evidenceRefs.length).toBeGreaterThan(0);
    expect(answer.materialClaims.every(claim => claim.evidenceRefs.length > 0)).toBe(true);
    expect(answer.message).not.toContain('[Mock AI Mode]');
    expect(answer.message).not.toMatch(/source key|chunk id|registry/i);
  });

  test.each([
    'Explain my current account state',
    'Summarize my pending items',
    'What document is missing?',
    'What should I do next?',
  ])('deterministic fallback does not expose mock state or invent live facts: %s', async query => {
    const answer = await processMockAIRequest(
      'RENTipid Concierge Bot',
      query,
      '',
      'Use only approved knowledge.',
      {
        question: query,
        effectiveQuestion: query,
        classification: 'LIVE_RENTIPID_STATE',
        evidence: [],
      },
    );
    expect(answer.safelyUncertain).toBe(true);
    expect(answer.evidenceRefs).toEqual([]);
    expect(answer.message).not.toMatch(/mock|pending items|proof of address/i);
  });
});
