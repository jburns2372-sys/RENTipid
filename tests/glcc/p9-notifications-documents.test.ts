/**
 * RENTipid GLCC v1.0 — Test Suite: GLCC-P9 Notifications & Documents
 *
 * Work Package: GLCC-P9
 * Acceptance Targets: TRN-01, TRN-03, E2E-01, REG-01
 */

import { DocumentSnapshotService } from '@/lib/glcc/document-snapshot-service';
import { NotificationEngine } from '@/lib/glcc/notification-engine';
import { globalLegalTranslationGate } from '@/lib/glcc/legal-translation-gate';
import type {
  DocumentParty,
  NotificationPayload,
} from '@/lib/glcc/notification-document-contracts';

describe('GLCC-P9: Notifications & Documents Localization', () => {
  const mockIssuer: DocumentParty = {
    id: 'user_provider_001',
    name: 'Juan Provider',
    email: 'provider@example.com',
    role: 'PROVIDER',
  };

  const mockRecipient: DocumentParty = {
    id: 'user_renter_002',
    name: 'Maria Renter',
    email: 'renter@example.com',
    role: 'RENTER',
  };

  describe('Document Snapshots & Financial Grounding', () => {
    it('creates immutable payment receipt snapshot with strictly PHP financial breakdown', () => {
      const snapshot = DocumentSnapshotService.createSnapshot({
        documentType: 'PAYMENT_RECEIPT',
        bookingId: 'book_abc_123',
        transactionReference: 'TX_REF_009988',
        issuer: mockIssuer,
        recipient: mockRecipient,
        requestedLocale: 'en-PH',
        breakdown: {
          baseRentalPhp: 3000,
          serviceFeePhp: 300,
          securityDepositPhp: 1000,
          deliveryFeePhp: 200,
          totalChargePhp: 4500,
        },
      });

      expect(snapshot.documentType).toBe('PAYMENT_RECEIPT');
      expect(snapshot.financialBreakdown.currency).toBe('PHP');
      expect(snapshot.financialBreakdown.totalChargePhp).toBe(4500);
      expect(snapshot.financialBreakdown.securityDepositPhp).toBe(1000);
      expect(snapshot.contentChecksum).toHaveLength(64);
      expect(Object.isFrozen(snapshot)).toBe(true);
    });

    it('attaches informational FX reference snapshot when renter used display currency', () => {
      const snapshot = DocumentSnapshotService.createSnapshot({
        documentType: 'PAYMENT_RECEIPT',
        bookingId: 'book_fx_456',
        issuer: mockIssuer,
        recipient: mockRecipient,
        requestedLocale: 'en-PH',
        breakdown: {
          baseRentalPhp: 5000,
          serviceFeePhp: 500,
          securityDepositPhp: 2000,
          deliveryFeePhp: 0,
          totalChargePhp: 7500,
        },
        fxReference: {
          quoteId: 'quote_usd_999',
          displayCurrency: 'USD',
          displayAmount: 133.85,
          referenceRate: 0.017847,
          rateSource: 'CurrencyAPI',
          rateTimestamp: '2026-09-26T12:00:00Z',
        },
      });

      expect(snapshot.financialBreakdown.currency).toBe('PHP');
      expect(snapshot.financialBreakdown.totalChargePhp).toBe(7500);
      expect(snapshot.financialBreakdown.fxReference).toBeDefined();
      expect(snapshot.financialBreakdown.fxReference?.displayCurrency).toBe('USD');
      expect(snapshot.financialBreakdown.fxReference?.displayAmount).toBe(133.85);
    });

    it('evaluates legal translation gate for rental agreements (TRN-03)', () => {
      // 1. Canonical English is approved directly
      const enAgreement = DocumentSnapshotService.createSnapshot({
        documentType: 'RENTAL_AGREEMENT',
        bookingId: 'book_legal_01',
        issuer: mockIssuer,
        recipient: mockRecipient,
        requestedLocale: 'en-PH',
        breakdown: {
          baseRentalPhp: 2000,
          serviceFeePhp: 200,
          securityDepositPhp: 500,
          deliveryFeePhp: 0,
          totalChargePhp: 2700,
        },
      });
      expect(enAgreement.legalApprovalStatus).toBe('APPROVED');
      expect(enAgreement.legalNotice).toBeUndefined();

      // 2. Unapproved locale falls back to canonical en-PH with mandatory disclosure notice
      const jaAgreement = DocumentSnapshotService.createSnapshot({
        documentType: 'RENTAL_AGREEMENT',
        bookingId: 'book_legal_02',
        issuer: mockIssuer,
        recipient: mockRecipient,
        requestedLocale: 'ja-JP',
        breakdown: {
          baseRentalPhp: 2000,
          serviceFeePhp: 200,
          securityDepositPhp: 500,
          deliveryFeePhp: 0,
          totalChargePhp: 2700,
        },
      });
      expect(jaAgreement.legalApprovalStatus).toBe('CANONICAL_FALLBACK');
      expect(jaAgreement.legalNotice).toContain('canonical English');
      expect(jaAgreement.legalNotice).toContain('Machine translation of binding clauses is prohibited');
    });

    it('honors registered legal approval for translated rental agreement (TRN-03)', () => {
      globalLegalTranslationGate.registerApproval({
        documentType: 'rental_agreement',
        sourceVersion: '2.0.0',
        targetLocale: 'fil-PH',
        approvedByActorId: 'legal_officer_jd',
        approvedAt: '2026-09-26T12:00:00Z',
        legalApprovalHash: 'legal_hash_fil_v2',
        status: 'APPROVED',
      });

      const filAgreement = DocumentSnapshotService.createSnapshot({
        documentType: 'RENTAL_AGREEMENT',
        bookingId: 'book_legal_03',
        issuer: mockIssuer,
        recipient: mockRecipient,
        requestedLocale: 'fil-PH',
        legalVersion: '2.0.0',
        breakdown: {
          baseRentalPhp: 4000,
          serviceFeePhp: 400,
          securityDepositPhp: 1000,
          deliveryFeePhp: 0,
          totalChargePhp: 5400,
        },
      });

      expect(filAgreement.legalApprovalStatus).toBe('APPROVED');
      expect(filAgreement.legalNotice).toBeUndefined();
    });
  });

  describe('Notification Engine & Multi-Party Targeting', () => {
    it('renders notification in recipient preferred locale (fil-PH)', () => {
      const payload: NotificationPayload = {
        type: 'BOOKING_CONFIRMED',
        bookingId: 'BK_101',
        recipient: {
          userId: 'user_fil_001',
          name: 'Maria Santos',
          preferredLocale: 'fil-PH',
        },
        channels: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
        variables: {
          itemTitle: 'Sony A7 IV Camera',
        },
        financialDetails: {
          authoritativeAmountPhp: 3500,
          currency: 'PHP',
        },
      };

      const result = NotificationEngine.renderNotification(payload);

      expect(result.status).toBe('DISPATCHED');
      expect(result.renderedMessages).toHaveLength(4);

      const email = result.renderedMessages.find((m) => m.channel === 'EMAIL');
      expect(email?.subject).toContain('Kumpirmado ang Booking: Sony A7 IV Camera');
      expect(email?.body).toContain('Kamusta Maria Santos');
      expect(email?.body).toContain('₱3,500.00 PHP');
      expect(email?.localeUsed).toBe('fil-PH');
      expect(email?.isFallbackToCanonical).toBe(false);

      const sms = result.renderedMessages.find((m) => m.channel === 'SMS');
      expect(sms?.body).toContain('RENTipid: Kumpirmado ang booking para sa Sony A7 IV Camera');
    });

    it('renders independent locales for multi-party notifications (renter fil-PH vs provider en-PH)', () => {
      // 1. Renter Notification in Filipino
      const renterPayload: NotificationPayload = {
        type: 'PAYMENT_RECEIPT',
        bookingId: 'BK_202',
        recipient: {
          userId: 'renter_id_1',
          name: 'Rosa',
          preferredLocale: 'fil-PH',
        },
        channels: ['EMAIL'],
        variables: {
          refNumber: 'TX_9988',
        },
        financialDetails: {
          authoritativeAmountPhp: 6000,
          currency: 'PHP',
        },
      };
      const renterResult = NotificationEngine.renderNotification(renterPayload);

      // 2. Provider Notification in English
      const providerPayload: NotificationPayload = {
        type: 'PAYMENT_RECEIPT',
        bookingId: 'BK_202',
        recipient: {
          userId: 'provider_id_2',
          name: 'Alex',
          preferredLocale: 'en-PH',
        },
        channels: ['EMAIL'],
        variables: {
          refNumber: 'TX_9988',
        },
        financialDetails: {
          authoritativeAmountPhp: 6000,
          currency: 'PHP',
        },
      };
      const providerResult = NotificationEngine.renderNotification(providerPayload);

      expect(renterResult.renderedMessages[0].body).toContain('Kamusta Rosa, matagumpay na naproseso ang iyong bayad');
      expect(providerResult.renderedMessages[0].body).toContain('Hello Alex, your payment of ₱6,000.00 PHP has been processed successfully');
    });

    it('falls back to canonical en-PH when recipient locale template is absent (TRN-01)', () => {
      const payload: NotificationPayload = {
        type: 'REFUND_ISSUED',
        bookingId: 'BK_303',
        recipient: {
          userId: 'user_de_001',
          name: 'Hans',
          preferredLocale: 'de-DE', // Unsupported template locale
        },
        channels: ['EMAIL', 'SMS'],
        variables: {},
        financialDetails: {
          authoritativeAmountPhp: 1500,
          currency: 'PHP',
        },
      };

      const result = NotificationEngine.renderNotification(payload);

      expect(result.renderedMessages[0].localeUsed).toBe('en-PH');
      expect(result.renderedMessages[0].isFallbackToCanonical).toBe(true);
      expect(result.renderedMessages[0].subject).toContain('Refund Processed: ₱1,500.00 PHP');
      expect(result.renderedMessages[0].body).toContain('Hello Hans, a refund of ₱1,500.00 PHP has been initiated');
    });

    it('interpolates all variables cleanly without leaving unparsed tags', () => {
      const payload: NotificationPayload = {
        type: 'INSPECTION_REMINDER',
        bookingId: 'BK_404',
        recipient: {
          userId: 'user_001',
          name: 'Carla',
          preferredLocale: 'en-PH',
        },
        channels: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
        variables: {
          itemTitle: 'Power Drill Set',
        },
      };

      const result = NotificationEngine.renderNotification(payload);

      for (const msg of result.renderedMessages) {
        expect(msg.body).not.toContain('{recipientName}');
        expect(msg.body).not.toContain('{itemTitle}');
        expect(msg.body).not.toContain('{bookingId}');
      }
    });
  });
});
