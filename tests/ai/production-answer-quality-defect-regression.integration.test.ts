import { processAICommand } from '@/lib/ai/ai-command-layer';
import { resolveCanonicalIntent } from '@/lib/ai/context/canonical-intent-resolver';
import { seedCanonicalIntents } from '@/lib/ai/context/canonical-intent-registry';
import { BOTS } from '@/lib/ai/ai-permissions';

/**
 * Regression tests for two owner-reported production defects:
 *
 * Defect 1: "How do I create a listing on RENTipid?" was returning content
 *   from the Booking Process section instead of the Listings section.
 *   Root cause: knowledgeSectionKey was missing from listing.create.how_to
 *   access scopes, so ALL chunks from provider.workflow-status were returned
 *   as bound evidence, and the first ordinal chunk (Booking Process)
 *   contaminated the answer.
 *
 * Defect 2: "What items are prohibited on RENTipid?" was returning a generic
 *   description instead of the enumerated policy list.
 *   Root cause: The canonical question "What items are prohibited or restricted
 *   on RENTipid?" did not match the user's phrasing (without "or restricted")
 *   and no alias covered the variation, so the POLICY_TAXONOMY authority was
 *   never invoked.
 */
describe('production answer-quality defect regression', () => {
  beforeAll(async () => {
    await seedCanonicalIntents();
  });

  // ====================================================================
  // DEFECT 1: Listing creation must NOT return Booking Process content
  // ====================================================================

  test('Defect 1: "How do I create a listing on RENTipid?" resolves to listing section, not booking', async () => {
    const canonical = await resolveCanonicalIntent('How do I create a listing on RENTipid?', 'Individual Provider');

    // Must resolve to listing.create.how_to
    expect(canonical).not.toBeNull();
    expect(canonical?.intentKey).toBe('listing.create.how_to');
    expect(canonical?.selectedScope.authorityType).toBe('KNOWLEDGE_CENTER');
    expect(canonical?.selectedScope.knowledgeSourceKey).toBe('provider.workflow-status');

    // Critical: the section key must scope evidence to listings only
    expect(canonical?.selectedScope.knowledgeSectionKey).toBe(
      'provider-workflow-status:workflow-status-guidance-listings',
    );
  });

  test('Defect 1: listing creation answer must mention listing content, not booking process', async () => {
    const response = await processAICommand({
      botId: BOTS.CONCIERGE,
      prompt: 'How do I create a listing on RENTipid?',
      module: 'Help',
      userRole: 'Individual Provider',
    });

    expect(response.success).toBe(true);
    // The answer must NOT start with "Booking Process" contamination
    expect(response.message).not.toMatch(/booking process/i);
    // Must not contain the naive fallback header from LocalGroundedComposerProvider
    // when followed by booking content
    expect(response.message).not.toMatch(/Here is the RENTipid information[\s\S]*Booking Process/i);
  });

  test('Defect 1: section key scoping also works for Business Provider role', async () => {
    const canonical = await resolveCanonicalIntent('How do I create a listing on RENTipid?', 'Business Provider');

    expect(canonical?.intentKey).toBe('listing.create.how_to');
    expect(canonical?.selectedScope.knowledgeSectionKey).toBe(
      'provider-workflow-status:workflow-status-guidance-listings',
    );
  });

  // ====================================================================
  // DEFECT 2: Prohibited items must enumerate actual policies
  // ====================================================================

  test('Defect 2: "What items are prohibited on RENTipid?" resolves to policy taxonomy', async () => {
    const canonical = await resolveCanonicalIntent('What items are prohibited on RENTipid?', 'Guest');

    // Must resolve via alias to listing.item.restriction
    expect(canonical).not.toBeNull();
    expect(canonical?.intentKey).toBe('listing.item.restriction');
    expect(canonical?.matchType).toBe('EXACT_ALIAS');
    expect(canonical?.selectedScope.authorityType).toBe('POLICY_TAXONOMY');
    expect(canonical?.selectedScope.authorityReference).toBe('RENTAL_CATEGORY_AND_PROHIBITED_ITEM_POLICY');
  });

  test('Defect 2: prohibited items answer enumerates actual policy categories', async () => {
    const response = await processAICommand({
      botId: BOTS.CONCIERGE,
      prompt: 'What items are prohibited on RENTipid?',
      module: 'Help',
      userRole: 'Guest',
    });

    expect(response.success).toBe(true);
    // Must contain actual prohibited item policy names, not a generic description
    expect(response.message).toMatch(/Illegal Drugs/i);
    expect(response.message).toMatch(/Firearms/i);
    expect(response.message).toMatch(/prohibited|restricted/i);
    // Must NOT be the generic "not sufficient" fallback
    expect(response.message).not.toMatch(/not sufficient to answer|could you be more specific/i);
    // Must NOT be the "cannot confirm" fallback
    expect(response.message).not.toMatch(/cannot confirm/i);

    // Evidence refs must come from the policy authority
    expect(response.grounding?.evidenceRefs.length).toBeGreaterThan(0);
    expect(response.grounding?.evidenceRefs.every(ref => ref.startsWith('policy:'))).toBe(true);
  });

  test('Defect 2: "What items are restricted on RENTipid?" also resolves via alias', async () => {
    const canonical = await resolveCanonicalIntent('What items are restricted on RENTipid?', 'Guest');

    expect(canonical).not.toBeNull();
    expect(canonical?.intentKey).toBe('listing.item.restriction');
    expect(canonical?.selectedScope.authorityType).toBe('POLICY_TAXONOMY');
  });

  test('Defect 2: "Are there banned items on RENTipid?" also resolves via alias', async () => {
    const canonical = await resolveCanonicalIntent('Are there banned items on RENTipid?', 'Guest');

    expect(canonical).not.toBeNull();
    expect(canonical?.intentKey).toBe('listing.item.restriction');
  });
});
