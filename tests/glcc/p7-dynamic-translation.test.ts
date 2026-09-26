/**
 * RENTipid GLCC v1.0 — Test Suite: GLCC-P7 Dynamic Content Translation & Legal Gate
 *
 * Work Package: GLCC-P7
 * Acceptance Targets: TRN-02, TRN-03, SEC-02, REG-01
 */

import {
  DynamicTranslationService,
  DeterministicTranslationProvider,
  computeSourceContentHash,
} from '@/lib/glcc/dynamic-translation-service';
import { sanitizeForTranslation } from '@/lib/glcc/translation-sanitizer';
import { LegalTranslationGate } from '@/lib/glcc/legal-translation-gate';
import type { LegalApprovalRecord } from '@/lib/glcc/dynamic-translation-contracts';

describe('GLCC-P7: Dynamic Content Translation, Sanitization & Legal Gate', () => {
  describe('TRN-02: Content Invalidation & Source Hashing', () => {
    it('computes deterministic SHA-256 hashes for source content', () => {
      const text = 'Cozy 2-bedroom condominium in Makati City';
      const hash1 = computeSourceContentHash(text);
      const hash2 = computeSourceContentHash(text);

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);

      const modifiedText = 'Cozy 2-bedroom condominium in Makati City with balcony';
      const hash3 = computeSourceContentHash(modifiedText);
      expect(hash3).not.toBe(hash1);
    });

    it('returns source text directly when source and target locales are identical', async () => {
      const service = new DynamicTranslationService();
      const result = await service.resolveTranslation({
        entityType: 'listing',
        entityId: 'listing_001',
        field: 'description',
        sourceText: 'Spacious studio unit near BGC',
        sourceLocale: 'en-PH',
        targetLocale: 'en-PH',
      });

      expect(result.text).toBe('Spacious studio unit near BGC');
      expect(result.isTranslated).toBe(false);
      expect(result.isFallbackToSource).toBe(false);
      expect(service.size()).toBe(0); // No unnecessary cache entry for identity
    });

    it('translates dynamic content and caches active translation record', async () => {
      const service = new DynamicTranslationService();
      const result = await service.resolveTranslation({
        entityType: 'listing',
        entityId: 'listing_001',
        field: 'description',
        sourceText: 'Spacious studio unit near BGC',
        sourceLocale: 'en-PH',
        targetLocale: 'fil-PH',
      });

      expect(result.isTranslated).toBe(true);
      expect(result.text).toContain('[TL:fil-PH]');
      expect(result.record).toBeDefined();
      expect(result.record?.status).toBe('ACTIVE');
      expect(result.record?.sourceHash).toBe(computeSourceContentHash('Spacious studio unit near BGC'));

      // Subsequent retrieval hits cache
      const cachedResult = await service.resolveTranslation({
        entityType: 'listing',
        entityId: 'listing_001',
        field: 'description',
        sourceText: 'Spacious studio unit near BGC',
        sourceLocale: 'en-PH',
        targetLocale: 'fil-PH',
      });

      expect(cachedResult.text).toBe(result.text);
      expect(cachedResult.record?.id).toBe(result.record?.id);
      expect(cachedResult.invalidationOccurred).toBe(false);
    });

    it('invalidates stale translation when source content changes (TRN-02)', async () => {
      const service = new DynamicTranslationService();

      // Initial translation
      const originalText = 'Original listing description';
      const initial = await service.resolveTranslation({
        entityType: 'listing',
        entityId: 'listing_002',
        field: 'description',
        sourceText: originalText,
        sourceLocale: 'en-PH',
        targetLocale: 'ja-JP',
      });

      expect(initial.isTranslated).toBe(true);
      expect(initial.record?.status).toBe('ACTIVE');
      const originalRecordId = initial.record?.id;

      // Host updates the description
      const updatedText = 'Updated listing description with new amenities';
      const afterUpdate = await service.resolveTranslation({
        entityType: 'listing',
        entityId: 'listing_002',
        field: 'description',
        sourceText: updatedText,
        sourceLocale: 'en-PH',
        targetLocale: 'ja-JP',
      });

      expect(afterUpdate.invalidationOccurred).toBe(true);
      expect(afterUpdate.isTranslated).toBe(true);
      expect(afterUpdate.record?.id).not.toBe(originalRecordId);
      expect(afterUpdate.record?.status).toBe('ACTIVE');
      expect(afterUpdate.record?.sourceText).toBe(updatedText);
      expect(afterUpdate.record?.sourceHash).toBe(computeSourceContentHash(updatedText));
    });

    it('falls back safely to source text when provider fails without corrupting state', async () => {
      const mockProvider = new DeterministicTranslationProvider();
      mockProvider.setFailMode(true);
      const service = new DynamicTranslationService(mockProvider);

      const sourceText = 'Reliable source text that must not be lost';
      const result = await service.resolveTranslation({
        entityType: 'review',
        entityId: 'review_001',
        field: 'comment',
        sourceText,
        sourceLocale: 'en-PH',
        targetLocale: 'es-ES',
      });

      expect(result.text).toBe(sourceText);
      expect(result.isTranslated).toBe(false);
      expect(result.isFallbackToSource).toBe(true);
    });
  });

  describe('SEC-02: Secret & PII Sanitization Before Provider Dispatch', () => {
    it('redacts JWT bearer tokens and authorization credentials', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const raw = `Please connect with token ${jwt} for access`;
      const result = sanitizeForTranslation(raw);

      expect(result.redactionCount).toBeGreaterThan(0);
      expect(result.redactionTypes).toContain('JWT_TOKEN');
      expect(result.sanitizedText).not.toContain(jwt);
      expect(result.sanitizedText).toContain('[REDACTED_JWT_TOKEN]');
    });

    it('redacts live and test API keys', () => {
      const apiKey = 'sk_live_99887766554433221100aabbccddeeff';
      const raw = `Config error: ${apiKey} invalid`;
      const result = sanitizeForTranslation(raw);

      expect(result.redactionCount).toBe(1);
      expect(result.redactionTypes).toContain('API_KEY');
      expect(result.sanitizedText).toContain('[REDACTED_API_KEY]');
      expect(result.sanitizedText).not.toContain(apiKey);
    });

    it('redacts credit card numbers (13-19 digits)', () => {
      const cardNum = '4111222233334444';
      const raw = `Security deposit reference card: ${cardNum}`;
      const result = sanitizeForTranslation(raw);

      expect(result.redactionCount).toBe(1);
      expect(result.redactionTypes).toContain('PAYMENT_CARD');
      expect(result.sanitizedText).toContain('[REDACTED_PAYMENT_CARD]');
      expect(result.sanitizedText).not.toContain(cardNum);
    });

    it('redacts embedded password strings', () => {
      const raw = 'WiFi access details: password="SuperSecretPassword123!" in lobby';
      const result = sanitizeForTranslation(raw);

      expect(result.redactionCount).toBe(1);
      expect(result.redactionTypes).toContain('PASSWORD_FIELD');
      expect(result.sanitizedText).toContain('[REDACTED_PASSWORD_FIELD]');
      expect(result.sanitizedText).not.toContain('SuperSecretPassword123!');
    });

    it('preserves clean text without false positives', () => {
      const clean = 'Spacious 1-bedroom flat in Bonifacio Global City. Walk to High Street.';
      const result = sanitizeForTranslation(clean);

      expect(result.redactionCount).toBe(0);
      expect(result.redactionTypes).toHaveLength(0);
      expect(result.sanitizedText).toBe(clean);
    });
  });

  describe('TRN-03: Legal & Regulated Content Translation Gate', () => {
    let gate: LegalTranslationGate;

    beforeEach(() => {
      gate = new LegalTranslationGate();
    });

    it('allows canonical English (en-PH) without requiring approval record', () => {
      const decision = gate.evaluatePublication({
        documentType: 'rental_agreement_v1',
        sourceVersion: '1.0.0',
        requestedLocale: 'en-PH',
      });

      expect(decision.outcome).toBe('APPROVED_CANONICAL');
      expect(decision.isPermittedToRender).toBe(true);
      expect(decision.effectiveLocale).toBe('en-PH');
      expect(decision.isMachineTranslationBlocked).toBe(false);
      expect(decision.requiresLegalNotice).toBe(false);
    });

    it('permits translated legal document when explicit legal approval is registered', () => {
      const approval: LegalApprovalRecord = {
        documentType: 'rental_agreement_v1',
        sourceVersion: '1.0.0',
        targetLocale: 'fil-PH',
        approvedByActorId: 'legal_officer_jd',
        approvedAt: '2026-09-26T12:00:00Z',
        legalApprovalHash: 'legal_hash_fil_100',
        status: 'APPROVED',
      };

      gate.registerApproval(approval);

      const decision = gate.evaluatePublication({
        documentType: 'rental_agreement_v1',
        sourceVersion: '1.0.0',
        requestedLocale: 'fil-PH',
      });

      expect(decision.outcome).toBe('APPROVED_TRANSLATED_VERSION');
      expect(decision.isPermittedToRender).toBe(true);
      expect(decision.effectiveLocale).toBe('fil-PH');
      expect(decision.approvalRecord).toEqual(approval);
      expect(decision.isMachineTranslationBlocked).toBe(false);
    });

    it('blocks machine translation auto-publish and falls back to canonical en-PH for unapproved locale', () => {
      const decision = gate.evaluatePublication({
        documentType: 'terms_of_service',
        sourceVersion: '2.0.0',
        requestedLocale: 'ja-JP',
      });

      expect(decision.outcome).toBe('FALLBACK_TO_CANONICAL_EN');
      expect(decision.isPermittedToRender).toBe(true);
      expect(decision.effectiveLocale).toBe('en-PH');
      expect(decision.isMachineTranslationBlocked).toBe(true);
      expect(decision.requiresLegalNotice).toBe(true);
      expect(decision.reason).toContain('Falling back safely to canonical English');
    });

    it('strictly blocks rendering when strictBlockOnMissing is set and approval is absent', () => {
      const decision = gate.evaluatePublication({
        documentType: 'payment_financial_disclosure',
        sourceVersion: '1.0.0',
        requestedLocale: 'zh-CN',
        strictBlockOnMissing: true,
      });

      expect(decision.outcome).toBe('BLOCKED_STRICT_REGULATORY_REQUIREMENT');
      expect(decision.isPermittedToRender).toBe(false);
      expect(decision.isMachineTranslationBlocked).toBe(true);
      expect(decision.requiresLegalNotice).toBe(true);
    });

    it('reverts to fallback when legal approval is revoked', () => {
      const approval: LegalApprovalRecord = {
        documentType: 'privacy_policy',
        sourceVersion: '1.0.0',
        targetLocale: 'es-ES',
        approvedByActorId: 'compliance_officer_1',
        approvedAt: '2026-09-26T10:00:00Z',
        legalApprovalHash: 'legal_hash_es_100',
        status: 'APPROVED',
      };

      gate.registerApproval(approval);
      expect(gate.size()).toBe(1);

      gate.revokeApproval('privacy_policy', '1.0.0', 'es-ES');
      expect(gate.size()).toBe(0);

      const decision = gate.evaluatePublication({
        documentType: 'privacy_policy',
        sourceVersion: '1.0.0',
        requestedLocale: 'es-ES',
      });

      expect(decision.outcome).toBe('FALLBACK_TO_CANONICAL_EN');
      expect(decision.effectiveLocale).toBe('en-PH');
      expect(decision.isMachineTranslationBlocked).toBe(true);
    });

    it('validates mandatory audit fields on approval registration', () => {
      expect(() => {
        gate.registerApproval({
          documentType: '',
          sourceVersion: '1.0.0',
          targetLocale: 'fil-PH',
          approvedByActorId: 'officer',
          approvedAt: '2026-09-26T12:00:00Z',
          legalApprovalHash: 'hash',
          status: 'APPROVED',
        });
      }).toThrow('Invalid legal approval record');
    });
  });
});
