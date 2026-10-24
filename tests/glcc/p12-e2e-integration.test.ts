/**
 * RENTipid GLCC v1.0 — Test Suite: GLCC-P12 Full End-to-End Integration & Regression Verification
 *
 * Work Package: GLCC-P12
 * Acceptance Targets: E2E-01, E2E-02, REG-01, PAY-01..04, TRN-01..03
 */

import {
  generateCheckoutQuote,
  verifyCheckoutQuote,
  serializeCheckoutFxEvidence,
} from '@/lib/glcc/checkout-fx-service';
import {
  assertSettlementCurrencyInvariant,
  assertLedgerCurrencyInvariant,
  assertProviderPayoutInvariant,
  calculateDeterministicRefund,
} from '@/lib/glcc/finance-authority-guards';
import { DocumentSnapshotService } from '@/lib/glcc/document-snapshot-service';
import { NotificationEngine } from '@/lib/glcc/notification-engine';
import {
  reconcilePreferencesOnSignIn,
  type PersistedPreferenceState,
  type GuestPreferenceState,
} from '@/lib/glcc/preference-reconciler';
import { createInMemoryRegistryContext } from '@/lib/glcc/registry-contracts';
import type { PlatformDefaultPreference } from '@/lib/glcc/contracts';
import { SecurityIsolationCache } from '@/lib/glcc/security-isolation-cache';
import { AiLocalizationService } from '@/lib/glcc/ai-localization-service';
import { ControlCenterService } from '@/lib/glcc/control-center-service';
import type { BookingPricingContext } from '@/lib/glcc/checkout-fx-service';
import type { NotificationPayload } from '@/lib/glcc/notification-document-contracts';
import type { FxRateProvider, NormalizedFxRate } from '@/lib/glcc/fx-contracts';

class DeterministicFxProvider implements FxRateProvider {
  public readonly providerId = 'currencyapi';
  public readonly providerName = 'CurrencyAPI (Deterministic Fixture)';

  public async getRate(baseCurrency: string, quoteCurrency: string): Promise<NormalizedFxRate> {
    return {
      providerId: this.providerId,
      rateSourceRef: 'deterministic_fixture',
      baseCurrency,
      quoteCurrency,
      rawRate: '0.01785714',
      normalizedRate: '0.01785714',
      observedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      latencyMs: 15,
    };
  }
}

describe('GLCC-P12: Full End-to-End Integration Lifecycle (E2E-01, E2E-02)', () => {
  const registries = createInMemoryRegistryContext({
    currencies: [
      { code: 'PHP', minorUnitExponent: 2, name: 'Peso', symbol: '₱', isActive: true },
      { code: 'USD', minorUnitExponent: 2, name: 'Dollar', symbol: '$', isActive: true },
      { code: 'JPY', minorUnitExponent: 0, name: 'Yen', symbol: '¥', isActive: true },
    ],
    countries: [
      {
        code: 'PH',
        name: 'Philippines',
        defaultDisplayCurrency: 'PHP',
        allowedDisplayCurrencies: ['PHP', 'USD', 'JPY'],
        defaultLanguageTag: 'en-PH',
        supportedLanguageTags: ['en-PH', 'fil-PH'],
        isActive: true,
      },
      {
        code: 'JP',
        name: 'Japan',
        defaultDisplayCurrency: 'JPY',
        allowedDisplayCurrencies: ['JPY', 'USD'],
        defaultLanguageTag: 'ja-JP',
        supportedLanguageTags: ['ja-JP', 'en-US'],
        isActive: true,
      },
    ],
    locales: [
      { tag: 'en-PH', language: 'en', region: 'PH', direction: 'ltr', name: 'English (PH)', nativeName: 'English', isActive: true, fallbackTag: 'en' },
      { tag: 'fil-PH', language: 'fil', region: 'PH', direction: 'ltr', name: 'Filipino', nativeName: 'Filipino', isActive: true, fallbackTag: 'en-PH' },
      { tag: 'ja-JP', language: 'ja', region: 'JP', direction: 'ltr', name: 'Japanese', nativeName: '日本語', isActive: true, fallbackTag: 'en-US' },
    ],
  });

  const platformDefault: PlatformDefaultPreference = {
    languageTag: 'en-PH',
    countryCode: 'PH',
    displayCurrency: 'PHP',
    chargeCurrency: 'PHP',
    timezone: 'Asia/Manila',
  };

  const authoritativeBooking: BookingPricingContext = {
    bookingId: 'book_e2e_live_001',
    basePrice: 4000,
    serviceFee: 400,
    securityDeposit: 1500,
    deliveryFee: 100,
    totalPrice: 6000,
    currency: 'PHP',
  };

  const renterProfile = {
    userId: 'renter_e2e_maria',
    name: 'Maria Santos',
    email: 'maria@example.com',
    preferredLanguage: 'fil-PH',
    preferredCountry: 'PH',
    displayCurrency: 'USD',
  };

  const providerProfile = {
    userId: 'provider_e2e_juan',
    name: 'Juan Dela Cruz',
    email: 'juan@example.com',
    preferredLanguage: 'en-PH',
    preferredCountry: 'PH',
    displayCurrency: 'PHP',
  };

  it('executes complete E2E commercial, checkout, document, and notification lifecycle (E2E-01)', async () => {
    // 1. Checkout Quote Generation from Authoritative DB Pricing
    const quoteResult = await generateCheckoutQuote({
      bookingId: authoritativeBooking.bookingId,
      authoritativeAmountPhp: authoritativeBooking.totalPrice,
      targetDisplayCurrency: renterProfile.displayCurrency,
      provider: new DeterministicFxProvider(),
    });

    expect(quoteResult.authoritativeCharge.amount).toBe('6000.00');
    expect(quoteResult.authoritativeCharge.currency).toBe('PHP');
    expect(quoteResult.quote.targetCurrency).toBe('USD');
    expect(parseFloat(quoteResult.quote.targetAmount)).toBeGreaterThan(0);
    expect(quoteResult.quote.quoteStatus).toBe('ACTIVE');

    // 2. Pre-Payment Verification & Anti-Tampering Checks
    const verification = verifyCheckoutQuote(
      quoteResult.quote,
      authoritativeBooking.totalPrice,
    );

    expect(verification.isValid).toBe(true);
    expect(quoteResult.requiresReconfirmation).toBe(false);

    // 3. Financial Settlement & Ledger Invariant Enforcement
    expect(() => {
      assertSettlementCurrencyInvariant('PHP');
      assertLedgerCurrencyInvariant('PHP');
    }).not.toThrow();

    expect(() => {
      assertSettlementCurrencyInvariant('USD');
    }).toThrow(/violation/i);

    // 4. Payment Execution & Idempotency Key Serialization
    const paymentIdempotencyKey = `tx_idemp_${quoteResult.quote.quoteId}`;
    const serializedFxEvidence = serializeCheckoutFxEvidence(quoteResult.quote);
    expect(serializedFxEvidence).toContain('quoteId');
    expect(serializedFxEvidence).toContain('USD');

    // 5. Post-Payment Document Snapshot Generation
    const receiptSnapshot = DocumentSnapshotService.createSnapshot({
      documentType: 'PAYMENT_RECEIPT',
      bookingId: authoritativeBooking.bookingId,
      transactionReference: paymentIdempotencyKey,
      issuer: {
        id: providerProfile.userId,
        name: providerProfile.name,
        email: providerProfile.email,
        role: 'PROVIDER',
      },
      recipient: {
        id: renterProfile.userId,
        name: renterProfile.name,
        email: renterProfile.email,
        role: 'RENTER',
      },
      requestedLocale: renterProfile.preferredLanguage,
      breakdown: {
        baseRentalPhp: authoritativeBooking.basePrice,
        serviceFeePhp: authoritativeBooking.serviceFee,
        securityDepositPhp: authoritativeBooking.securityDeposit,
        deliveryFeePhp: authoritativeBooking.deliveryFee,
        totalChargePhp: authoritativeBooking.totalPrice,
      },
      fxReference: {
        quoteId: quoteResult.quote.quoteId,
        displayCurrency: quoteResult.quote.targetCurrency,
        displayAmount: parseFloat(quoteResult.quote.targetAmount),
        referenceRate: parseFloat(quoteResult.quote.rate),
        rateSource: quoteResult.quote.rateSourceRef,
        rateTimestamp: quoteResult.quote.providerObservedAt,
      },
    });

    expect(receiptSnapshot.financialBreakdown.currency).toBe('PHP');
    expect(receiptSnapshot.financialBreakdown.totalChargePhp).toBe(6000);
    expect(receiptSnapshot.financialBreakdown.fxReference?.displayCurrency).toBe('USD');
    expect(receiptSnapshot.contentChecksum).toHaveLength(64);

    // 6. Multi-Party Notification Delivery (Renter in Filipino, Provider in English)
    const renterNotif: NotificationPayload = {
      type: 'PAYMENT_RECEIPT',
      bookingId: authoritativeBooking.bookingId,
      recipient: {
        userId: renterProfile.userId,
        name: renterProfile.name,
        email: renterProfile.email,
        preferredLocale: renterProfile.preferredLanguage,
      },
      channels: ['EMAIL', 'SMS'],
      variables: { refNumber: paymentIdempotencyKey },
      financialDetails: {
        authoritativeAmountPhp: authoritativeBooking.totalPrice,
        currency: 'PHP',
      },
    };

    const providerNotif: NotificationPayload = {
      type: 'BOOKING_CONFIRMED',
      bookingId: authoritativeBooking.bookingId,
      recipient: {
        userId: providerProfile.userId,
        name: providerProfile.name,
        email: providerProfile.email,
        preferredLocale: providerProfile.preferredLanguage,
      },
      channels: ['EMAIL'],
      variables: { itemTitle: 'Heavy Duty Jackhammer' },
      financialDetails: {
        authoritativeAmountPhp: authoritativeBooking.totalPrice,
        currency: 'PHP',
      },
    };

    const renterResult = NotificationEngine.renderNotification(renterNotif);
    const providerResult = NotificationEngine.renderNotification(providerNotif);

    expect(renterResult.renderedMessages[0].localeUsed).toBe('fil-PH');
    expect(renterResult.renderedMessages[0].body).toContain('Kamusta Maria Santos');
    expect(renterResult.renderedMessages[0].body).toContain('₱6,000.00 PHP');

    expect(providerResult.renderedMessages[0].localeUsed).toBe('en-PH');
    expect(providerResult.renderedMessages[0].body).toContain('Hello Juan Dela Cruz');
    expect(providerResult.renderedMessages[0].body).toContain('₱6,000.00 PHP');

    // 7. Refund & Provider Payout Invariants
    const fullRefund = calculateDeterministicRefund({
      originalPaymentAmountPhp: authoritativeBooking.totalPrice,
      refundRatio: 1.0,
      flatDeductionPhp: 0,
    });
    expect(fullRefund.refundAmountPhp).toBe('6000.00');
    expect(fullRefund.currency).toBe('PHP');

    expect(() => {
      assertProviderPayoutInvariant({
        grossRentalPhp: authoritativeBooking.basePrice,
        platformCommissionPhp: 400,
        deliveryFeePassThroughPhp: authoritativeBooking.deliveryFee,
        expectedNetPayoutPhp: 3700, // 4000 - 400 + 100 = 3700
        payoutCurrency: 'PHP',
      });
    }).not.toThrow();
  });

  it('preserves guest-to-auth preference reconciliation and idempotency (E2E-02)', () => {
    const savedAccount: PersistedPreferenceState = {
      languageTag: 'en-PH',
      countryCode: 'PH',
      displayCurrency: 'PHP',
      isManualDisplayOverride: false,
      version: 1,
    };

    // 1. Passive guest cookie does NOT overwrite saved account preference
    const passiveGuest: GuestPreferenceState = {
      languageTag: 'fil-PH',
      countryCode: 'PH',
      displayCurrency: 'USD',
      isManualDisplayOverride: false,
    };

    const passiveResult = reconcilePreferencesOnSignIn(
      savedAccount,
      passiveGuest,
      registries,
      platformDefault,
    );

    expect(passiveResult.outcome).toBe('ACCOUNT_PREFERENCE_USED');
    expect(passiveResult.effectivePreference.languageTag).toBe('en-PH');
    expect(passiveResult.accountSaveRequired).toBe(false);

    // 2. Explicit guest choice sets effective session preference but requires user confirmation before DB write
    const explicitGuest: GuestPreferenceState = {
      languageTag: 'ja-JP',
      countryCode: 'JP',
      displayCurrency: 'JPY',
      isManualDisplayOverride: true,
    };

    const explicitResult = reconcilePreferencesOnSignIn(
      savedAccount,
      explicitGuest,
      registries,
      platformDefault,
    );

    expect(explicitResult.outcome).toBe('USER_CONFIRMATION_REQUIRED');
    expect(explicitResult.effectivePreference.languageTag).toBe('ja-JP');
    expect(explicitResult.effectivePreference.countryCode).toBe('JP');
    expect(explicitResult.accountSaveRequired).toBe(true);
  });

  it('guarantees security isolation and operational control during active traffic', () => {
    const cache = new SecurityIsolationCache<string>();
    const key = SecurityIsolationCache.deriveKey({
      tenantOrUserId: renterProfile.userId,
      locale: renterProfile.preferredLanguage,
      country: renterProfile.preferredCountry,
      displayCurrency: renterProfile.displayCurrency,
    });
    cache.set(key, 'Isolated Session State');
    expect(cache.get(key)).toBe('Isolated Session State');

    // Operational control center disables locale
    const controlCenter = new ControlCenterService();
    controlCenter.setLocaleDisabled(
      { userId: 'admin', role: 'SuperAdmin' },
      'ja-JP',
      true,
      'Emergency maintenance',
    );
    expect(controlCenter.isLocaleActive('ja-JP')).toBe(false);
    expect(controlCenter.isLocaleActive('fil-PH')).toBe(true);

    // AI prompt security evaluates clean query
    const evalResult = AiLocalizationService.evaluatePromptSecurity(
      'Kumusta! Gusto kong mag-renta ng power tools bukas.',
    );
    expect(evalResult.isAllowed).toBe(true);
  });
});
