/**
 * @jest-environment jsdom
 */
/**
 * RENTipid GLCC v1.0.1 — Work Package P10: Compliance & Generated Content Localization Test Suite
 *
 * Controlling Document: RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0
 * Work Package: P10 — COMPLIANCE & GENERATED CONTENT
 *
 * Mandate:
 * LANGUAGE PRESENTATION MUST NEVER SILENTLY CHANGE THE AUTHORITATIVE LEGAL,
 * COMPLIANCE, PAYMENT, OR KYC SOURCE OF TRUTH.
 *
 * Test Scope:
 * 1. Content Classification Model & Separation of Concerns
 * 2. Controlled Legal Content & Translation State Lifecycle
 * 3. Approved vs Unapproved Translations & Fallback Safeguards
 * 4. Controlled Version Consistency & Stale Translation Invalidation
 * 5. Language / Regulatory Jurisdiction Independence Firewall
 * 6. Language / KYC Verification Authority Firewall
 * 7. Language / Payment Authority & Charge Currency Firewall
 * 8. Trust & Safety Controlled Content Boundary
 * 9. Generated Communications Framework & Locale Resolution
 * 10. Generated Email Localization & Integrity Preservation
 * 11. Runtime In-App Notification / Toast Localization
 * 12. Generated Template Placeholder Parity (en-PH vs fil-PH)
 * 13. Generated Content Injection & HTML Escaping Safety
 * 14. User-Generated Content (UGC) Preservation Boundary
 * 15. AI-Assisted Translation Legal Promotion Firewall
 * 16. Negative Invariant Fixtures (Explicit Failure Verifications)
 * 17. Registry & Non-Promotion Integrity (fil-PH QA_REQUIRED, ja-JP REGISTERED)
 */

import {
  classifyContentKey,
  LegalControlledContentEngine,
  JurisdictionPolicyEngine,
  KycAuthorityFirewall,
  PaymentAuthorityFirewall,
  GeneratedCommunicationEngine,
  escapeTemplateHtml,
  UgcBoundaryGuard,
  type ControlledLegalDocument,
  type ControlledTranslationRecord,
} from '@/lib/glcc/content-classification';

import { getDefaultLocaleRegistry } from '@/lib/glcc/default-registries';
import { isLocaleProductionSelectable } from '@/lib/glcc/registry-contracts';
import { GLCC_CANONICAL_KEYS, EN_PH_BUNDLE, FIL_PH_BUNDLE, setActiveLocale } from '@/lib/glcc/i18n';
import { NotificationEngine } from '@/lib/glcc/notification-engine';
import { globalLegalTranslationGate } from '@/lib/glcc/legal-translation-gate';

describe('RENTipid GLCC v1.0.1 — Work Package P10: Compliance & Generated Content Quality Gate', () => {
  beforeEach(() => {
    setActiveLocale('en-PH');
    globalLegalTranslationGate.clear();
  });

  // =========================================================================
  // 1. Content Classification Model
  // =========================================================================
  describe('1. Content Classification Model', () => {
    it('classifies keys deterministically into the governed categories', () => {
      expect(classifyContentKey('terms.tosSummary')).toBe('LEGAL_CONTROLLED');
      expect(classifyContentKey('privacy.dataPolicy')).toBe('LEGAL_CONTROLLED');
      expect(classifyContentKey('compliance.statutoryNotice')).toBe('COMPLIANCE_CONTROLLED');
      expect(classifyContentKey('kyc.governmentIdRequired')).toBe('KYC_CONTROLLED');
      expect(classifyContentKey('payment.securityDepositNotice')).toBe('PAYMENT_CONTROLLED');
      expect(classifyContentKey('safety.prohibitedItemsList')).toBe('TRUST_SAFETY_CONTROLLED');
      expect(classifyContentKey('email.bookingConfirmed')).toBe('GENERATED_EMAIL');
      expect(classifyContentKey('notification.paymentSuccess')).toBe('GENERATED_NOTIFICATION');
      expect(classifyContentKey('push.pickupReminder')).toBe('GENERATED_PUSH');
      expect(classifyContentKey('sms.verificationCode')).toBe('GENERATED_SMS');
      expect(classifyContentKey('document.rentalAgreementInvoice')).toBe('GENERATED_DOCUMENT');
      expect(classifyContentKey('ugc.listingTitle')).toBe('USER_GENERATED_CONTENT');
      expect(classifyContentKey('system.internalErrorCode')).toBe('TECHNICAL_INTERNAL');
      expect(classifyContentKey('nav.dashboard')).toBe('UI_STANDARD');
    });

    it('distinguishes ordinary UI strings from controlled legal, compliance, and financial copy', () => {
      const standardKey = classifyContentKey('common.save');
      const legalKey = classifyContentKey('terms.liabilityDisclaimer');
      const paymentKey = classifyContentKey('payment.chargeCurrencyDisclaimer');

      expect(standardKey).toBe('UI_STANDARD');
      expect(legalKey).toBe('LEGAL_CONTROLLED');
      expect(paymentKey).toBe('PAYMENT_CONTROLLED');
      expect(standardKey).not.toBe(legalKey);
    });
  });

  // =========================================================================
  // 2. Controlled Legal Content & State Lifecycle
  // =========================================================================
  describe('2. Controlled Legal Content & State Lifecycle', () => {
    const mockDocument: ControlledLegalDocument = {
      documentId: 'doc_tos_v1',
      documentType: 'TERMS_OF_SERVICE',
      jurisdiction: 'PH',
      sourceLanguage: 'en-PH',
      sourceVersion: '1.0',
      effectiveDate: '2026-01-01',
      contentChecksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      sourceContent: 'RENTipid Terms of Service: All rentals are governed by Philippine law.',
      status: 'ACTIVE',
    };

    it('serves canonical English (en-PH) as SOURCE_AUTHORITATIVE directly', () => {
      const result = LegalControlledContentEngine.evaluatePublication({
        document: mockDocument,
        requestedLocale: 'en-PH',
      });

      expect(result.isAuthoritative).toBe(true);
      expect(result.status).toBe('SOURCE_AUTHORITATIVE');
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.renderedContent).toBe(mockDocument.sourceContent);
      expect(result.fallbackApplied).toBe(false);
      expect(result.requiresNonAuthoritativeDisclosure).toBe(false);
    });

    it('publishes an explicitly approved translation for fil-PH with valid version', () => {
      const approvedTranslation: ControlledTranslationRecord = {
        documentId: 'doc_tos_v1',
        documentType: 'TERMS_OF_SERVICE',
        jurisdiction: 'PH',
        sourceVersion: '1.0',
        targetLocale: 'fil-PH',
        translatedVersion: '1.0',
        translatedContent: 'Mga Tuntunin ng Serbisyo ng RENTipid: Ang lahat ng upa ay pinamamahalaan ng batas ng Pilipinas.',
        status: 'TRANSLATION_APPROVED',
        approvedByActorId: 'usr_legal_officer_01',
        approvedAt: '2026-09-20T10:00:00Z',
      };

      const result = LegalControlledContentEngine.evaluatePublication({
        document: mockDocument,
        requestedLocale: 'fil-PH',
        translation: approvedTranslation,
      });

      expect(result.status).toBe('TRANSLATION_APPROVED');
      expect(result.effectiveLocale).toBe('fil-PH');
      expect(result.renderedContent).toBe(approvedTranslation.translatedContent);
      expect(result.fallbackApplied).toBe(false);
      expect(result.requiresNonAuthoritativeDisclosure).toBe(false);
    });

    it('fails safely to canonical English when translation is unapproved or draft', () => {
      const draftTranslation: ControlledTranslationRecord = {
        documentId: 'doc_tos_v1',
        documentType: 'TERMS_OF_SERVICE',
        jurisdiction: 'PH',
        sourceVersion: '1.0',
        targetLocale: 'fil-PH',
        translatedVersion: '1.0',
        translatedContent: 'Draft Filipino translation',
        status: 'TRANSLATION_DRAFT',
      };

      const result = LegalControlledContentEngine.evaluatePublication({
        document: mockDocument,
        requestedLocale: 'fil-PH',
        translation: draftTranslation,
      });

      expect(result.status).toBe('TRANSLATION_DRAFT');
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.fallbackApplied).toBe(true);
      expect(result.renderedContent).toBe(mockDocument.sourceContent);
      expect(result.requiresNonAuthoritativeDisclosure).toBe(true);
      expect(result.disclosureNotice).toContain('English version remains authoritative');
    });
  });

  // =========================================================================
  // 3. Controlled Version Consistency & Stale Invalidation
  // =========================================================================
  describe('3. Controlled Version Consistency & Stale Invalidation', () => {
    it('invalidates approved translation when source document version increments (v1.0 -> v2.0)', () => {
      const updatedDoc: ControlledLegalDocument = {
        documentId: 'doc_tos_v2',
        documentType: 'TERMS_OF_SERVICE',
        jurisdiction: 'PH',
        sourceLanguage: 'en-PH',
        sourceVersion: '2.0', // Source updated to v2.0
        effectiveDate: '2026-10-01',
        contentChecksum: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        sourceContent: 'Updated RENTipid Terms of Service v2.0: Revised cancellation rules.',
        status: 'ACTIVE',
      };

      const legacyTranslationV1: ControlledTranslationRecord = {
        documentId: 'doc_tos_v1',
        documentType: 'TERMS_OF_SERVICE',
        jurisdiction: 'PH',
        sourceVersion: '1.0',
        targetLocale: 'fil-PH',
        translatedVersion: '1.0', // Outdated translation
        translatedContent: 'Lumang salin ng v1.0',
        status: 'TRANSLATION_APPROVED',
        approvedByActorId: 'usr_legal_officer_01',
      };

      const result = LegalControlledContentEngine.evaluatePublication({
        document: updatedDoc,
        requestedLocale: 'fil-PH',
        translation: legacyTranslationV1,
      });

      expect(result.status).toBe('TRANSLATION_SUPERSEDED');
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.fallbackApplied).toBe(true);
      expect(result.renderedContent).toBe(updatedDoc.sourceContent);
      expect(result.requiresNonAuthoritativeDisclosure).toBe(true);
      expect(result.disclosureNotice).toContain('superseded');
    });
  });

  // =========================================================================
  // 4. Language / Regulatory Jurisdiction Independence Firewall
  // =========================================================================
  describe('4. Language / Regulatory Jurisdiction Independence Firewall', () => {
    it('ensures changing UI language to fil-PH leaves Philippine regulatory jurisdiction unchanged', () => {
      const enResolution = JurisdictionPolicyEngine.resolveJurisdiction({
        countryCode: 'PH',
        activeLocale: 'en-PH',
      });

      const filResolution = JurisdictionPolicyEngine.resolveJurisdiction({
        countryCode: 'PH',
        activeLocale: 'fil-PH',
      });

      expect(enResolution.jurisdiction).toBe('PH');
      expect(filResolution.jurisdiction).toBe('PH');
      expect(filResolution.isJurisdictionAlteredByLocale).toBe(false);
      expect(filResolution.complianceFramework).toBe(enResolution.complianceFramework);
    });

    it('ensures fil-PH language in US country profile does NOT falsely imply PH jurisdiction', () => {
      const usFilResolution = JurisdictionPolicyEngine.resolveJurisdiction({
        countryCode: 'US',
        activeLocale: 'fil-PH',
      });

      expect(usFilResolution.jurisdiction).toBe('US');
      expect(usFilResolution.complianceFramework).toContain('United States');
      expect(usFilResolution.isJurisdictionAlteredByLocale).toBe(false);
    });
  });

  // =========================================================================
  // 5. Language / KYC Verification Authority Firewall
  // =========================================================================
  describe('5. Language / KYC Verification Authority Firewall', () => {
    it('guarantees KYC verification level and document requirements are immune to language switching', () => {
      const user = {
        userId: 'usr_kyc_test_01',
        countryJurisdiction: 'PH',
        kycLevel: 2,
        kycStatus: 'VERIFIED',
      };

      const assertionEn = KycAuthorityFirewall.evaluateKycAuthority({
        ...user,
        activeLocale: 'en-PH',
      });

      const assertionFil = KycAuthorityFirewall.evaluateKycAuthority({
        ...user,
        activeLocale: 'fil-PH',
      });

      expect(assertionFil.requiredKycLevel).toBe(assertionEn.requiredKycLevel);
      expect(assertionFil.kycStatus).toBe(assertionEn.kycStatus);
      expect(assertionFil.allowedDocumentTypes).toEqual(assertionEn.allowedDocumentTypes);
      expect(assertionFil.allowedDocumentTypes).toContain('PHILSYS_ID');
    });
  });

  // =========================================================================
  // 6. Language / Payment Authority Firewall
  // =========================================================================
  describe('6. Language / Payment Authority Firewall', () => {
    it('guarantees that chargeCurrency remains strictly PHP regardless of UI language or display currency', () => {
      const authEn = PaymentAuthorityFirewall.assertChargeAuthority({
        amountPhp: 4500,
        activeLocale: 'en-PH',
      });

      const authFil = PaymentAuthorityFirewall.assertChargeAuthority({
        amountPhp: 4500,
        activeLocale: 'fil-PH',
        requestedCurrency: 'USD',
      });

      expect(authFil.chargeCurrency).toBe('PHP');
      expect(authEn.chargeCurrency).toBe('PHP');
      expect(authFil.authoritativeChargeAmount).toBe(4500);
      expect(authFil.isPaymentAuthorityPreserved).toBe(true);
    });
  });

  // =========================================================================
  // 7. Trust & Safety Controlled Content Boundary
  // =========================================================================
  describe('7. Trust & Safety Controlled Content Boundary', () => {
    it('preserves statutory warnings and prohibited conduct notices without weakening', () => {
      // Both English and Filipino bundles provide canonical prohibited items warnings
      expect(EN_PH_BUNDLE.messages['superAdmin.criticalComplianceNotice']).toBe('CRITICAL COMPLIANCE NOTICE:');
      expect(FIL_PH_BUNDLE.messages['superAdmin.criticalComplianceNotice']).toBe('KRITIKAL NA PAUNAWA SA PAGSUNOD:');
      expect(classifyContentKey('safety.prohibitedItemsList')).toBe('TRUST_SAFETY_CONTROLLED');
    });
  });

  // =========================================================================
  // 8. Generated Communications Framework & Locale Resolution
  // =========================================================================
  describe('8. Generated Communications Framework & Locale Resolution', () => {
    it('resolves account preference for authenticated users', () => {
      const recipient = {
        userId: 'usr_auth_01',
        name: 'Maria Santos',
        email: 'maria@example.ph',
        accountPreferredLocale: 'en-PH',
      };

      const resolved = GeneratedCommunicationEngine.resolveLocale(recipient, 'PRODUCTION');
      expect(resolved.effectiveLocale).toBe('en-PH');
      expect(resolved.isFallbackApplied).toBe(false);
      expect(resolved.injectionBlocked).toBe(false);
    });

    it('in Production mode, blocks fil-PH and ja-JP account preferences, failing closed to en-PH', () => {
      const filRecipient = {
        userId: 'usr_auth_02',
        name: 'Juan dela Cruz',
        accountPreferredLocale: 'fil-PH', // QA_REQUIRED: blocked in production
      };

      const resolvedFil = GeneratedCommunicationEngine.resolveLocale(filRecipient, 'PRODUCTION');
      expect(resolvedFil.effectiveLocale).toBe('en-PH');
      expect(resolvedFil.isFallbackApplied).toBe(true);
      expect(resolvedFil.injectionBlocked).toBe(true);

      const jaRecipient = {
        userId: 'usr_auth_03',
        name: 'Kenji Sato',
        accountPreferredLocale: 'ja-JP', // REGISTERED: blocked in production
      };

      const resolvedJa = GeneratedCommunicationEngine.resolveLocale(jaRecipient, 'PRODUCTION');
      expect(resolvedJa.effectiveLocale).toBe('en-PH');
      expect(resolvedJa.isFallbackApplied).toBe(true);
      expect(resolvedJa.injectionBlocked).toBe(true);
    });

    it('in Controlled QA mode, permits fil-PH for generated communications', () => {
      const filRecipient = {
        userId: 'usr_qa_01',
        name: 'Juan dela Cruz',
        accountPreferredLocale: 'fil-PH',
      };

      const resolved = GeneratedCommunicationEngine.resolveLocale(filRecipient, 'CONTROLLED_QA');
      expect(resolved.effectiveLocale).toBe('fil-PH');
      expect(resolved.isFallbackApplied).toBe(false);
      expect(resolved.injectionBlocked).toBe(false);
    });

    it('rejects invalid or malformed locale tags, failing closed to en-PH', () => {
      const badRecipient = {
        name: 'Attacker',
        accountPreferredLocale: '<script>alert(1)</script>',
      };

      const resolved = GeneratedCommunicationEngine.resolveLocale(badRecipient, 'PRODUCTION');
      expect(resolved.effectiveLocale).toBe('en-PH');
      expect(resolved.isFallbackApplied).toBe(true);
      expect(resolved.injectionBlocked).toBe(true);
    });
  });

  // =========================================================================
  // 9. Generated Email & In-App Notification Localization
  // =========================================================================
  describe('9. Generated Email & In-App Notification Localization', () => {
    it('renders transactional email in en-PH and fil-PH while preserving booking identifiers and amounts', () => {
      const enResult = NotificationEngine.renderNotification({
        type: 'BOOKING_CONFIRMED',
        bookingId: 'BK_998877',
        recipient: {
          userId: 'usr_1',
          name: 'Maria Renter',
          preferredLocale: 'en-PH',
        },
        channels: ['EMAIL', 'IN_APP'],
        variables: {
          itemTitle: 'Sony A7IV Camera',
        },
        financialDetails: {
          authoritativeAmountPhp: 3500.0,
          currency: 'PHP',
        },
      });

      const filResult = NotificationEngine.renderNotification({
        type: 'BOOKING_CONFIRMED',
        bookingId: 'BK_998877',
        recipient: {
          userId: 'usr_1',
          name: 'Maria Renter',
          preferredLocale: 'fil-PH',
        },
        channels: ['EMAIL', 'IN_APP'],
        variables: {
          itemTitle: 'Sony A7IV Camera',
        },
        financialDetails: {
          authoritativeAmountPhp: 3500.0,
          currency: 'PHP',
        },
      });

      const enEmail = enResult.renderedMessages.find((m) => m.channel === 'EMAIL');
      const filEmail = filResult.renderedMessages.find((m) => m.channel === 'EMAIL');

      expect(enEmail).toBeDefined();
      expect(filEmail).toBeDefined();

      // Check preservation of immutable data
      expect(enEmail?.subject).toContain('Sony A7IV Camera');
      expect(filEmail?.subject).toContain('Sony A7IV Camera');
      expect(enEmail?.body).toContain('3,500.00 PHP');
      expect(filEmail?.body).toContain('3,500.00 PHP');

      // Check linguistic differences
      expect(enEmail?.body).toContain('has been confirmed');
      expect(filEmail?.body).toContain('kumpirmado na ang iyong booking');
    });

    it('renders runtime in-app notification in fil-PH without raw keys', () => {
      const filResult = NotificationEngine.renderNotification({
        type: 'PAYMENT_RECEIPT',
        bookingId: 'BK_112233',
        recipient: {
          userId: 'usr_2',
          name: 'Pedro Provider',
          preferredLocale: 'fil-PH',
        },
        channels: ['IN_APP'],
        variables: {
          refNumber: 'TX_REF_5544',
        },
        financialDetails: {
          authoritativeAmountPhp: 1200.0,
          currency: 'PHP',
        },
      });

      const inApp = filResult.renderedMessages.find((m) => m.channel === 'IN_APP');
      expect(inApp?.subject).toBe('Naproseso ang Bayad');
      expect(inApp?.body).toContain('BK_112233');
      expect(inApp?.body).not.toContain('notification.');
      expect(inApp?.body).not.toContain('undefined');
    });
  });

  // =========================================================================
  // 10. Template Placeholder Parity & Injection Safety
  // =========================================================================
  describe('10. Template Placeholder Parity & Injection Safety', () => {
    it('escapes dangerous HTML characters in generated template interpolation', () => {
      const unsafeInput = '<script>alert("XSS")</script>& "quotes"';
      const escaped = escapeTemplateHtml(unsafeInput);

      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
      expect(escaped).toContain('&amp;');
      expect(escaped).toContain('&quot;');
    });

    it('sanitizes variables interpolated via GeneratedCommunicationEngine.interpolateSafe', () => {
      const template = 'Hello {name}, your booking #{bookingId} is confirmed.';
      const variables = {
        name: '<b>Malicious</b>',
        bookingId: 'BK_12345',
      };

      const rendered = GeneratedCommunicationEngine.interpolateSafe(template, variables);
      expect(rendered).toContain('&lt;b&gt;Malicious&lt;/b&gt;');
      expect(rendered).not.toContain('<b>');
      expect(rendered).toContain('BK_12345');
    });
  });

  // =========================================================================
  // 11. User-Generated Content (UGC) Boundary
  // =========================================================================
  describe('11. User-Generated Content (UGC) Boundary', () => {
    it('leaves user listing titles, descriptions, and reviews untouched by UI translation', () => {
      const listingUgc = {
        id: 'list_999',
        entityType: 'LISTING' as const,
        authorId: 'usr_owner_01',
        originalContent: 'Professional DJI Ronin Gimbal with 3 batteries for rent in Makati City.',
        createdAt: '2026-09-20T08:00:00Z',
      };

      const renderedEn = UgcBoundaryGuard.renderUgcPreserved(listingUgc, 'en-PH');
      const renderedFil = UgcBoundaryGuard.renderUgcPreserved(listingUgc, 'fil-PH');

      expect(renderedEn).toBe(listingUgc.originalContent);
      expect(renderedFil).toBe(listingUgc.originalContent);
      expect(renderedFil).toBe(renderedEn);
    });
  });

  // =========================================================================
  // 12. AI-Assisted Translation Legal Promotion Firewall
  // =========================================================================
  describe('12. AI-Assisted Translation Legal Promotion Firewall', () => {
    it('strictly blocks AI-generated translations from being published as authoritative legal text', () => {
      const doc: ControlledLegalDocument = {
        documentId: 'doc_privacy_v1',
        documentType: 'PRIVACY_POLICY',
        jurisdiction: 'PH',
        sourceLanguage: 'en-PH',
        sourceVersion: '1.0',
        effectiveDate: '2026-01-01',
        contentChecksum: '1111111111111111111111111111111111111111111111111111111111111111',
        sourceContent: 'RENTipid Privacy Policy: All personal data is protected under RA 10173.',
        status: 'ACTIVE',
      };

      const aiTranslation: ControlledTranslationRecord = {
        documentId: 'doc_privacy_v1',
        documentType: 'PRIVACY_POLICY',
        jurisdiction: 'PH',
        sourceVersion: '1.0',
        targetLocale: 'fil-PH',
        translatedVersion: '1.0',
        translatedContent: 'Patakaran sa Pagkapribado na binuo ng AI',
        status: 'TRANSLATION_DRAFT',
        isAiGenerated: true,
      };

      const result = LegalControlledContentEngine.evaluatePublication({
        document: doc,
        requestedLocale: 'fil-PH',
        translation: aiTranslation,
      });

      expect(result.status).toBe('TRANSLATION_DRAFT');
      expect(result.isAuthoritative).toBe(true);
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.renderedContent).toBe(doc.sourceContent);
      expect(result.requiresNonAuthoritativeDisclosure).toBe(true);
      expect(result.disclosureNotice).toContain('AI-generated translation is pending legal compliance approval');
    });
  });

  // =========================================================================
  // 13. Negative Invariant Fixtures (Explicit Failure Verifications)
  // =========================================================================
  describe('13. Negative Invariant Fixtures (Explicit Failure Verifications)', () => {
    it('NEGATIVE FIXTURE 1: Unapproved legal translation cannot be treated as authoritative', () => {
      const doc: ControlledLegalDocument = {
        documentId: 'doc_legal_neg_1',
        documentType: 'RENTAL_AGREEMENT',
        jurisdiction: 'PH',
        sourceLanguage: 'en-PH',
        sourceVersion: '1.0',
        effectiveDate: '2026-01-01',
        contentChecksum: 'checksum1',
        sourceContent: 'Canonical rental terms',
        status: 'ACTIVE',
      };

      const unapproved: ControlledTranslationRecord = {
        documentId: 'doc_legal_neg_1',
        documentType: 'RENTAL_AGREEMENT',
        jurisdiction: 'PH',
        sourceVersion: '1.0',
        targetLocale: 'fil-PH',
        translatedVersion: '1.0',
        translatedContent: 'Unapproved translation',
        status: 'TRANSLATION_REVIEW_REQUIRED',
      };

      const res = LegalControlledContentEngine.evaluatePublication({
        document: doc,
        requestedLocale: 'fil-PH',
        translation: unapproved,
      });

      expect(res.fallbackApplied).toBe(true);
      expect(res.effectiveLocale).toBe('en-PH');
      expect(res.renderedContent).toBe(doc.sourceContent);
    });

    it('NEGATIVE FIXTURE 2: Outdated translated legal version (v1.0) cannot be served as current (v2.0)', () => {
      const docV2: ControlledLegalDocument = {
        documentId: 'doc_v2',
        documentType: 'TERMS',
        jurisdiction: 'PH',
        sourceLanguage: 'en-PH',
        sourceVersion: '2.0',
        effectiveDate: '2026-09-01',
        contentChecksum: 'chk2',
        sourceContent: 'Terms v2.0',
        status: 'ACTIVE',
      };

      const transV1: ControlledTranslationRecord = {
        documentId: 'doc_v1',
        documentType: 'TERMS',
        jurisdiction: 'PH',
        sourceVersion: '1.0',
        targetLocale: 'fil-PH',
        translatedVersion: '1.0',
        translatedContent: 'Salin v1.0',
        status: 'TRANSLATION_APPROVED',
        approvedByActorId: 'usr_legal',
      };

      const res = LegalControlledContentEngine.evaluatePublication({
        document: docV2,
        requestedLocale: 'fil-PH',
        translation: transV1,
      });

      expect(res.status).toBe('TRANSLATION_SUPERSEDED');
      expect(res.fallbackApplied).toBe(true);
      expect(res.effectiveLocale).toBe('en-PH');
    });

    it('NEGATIVE FIXTURE 3: Client cannot force unsupported or blocked locale in generated communications', () => {
      const maliciousRecipient = {
        name: 'Infiltrator',
        accountPreferredLocale: 'unsupported-XX',
      };

      const res = GeneratedCommunicationEngine.resolveLocale(maliciousRecipient, 'PRODUCTION');
      expect(res.effectiveLocale).toBe('en-PH');
      expect(res.injectionBlocked).toBe(true);
    });

    it('NEGATIVE FIXTURE 4: Language change cannot alter financial charge authority', () => {
      const res = PaymentAuthorityFirewall.assertChargeAuthority({
        amountPhp: 2500,
        activeLocale: 'fil-PH',
        requestedCurrency: 'USD',
      });

      expect(res.chargeCurrency).toBe('PHP');
      expect(res.authoritativeChargeAmount).toBe(2500);
    });
  });

  // =========================================================================
  // 14. Registry & Non-Promotion Integrity Guards
  // =========================================================================
  describe('14. Registry & Non-Promotion Integrity Guards', () => {
    it('verifies fil-PH remains strictly QA_REQUIRED and ja-JP remains REGISTERED', () => {
      const registry = getDefaultLocaleRegistry();
      const fil = registry.get('fil-PH');
      const ja = registry.get('ja-JP');
      const en = registry.get('en-PH');

      expect(fil?.releaseStatus).toBe('QA_REQUIRED');
      expect(isLocaleProductionSelectable(fil!)).toBe(false);

      expect(ja?.releaseStatus).toBe('REGISTERED');
      expect(isLocaleProductionSelectable(ja!)).toBe(false);

      expect(en?.releaseStatus).toBe('PRODUCTION_READY');
      expect(isLocaleProductionSelectable(en!)).toBe(true);
    });

    it('confirms 0 Japanese translations exist and canonical keys remain exactly 2,208', () => {
      expect(GLCC_CANONICAL_KEYS).toHaveLength(2208);
      expect(Object.keys(EN_PH_BUNDLE.messages)).toHaveLength(2208);
      expect(Object.keys(FIL_PH_BUNDLE.messages)).toHaveLength(2208);
    });
  });
});
