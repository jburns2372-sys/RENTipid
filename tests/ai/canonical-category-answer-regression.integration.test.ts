import { processAICommand } from '@/lib/ai/ai-command-layer';
import { resolveCanonicalIntent } from '@/lib/ai/context/canonical-intent-resolver';
import { seedCanonicalIntents } from '@/lib/ai/context/canonical-intent-registry';
import { classifyRentipidQuestion } from '@/lib/ai/context/question-classifier';
import { BOTS } from '@/lib/ai/ai-permissions';

describe('canonical category answer regression', () => {
  beforeAll(async () => {
    await seedCanonicalIntents();
  });

  test.each([
    ['Can I list a condominium on RENTipid?', 'Super Admin', 'condominium'],
    ['Can I list condo property?', 'Business Provider', 'condo'],
    ['can i list condominium on rentipid', 'Individual Provider', 'condominium'],
  ])('returns a verified taxonomy answer for %s', async (question, role, expectedEntity) => {
    const classification = classifyRentipidQuestion(question);
    const canonical = await resolveCanonicalIntent(question, role);
    const response = await processAICommand({
      botId: BOTS.CONCIERGE,
      prompt: question,
      module: 'Help',
      userRole: role,
    });

    expect(classification).toMatchObject({
      kind: 'STATIC_RENTIPID_KNOWLEDGE',
      intent: 'CATEGORY_ELIGIBILITY',
      requestedCategoryTerms: [expectedEntity],
    });
    expect(canonical).toMatchObject({
      intentKey: 'category.listing.eligibility',
      selectedScope: {
        answerClass: 'ELIGIBILITY_POLICY',
        authorityType: 'POLICY_TAXONOMY',
      },
    });
    expect(response.success).toBe(true);
    expect(response.grounding).toMatchObject({
      intent: 'CATEGORY_ELIGIBILITY',
      verifierPassed: true,
      safelyUncertain: false,
    });
    expect(response.grounding?.evidenceRefs.length).toBeGreaterThan(0);
    expect(response.grounding?.evidenceRefs.every(ref => ref.startsWith('policy:'))).toBe(true);
    expect(response.message).toMatch(/condominiums? is a supported rentipid rental category/i);
    expect(response.message).toMatch(/admin approval|permit documentation/i);
    expect(response.message).not.toMatch(/not sufficient to answer|could you be more specific/i);
  });

  test('keeps a sibling taxonomy question grounded', async () => {
    const response = await processAICommand({
      botId: BOTS.CONCIERGE,
      prompt: 'Can I list cars for rent?',
      module: 'Help',
      userRole: 'Individual Provider',
    });

    expect(response.grounding).toMatchObject({
      intent: 'CATEGORY_ELIGIBILITY',
      verifierPassed: true,
      safelyUncertain: false,
    });
    expect(response.message).toMatch(/cars(?:: supported| and motorcycles is a supported rentipid rental category)/i);
  });

  test('keeps unsupported external questions safely uncertain', async () => {
    const response = await processAICommand({
      botId: BOTS.CONCIERGE,
      prompt: 'How do I bake sourdough bread?',
      module: 'Help',
      userRole: 'Guest',
    });

    expect(response.grounding?.safelyUncertain).toBe(true);
    expect(response.message).toMatch(/ask me a rentipid question/i);
  });
});
