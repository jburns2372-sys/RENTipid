import { processAICommand } from '@/lib/ai/ai-command-layer';
import { resolveCanonicalIntent } from '@/lib/ai/context/canonical-intent-resolver';
import { seedCanonicalIntents } from '@/lib/ai/context/canonical-intent-registry';
import { BOTS } from '@/lib/ai/ai-permissions';

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
    });
  });
});
