jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(async () => null),
}));

import { processAICommand } from '@/lib/ai/ai-command-layer';
import { resolveCanonicalIntent } from '@/lib/ai/context/canonical-intent-resolver';
import { seedCanonicalIntents } from '@/lib/ai/context/canonical-intent-registry';
import { BOTS } from '@/lib/ai/ai-permissions';
import { CANONICAL_CUSTOMER_OBJECTIVES } from '@/lib/ai/context/customer-objective-catalog';
import { POST } from '@/app/api/ai/chat/route';

function expectContractPass(res: Awaited<ReturnType<typeof processAICommand>>) {
  expect(res.grounding?.contractVerified).toBe(true);
  expect(res.grounding?.contractMissingRequiredFacts).toEqual([]);
  expect(res.grounding?.contractForbiddenClaims).toEqual([]);
  expect(res.grounding?.verifierPassed).toBe(true);
}

describe('Live /help Common Runtime Parity & Owner-OAT Remediation Integration Tests', () => {
  beforeAll(async () => {
    await seedCanonicalIntents();
  });

  describe('5 Owner-OAT Target Questions through processAICommand()', () => {
    it('1. Renter Payment Methods: returns approved payment methods with mock payments environment disclosure', async () => {
      const prompt = 'how can i pay for rented item?';
      const canonical = await resolveCanonicalIntent(prompt, 'Renter');
      expect(canonical?.intentKey).toBe('renter.payment.methods');

      const res = await processAICommand({
        botId: BOTS.CONCIERGE,
        prompt,
        module: 'Help',
        userRole: 'Renter',
      });

      expect(res.success).toBe(true);
      expect(res.isBlocked).toBeFalsy();
      expect(res.grounding?.canonicalIntentKey).toBe('renter.payment.methods');
      expect(res.message).toMatch(/GCash/i);
      expect(res.message).toMatch(/Maya/i);
      expect(res.message).toMatch(/PayMongo/i);
      expect(res.message).toMatch(/Private Beta|Mock Payments/i);
      expect(res.message).not.toContain('RENTipid Terms and Conditions');
      expectContractPass(res);
    });

    it('2. Booking Cancellation: returns procedural steps, policy rules, and in-app confirmation boundary', async () => {
      const prompt = 'how can i cancel rental booking?';
      const canonical = await resolveCanonicalIntent(prompt, 'Renter');
      expect(canonical?.intentKey).toBe('booking.cancel.process');

      const res = await processAICommand({
        botId: BOTS.CONCIERGE,
        prompt,
        module: 'Help',
        userRole: 'Renter',
      });

      expect(res.success).toBe(true);
      expect(res.grounding?.canonicalIntentKey).toBe('booking.cancel.process');
      expect(res.message).toMatch(/Dashboard > Bookings/i);
      expect(res.message).toMatch(/cancellation policy/i);
      expect(res.message).toMatch(/100% full refund/i);
      expectContractPass(res);
    });

    it('3. Rental Damage: returns damage reporting, inspection window, deposit escrow deduction, and platform protection', async () => {
      const prompt = 'What happens if the item rented is damaged?';
      const canonical = await resolveCanonicalIntent(prompt, 'Renter');
      expect(canonical?.intentKey).toBe('rental.damage.general');

      const res = await processAICommand({
        botId: BOTS.CONCIERGE,
        prompt,
        module: 'Help',
        userRole: 'Renter',
      });

      expect(res.success).toBe(true);
      expect(res.grounding?.canonicalIntentKey).toBe('rental.damage.general');
      expect(res.message).toMatch(/inspection window/i);
      expect(res.message).toMatch(/security deposit/i);
      expect(res.message).toMatch(/platform rental protection/i);
      expect(res.message).toMatch(/File Claim/i);
      expectContractPass(res);
    });

    it('4. Renter Refund Request: returns procedural refund workflows and 3-7 business day timeline', async () => {
      const prompt = 'How can I request for refund?';
      const canonical = await resolveCanonicalIntent(prompt, 'Renter');
      expect(canonical?.intentKey).toBe('renter.refund.request_how_to');

      const res = await processAICommand({
        botId: BOTS.CONCIERGE,
        prompt,
        module: 'Help',
        userRole: 'Renter',
      });

      expect(res.success).toBe(true);
      expect(res.grounding?.canonicalIntentKey).toBe('renter.refund.request_how_to');
      expect(res.message).toMatch(/Cancel Booking/i);
      expect(res.message).toMatch(/3–7 business days|3-7 business days/i);
      expect(res.message).toMatch(/original payment method/i);
      expectContractPass(res);
    });

    it('5. Provider Profile Privacy: distinguishes public identity from private financial credentials & in-app checkout', async () => {
      const prompt = 'May I know the account of provider when I rent his property?';
      const canonical = await resolveCanonicalIntent(prompt, 'Renter');
      expect(canonical?.intentKey).toBe('provider.profile.public_vs_private');

      const res = await processAICommand({
        botId: BOTS.CONCIERGE,
        prompt,
        module: 'Help',
        userRole: 'Renter',
      });

      expect(res.success).toBe(true);
      expect(res.grounding?.canonicalIntentKey).toBe('provider.profile.public_vs_private');
      expect(res.message).toMatch(/public profile|display name|ratings|reviews/i);
      expect(res.message).toMatch(/bank accounts|strictly confidential|never shared/i);
      expect(res.message).toMatch(/secure platform checkout|never pay into a provider's personal bank account/i);
      expectContractPass(res);
    });
  });

  describe('Unseen Natural Language and Taglish Variants', () => {
    it('handles Taglish payment query without category false positive', async () => {
      const res = await processAICommand({
        botId: BOTS.CONCIERGE,
        prompt: 'pwede ba gcash pambayad sa rent?',
        module: 'Help',
        userRole: 'Renter',
      });
      expect(res.success).toBe(true);
      expect(res.grounding?.canonicalIntentKey).toBe('renter.payment.methods');
      expect(res.message).toMatch(/GCash/i);
      expectContractPass(res);
    });

    it('handles Taglish damage query', async () => {
      const res = await processAICommand({
        botId: BOTS.CONCIERGE,
        prompt: 'paano kung masira ko yung hiniram kong gamit?',
        module: 'Help',
        userRole: 'Renter',
      });
      expect(res.success).toBe(true);
      expect(res.grounding?.canonicalIntentKey).toBe('rental.damage.general');
      expect(res.message).toMatch(/inspection|photos|deposit|protection/i);
      expectContractPass(res);
    });

    it('handles Taglish provider privacy query', async () => {
      const res = await processAICommand({
        botId: BOTS.CONCIERGE,
        prompt: 'makikita ko ba ang bank account ng may-ari ng gamit?',
        module: 'Help',
        userRole: 'Renter',
      });
      expect(res.success).toBe(true);
      expect(res.grounding?.canonicalIntentKey).toBe('provider.profile.public_vs_private');
      expect(res.message).toMatch(/confidential|checkout|public profile/i);
      expectContractPass(res);
    });
  });

  describe('Systemic runtime and authority controls', () => {
    it('does not use any Owner-OAT sentence as a production alias', async () => {
      const ownerQuestions = [
        'how can i pay for rented item?',
        'how can i request for refund?',
        'what happens if the item rented is damaged?',
        'may i know the account of provider when i rent his property?',
        'how can i cancel rental booking?',
      ];
      const aliases = CANONICAL_CUSTOMER_OBJECTIVES
        .flatMap(objective => objective.aliases)
        .map(alias => alias.text.toLowerCase());
      for (const question of ownerQuestions) {
        expect(aliases).not.toContain(question);
        const match = await resolveCanonicalIntent(question, 'Guest');
        expect(match?.matchType).toBe('NORMALIZED_MATCH');
      }
    });

    it.each([
      ['Refund status for canceled reservation', 'renter.refund.status', /refund|Payments & Refunds/i],
      ['How do providers receive their rental earnings?', 'provider.payout.schedule', /payout|earnings/i],
      ['Does platform rental protection cover accidental damage?', 'insurance.coverage.scope', /protection|accidental damage/i],
      ['Ano ang mga bawal na item?', 'listing.item.restriction', /Illegal Drugs|Firearms/i],
      ['List of prohibited items on rentipid marketplace', 'listing.item.restriction', /Illegal Drugs|Firearms/i],
      ['Is it allowed to rent out illegal-drugs?', 'listing.item.restriction', /Illegal Drugs|Controlled Substances/i],
      ['refund pls how request', 'renter.refund.request_how_to', /Cancel Booking|Report Issue/i],
    ])('routes unseen supported query %s through its contract', async (prompt, objectiveId, answerPattern) => {
      const res = await processAICommand({
        botId: BOTS.CONCIERGE,
        prompt,
        module: 'Help',
        userRole: 'Guest',
      });
      expect(res.success).toBe(true);
      expect(res.grounding?.canonicalIntentKey).toBe(objectiveId);
      expect(res.message).toMatch(answerPattern as RegExp);
      expectContractPass(res);
    });

    it('uses conversation context to resolve a follow-up through the canonical objective', async () => {
      const res = await processAICommand({
        botId: BOTS.CONCIERGE,
        prompt: 'What does it cover?',
        module: 'Help',
        userRole: 'Renter',
        conversationContext: [
          { role: 'user', content: 'Does this rental have platform protection?' },
          { role: 'assistant', content: 'RENTipid provides platform rental protection.' },
        ],
      });
      expect(res.grounding?.canonicalIntentKey).toBe('insurance.coverage.scope');
      expect(res.grounding?.usedConversationContext).toBe(true);
      expectContractPass(res);
    });

    it('answers independently governed objectives in one multi-intent request', async () => {
      const res = await processAICommand({
        botId: BOTS.CONCIERGE,
        prompt: 'How can I pay with GCash and when is the security deposit refunded?',
        module: 'Help',
        userRole: 'Renter',
      });
      expect(res.success).toBe(true);
      expect(res.grounding?.canonicalIntentKey).toContain('renter.payment.methods');
      expect(res.grounding?.canonicalIntentKey).toContain('renter.deposit.release');
      expect(res.message).toMatch(/GCash/i);
      expect(res.message).toMatch(/security deposit/i);
      expectContractPass(res);
    });

    it('clarifies ambiguous funds rather than substituting a refund or payout answer', async () => {
      const res = await processAICommand({
        botId: BOTS.CONCIERGE,
        prompt: 'Where is my money?',
        module: 'Help',
        userRole: 'Guest',
      });
      expect(res.grounding?.canonicalIntentKey).toBe('query.clarification.ambiguous_funds');
      expect(res.message).toMatch(/security deposit|booking refund|payout/i);
      expectContractPass(res);
    });

    it('does not downgrade an explicit cancellation action into informational guidance', async () => {
      const res = await processAICommand({
        botId: BOTS.CONCIERGE,
        prompt: 'Cancel my booking 123 now',
        module: 'Help',
        userRole: 'Guest',
      });
      expect(res.success).toBe(false);
      expect(res.isBlocked).toBe(true);
      expect(res.trace?.answerClass).toBe('ACTION');
    });

    it('exercises the same guest API route used by /help', async () => {
      const response = await POST(new Request('http://localhost/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          botId: BOTS.CONCIERGE,
          prompt: 'Which payment options are available for a rental?',
          module: 'Help',
        }),
      }));
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        isBlocked: false,
        conversationId: null,
      });
    });
  });
});
