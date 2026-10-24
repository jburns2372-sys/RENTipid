import {
  seedCanonicalIntents,
  normalizeQuestionText
} from '../../src/lib/ai/context/canonical-intent-registry';
import { resolveCanonicalIntent } from '../../src/lib/ai/context/canonical-intent-resolver';

describe('Canonical Intent Registry & Resolver', () => {
  beforeAll(async () => {
    await seedCanonicalIntents();
  });

  test('normalizes question text deterministically', () => {
    expect(normalizeQuestionText('How do I list an item?')).toBe('how do i list item');
    expect(normalizeQuestionText('  HOW   DO I LIST AN ITEM?! ')).toBe('how do i list item');
    expect(normalizeQuestionText('hw do i lst my car')).toBe('hw do i lst my car');
  });

  test('resolves exact canonical question for authorized role', async () => {
    const match = await resolveCanonicalIntent('How do I create a listing on RENTipid?', 'Individual Provider');
    expect(match).not.toBeNull();
    expect(match?.intentKey).toBe('listing.create.how_to');
    expect(match?.matchType).toBe('EXACT_CANONICAL');
    expect(match?.selectedScope.authorityType).toBe('KNOWLEDGE_CENTER');
  });

  test('resolves exact alias for authorized role', async () => {
    const match = await resolveCanonicalIntent('withdraw my provider money', 'Individual Provider');
    expect(match).not.toBeNull();
    expect(match?.intentKey).toBe('provider.payout.location');
    expect(match?.matchType).toBe('EXACT_ALIAS');
    expect(match?.selectedScope.answerClass).toBe('PERSONALIZED_READ');
    expect(match?.selectedScope.authorityType).toBe('LIVE_SERVICE');
  });

  test('blocks unauthorized role from resolving internal developer intent', async () => {
    const renterMatch = await resolveCanonicalIntent('How do I validate Knowledge Center integrity?', 'Renter');
    expect(renterMatch).toBeNull();

    const adminMatch = await resolveCanonicalIntent('How do I validate Knowledge Center integrity?', 'Super Admin', ['KNOWLEDGE_ADMIN']);
    expect(adminMatch).not.toBeNull();
    expect(adminMatch?.intentKey).toBe('internal.knowledge.validation_process');
  });
});
