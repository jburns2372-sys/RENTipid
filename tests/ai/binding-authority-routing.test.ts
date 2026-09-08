import { seedCanonicalIntents } from '../../src/lib/ai/context/canonical-intent-registry';
import { resolveCanonicalIntent } from '../../src/lib/ai/context/canonical-intent-resolver';

describe('Binding Authority Routing', () => {
  beforeAll(async () => {
    await seedCanonicalIntents();
  });

  test('routes INFORMATION intent to Knowledge Center', async () => {
    const match = await resolveCanonicalIntent('How do I create a listing on RENTipid?', 'Individual Provider');
    expect(match?.selectedScope.answerClass).toBe('INFORMATION');
    expect(match?.selectedScope.authorityType).toBe('KNOWLEDGE_CENTER');
  });

  test('routes ELIGIBILITY_POLICY intent to Policy Taxonomy', async () => {
    const match = await resolveCanonicalIntent('Can I list a condominium on RENTipid?', 'Guest');
    expect(match?.selectedScope.answerClass).toBe('ELIGIBILITY_POLICY');
    expect(match?.selectedScope.authorityType).toBe('POLICY_TAXONOMY');
  });

  test('routes PERSONALIZED_READ intent to Authorized Live Service', async () => {
    const match = await resolveCanonicalIntent('Where is my payout?', 'Individual Provider');
    expect(match?.selectedScope.answerClass).toBe('PERSONALIZED_READ');
    expect(match?.selectedScope.authorityType).toBe('LIVE_SERVICE');
  });

  test('routes ACTION intent to Tool Gateway', async () => {
    const match = await resolveCanonicalIntent('How do I cancel my booking?', 'Renter');
    expect(match?.selectedScope.answerClass).toBe('ACTION');
    expect(match?.selectedScope.authorityType).toBe('TOOL_GATEWAY');
  });
});
