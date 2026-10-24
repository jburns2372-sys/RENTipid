/**
 * RENTipid GLCC v1.0.1 — Content Classification & Controlled Localization Engine
 *
 * Controlling Document: RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0
 * Work Package: P10 — COMPLIANCE & GENERATED CONTENT
 *
 * Core Mandate:
 * LANGUAGE PRESENTATION MUST NEVER SILENTLY CHANGE THE AUTHORITATIVE LEGAL,
 * COMPLIANCE, PAYMENT, OR KYC SOURCE OF TRUTH.
 *
 * Distinguishes:
 * 1. UI_STANDARD — Ordinary application UI translation governed by canonical dictionary.
 * 2. LEGAL_CONTROLLED — Regulated contracts, terms of service, privacy policies.
 * 3. COMPLIANCE_CONTROLLED — Regulatory disclosures, compliance certifications.
 * 4. KYC_CONTROLLED — Identity verification notices, statutory declarations.
 * 5. PAYMENT_CONTROLLED — Inviolable financial disclosures, PHP charge authority, refund terms.
 * 6. TRUST_SAFETY_CONTROLLED — Prohibited items, safety warnings, fraud advisories.
 * 7. GENERATED_NOTIFICATION — Runtime in-app notifications and alerts.
 * 8. GENERATED_EMAIL — Transactional and operational email communications.
 * 9. GENERATED_PUSH — Mobile push notifications.
 * 10. GENERATED_SMS — SMS transactional alerts.
 * 11. GENERATED_DOCUMENT — System-generated rental agreements, invoices, receipts.
 * 12. USER_GENERATED_CONTENT — Unaltered listing titles, descriptions, chat messages, reviews.
 * 13. TECHNICAL_INTERNAL — Error codes, system logs, telemetry keys.
 */

import { getDefaultLocaleRegistry } from './default-registries';

// ============================================================================
// 1. CONTENT CLASSIFICATION MODEL
// ============================================================================

export type ContentClassificationCategory =
  | 'UI_STANDARD'
  | 'LEGAL_CONTROLLED'
  | 'COMPLIANCE_CONTROLLED'
  | 'KYC_CONTROLLED'
  | 'PAYMENT_CONTROLLED'
  | 'TRUST_SAFETY_CONTROLLED'
  | 'GENERATED_NOTIFICATION'
  | 'GENERATED_EMAIL'
  | 'GENERATED_PUSH'
  | 'GENERATED_SMS'
  | 'GENERATED_DOCUMENT'
  | 'USER_GENERATED_CONTENT'
  | 'TECHNICAL_INTERNAL';

export type LegalTranslationState =
  | 'SOURCE_AUTHORITATIVE'
  | 'TRANSLATION_DRAFT'
  | 'TRANSLATION_REVIEW_REQUIRED'
  | 'TRANSLATION_APPROVED'
  | 'TRANSLATION_SUPERSEDED';

export interface ControlledLegalDocument {
  readonly documentId: string;
  readonly documentType: string; // e.g. "TERMS_OF_SERVICE", "PRIVACY_POLICY", "RENTAL_AGREEMENT"
  readonly jurisdiction: string; // e.g. "PH", "US", "GLOBAL"
  readonly sourceLanguage: string; // Default: "en-PH"
  readonly sourceVersion: string; // e.g. "1.0", "2.1"
  readonly effectiveDate: string;
  readonly contentChecksum: string;
  readonly sourceContent: string;
  readonly status: 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED';
}

export interface ControlledTranslationRecord {
  readonly documentId: string;
  readonly documentType: string;
  readonly jurisdiction: string;
  readonly sourceVersion: string;
  readonly targetLocale: string;
  readonly translatedVersion: string;
  readonly translatedContent: string;
  readonly status: LegalTranslationState;
  readonly isAiGenerated?: boolean;
  readonly approvedByActorId?: string;
  readonly approvedAt?: string;
  readonly auditHash?: string;
}

export interface LegalPublicationResult {
  readonly isAuthoritative: boolean;
  readonly effectiveLocale: string;
  readonly sourceVersion: string;
  readonly translatedVersion?: string;
  readonly status: LegalTranslationState;
  readonly renderedContent: string;
  readonly fallbackApplied: boolean;
  readonly requiresNonAuthoritativeDisclosure: boolean;
  readonly disclosureNotice?: string;
  readonly reason: string;
}

// ============================================================================
// 2. CONTENT CLASSIFICATION RULES
// ============================================================================

export function classifyContentKey(key: string): ContentClassificationCategory {
  if (!key || typeof key !== 'string') return 'TECHNICAL_INTERNAL';

  if (key.startsWith('email.') || key.startsWith('mail.')) {
    return 'GENERATED_EMAIL';
  }
  if (key.startsWith('notification.') || key.startsWith('toast.') || key.startsWith('alert.')) {
    return 'GENERATED_NOTIFICATION';
  }
  if (key.startsWith('push.')) {
    return 'GENERATED_PUSH';
  }
  if (key.startsWith('sms.')) {
    return 'GENERATED_SMS';
  }
  if (key.startsWith('document.') || key.startsWith('invoice.') || key.startsWith('receipt.')) {
    return 'GENERATED_DOCUMENT';
  }
  if (key.startsWith('terms.') || key.startsWith('privacy.') || key.startsWith('legal.') || key.includes('rentalAgreement')) {
    return 'LEGAL_CONTROLLED';
  }
  if (key.startsWith('compliance.') || key.includes('regulatory') || key.includes('statutory')) {
    return 'COMPLIANCE_CONTROLLED';
  }
  if (key.startsWith('kyc.') || key.includes('identityVerification') || key.includes('governmentId')) {
    return 'KYC_CONTROLLED';
  }
  if (key.startsWith('payment.') || key.startsWith('checkout.') || key.includes('chargeAmount') || key.includes('securityDeposit')) {
    return 'PAYMENT_CONTROLLED';
  }
  if (key.startsWith('safety.') || key.startsWith('prohibited.') || key.includes('fraudWarning') || key.includes('trustAndSafety')) {
    return 'TRUST_SAFETY_CONTROLLED';
  }
  if (key.startsWith('ugc.') || key.startsWith('listing.') || key.startsWith('review.') || key.startsWith('chat.')) {
    return 'USER_GENERATED_CONTENT';
  }
  if (key.startsWith('system.') || key.startsWith('internal.') || key.startsWith('error.')) {
    return 'TECHNICAL_INTERNAL';
  }

  return 'UI_STANDARD';
}

// ============================================================================
// 3. LEGAL & COMPLIANCE CONTROLLED PUBLICATION ENGINE
// ============================================================================

export class LegalControlledContentEngine {
  /**
   * Evaluates whether a legal document can be published in the requested locale.
   * Enforces that:
   * 1. The canonical source (en-PH) is always SOURCE_AUTHORITATIVE.
   * 2. An approved translation must match the source version; outdated translations become TRANSLATION_SUPERSEDED.
   * 3. AI/machine-generated drafts cannot be served as approved legal content (AI promotion BLOCKED).
   * 4. Missing or unapproved translations fail safely to the authoritative source with disclosure notice.
   */
  public static evaluatePublication(params: {
    readonly document: ControlledLegalDocument;
    readonly requestedLocale: string;
    readonly requestedVersion?: string;
    readonly translation?: ControlledTranslationRecord;
    readonly strictRegulatoryBlock?: boolean;
  }): LegalPublicationResult {
    const { document, requestedLocale, translation, strictRegulatoryBlock } = params;
    const reqLocale = (requestedLocale || 'en-PH').trim();

    // 1. Canonical Source Language (en-PH) is always legally authoritative
    if (reqLocale === 'en-PH' || reqLocale === 'en') {
      return {
        isAuthoritative: true,
        effectiveLocale: 'en-PH',
        sourceVersion: document.sourceVersion,
        status: 'SOURCE_AUTHORITATIVE',
        renderedContent: document.sourceContent,
        fallbackApplied: false,
        requiresNonAuthoritativeDisclosure: false,
        reason: 'Authoritative canonical source document published directly.',
      };
    }

    // 2. Strict regulatory block if no translation provided
    if (!translation) {
      if (strictRegulatoryBlock) {
        return {
          isAuthoritative: false,
          effectiveLocale: 'en-PH',
          sourceVersion: document.sourceVersion,
          status: 'TRANSLATION_REVIEW_REQUIRED',
          renderedContent: '',
          fallbackApplied: true,
          requiresNonAuthoritativeDisclosure: true,
          disclosureNotice: 'STRICT REGULATORY BLOCK: No translated legal text is authorized for this locale.',
          reason: `Document '${document.documentType}' has no translation for '${reqLocale}'. Rendering blocked under strict compliance.`,
        };
      }

      // Safe canonical fallback with disclosure notice
      return {
        isAuthoritative: true,
        effectiveLocale: 'en-PH',
        sourceVersion: document.sourceVersion,
        status: 'SOURCE_AUTHORITATIVE',
        renderedContent: document.sourceContent,
        fallbackApplied: true,
        requiresNonAuthoritativeDisclosure: true,
        disclosureNotice: 'NOTICE: This document is provided in English as the legally authoritative version.',
        reason: `No translation available for '${reqLocale}'. Safely falling back to authoritative source (en-PH).`,
      };
    }

    // 3. Version Consistency Guard: translatedVersion must match sourceVersion
    if (translation.translatedVersion !== document.sourceVersion) {
      return {
        isAuthoritative: true,
        effectiveLocale: 'en-PH',
        sourceVersion: document.sourceVersion,
        translatedVersion: translation.translatedVersion,
        status: 'TRANSLATION_SUPERSEDED',
        renderedContent: document.sourceContent,
        fallbackApplied: true,
        requiresNonAuthoritativeDisclosure: true,
        disclosureNotice: `NOTICE: The translated version (v${translation.translatedVersion}) is superseded. The authoritative v${document.sourceVersion} in English is displayed.`,
        reason: `Version mismatch: translated version (v${translation.translatedVersion}) does not match current source (v${document.sourceVersion}). Fallback to canonical source enforced.`,
      };
    }

    // 4. AI Translation Boundary Guard: AI draft cannot be authoritative or approved without human review
    if (translation.isAiGenerated && translation.status !== 'TRANSLATION_APPROVED') {
      return {
        isAuthoritative: true,
        effectiveLocale: 'en-PH',
        sourceVersion: document.sourceVersion,
        translatedVersion: translation.translatedVersion,
        status: 'TRANSLATION_DRAFT',
        renderedContent: document.sourceContent,
        fallbackApplied: true,
        requiresNonAuthoritativeDisclosure: true,
        disclosureNotice: 'NOTICE: AI-generated translation is pending legal compliance approval. English remains authoritative.',
        reason: 'AI-assisted translations cannot be automatically promoted to authoritative legal text.',
      };
    }

    // 5. Explicitly Approved Translation Check
    if (translation.status === 'TRANSLATION_APPROVED' && translation.approvedByActorId) {
      return {
        isAuthoritative: false,
        effectiveLocale: reqLocale,
        sourceVersion: document.sourceVersion,
        translatedVersion: translation.translatedVersion,
        status: 'TRANSLATION_APPROVED',
        renderedContent: translation.translatedContent,
        fallbackApplied: false,
        requiresNonAuthoritativeDisclosure: false,
        reason: `Approved translation verified (Approved by ${translation.approvedByActorId} at ${translation.approvedAt}).`,
      };
    }

    // 6. Default Fallback: Draft or Review-Required Translation
    return {
      isAuthoritative: true,
      effectiveLocale: 'en-PH',
      sourceVersion: document.sourceVersion,
      translatedVersion: translation.translatedVersion,
      status: translation.status || 'TRANSLATION_REVIEW_REQUIRED',
      renderedContent: document.sourceContent,
      fallbackApplied: true,
      requiresNonAuthoritativeDisclosure: true,
      disclosureNotice: 'NOTICE: Translation is pending formal legal review. The English version remains authoritative and legally binding.',
      reason: `Translation status is '${translation.status}'. Fallback to canonical English enforced.`,
    };
  }
}

// ============================================================================
// 4. JURISDICTION & INDEPENDENCE FIREWALLS
// ============================================================================

export interface JurisdictionResolutionResult {
  readonly jurisdiction: string; // e.g. "PH", "US"
  readonly countryCode: string;
  readonly activeLocale: string;
  readonly isJurisdictionAlteredByLocale: boolean;
  readonly complianceFramework: string;
}

export class JurisdictionPolicyEngine {
  /**
   * Resolves regulatory jurisdiction strictly from physical/legal country binding.
   * UI language selection (e.g. fil-PH vs en-PH) NEVER alters jurisdiction applicability.
   */
  public static resolveJurisdiction(params: {
    readonly countryCode: string;
    readonly activeLocale: string;
  }): JurisdictionResolutionResult {
    const normalizedCountry = (params.countryCode || 'PH').trim().toUpperCase();

    // Map physical country to regulatory jurisdiction
    let jurisdiction = 'PH';
    let complianceFramework = 'Republic of the Philippines Laws (DTI, NPC, RA 10173)';

    if (normalizedCountry === 'US') {
      jurisdiction = 'US';
      complianceFramework = 'United States Federal and State Regulations';
    } else if (normalizedCountry === 'SG') {
      jurisdiction = 'SG';
      complianceFramework = 'Singapore PDPA and Consumer Protection Act';
    }

    // Changing language must NEVER mutate jurisdiction
    return {
      jurisdiction,
      countryCode: normalizedCountry,
      activeLocale: params.activeLocale,
      isJurisdictionAlteredByLocale: false,
      complianceFramework,
    };
  }
}

// ============================================================================
// 5. KYC & PAYMENT AUTHORITY FIREWALL GUARDS
// ============================================================================

export interface KycAuthorityAssertion {
  readonly userId: string;
  readonly requiredKycLevel: number;
  readonly kycStatus: string;
  readonly countryJurisdiction: string;
  readonly allowedDocumentTypes: string[];
}

export class KycAuthorityFirewall {
  /**
   * Asserts that KYC verification rules and authority remain strictly decoupled from UI locale.
   */
  public static evaluateKycAuthority(user: {
    readonly userId: string;
    readonly countryJurisdiction: string;
    readonly kycLevel: number;
    readonly kycStatus: string;
    readonly activeLocale: string;
  }): KycAuthorityAssertion {
    const jurisdiction = user.countryJurisdiction || 'PH';

    // Jurisdiction-specific document requirements (e.g. PH accepts PhilSys, UMID, Passport)
    const allowedDocumentTypes =
      jurisdiction === 'PH'
        ? ['PHILSYS_ID', 'UMID', 'PASSPORT', 'DRIVERS_LICENSE']
        : ['PASSPORT', 'NATIONAL_ID'];

    // UI locale changes NEVER mutate required KYC level or document types
    return {
      userId: user.userId,
      requiredKycLevel: user.kycLevel,
      kycStatus: user.kycStatus,
      countryJurisdiction: jurisdiction,
      allowedDocumentTypes,
    };
  }
}

export class PaymentAuthorityFirewall {
  /**
   * Asserts that charge currency, payment processor routing, and ledger entries
   * remain strictly PHP, completely immune to locale changes.
   */
  public static assertChargeAuthority(params: {
    readonly amountPhp: number;
    readonly activeLocale: string;
    readonly requestedCurrency?: string;
  }): {
    readonly authoritativeChargeAmount: number;
    readonly chargeCurrency: 'PHP';
    readonly isPaymentAuthorityPreserved: boolean;
  } {
    return {
      authoritativeChargeAmount: params.amountPhp,
      chargeCurrency: 'PHP',
      isPaymentAuthorityPreserved: true,
    };
  }
}

// ============================================================================
// 6. GENERATED COMMUNICATIONS FRAMEWORK & INJECTION SAFETY
// ============================================================================

export type GeneratedCommunicationChannel = 'EMAIL' | 'IN_APP' | 'PUSH' | 'SMS' | 'DOCUMENT';

export interface GeneratedCommunicationRecipient {
  readonly userId?: string;
  readonly name: string;
  readonly email?: string;
  readonly phoneNumber?: string;
  readonly accountPreferredLocale?: string;
  readonly guestPreferredLocale?: string;
}

export interface GeneratedCommunicationPayload {
  readonly channel: GeneratedCommunicationChannel;
  readonly templateKey: string;
  readonly recipient: GeneratedCommunicationRecipient;
  readonly variables: Record<string, string | number>;
  readonly clientRequestedLocale?: string;
  readonly clientRequestedMode?: string;
}

export interface RenderedCommunicationResult {
  readonly channel: GeneratedCommunicationChannel;
  readonly effectiveLocale: string;
  readonly subject?: string;
  readonly body: string;
  readonly isFallbackApplied: boolean;
  readonly isClientInjectionBlocked: boolean;
}

/**
 * Escapes HTML characters to prevent XSS / script injection in generated templates.
 */
export function escapeTemplateHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class GeneratedCommunicationEngine {
  /**
   * Resolves the authoritative locale for a generated communication:
   * 1. Account preference (for authenticated users).
   * 2. Guest preference cookie (for verified guest sessions).
   * 3. Fallback platform default (en-PH).
   * Rejects unverified client-side locale injection or unauthorized mode injection.
   */
  public static resolveLocale(
    recipient: GeneratedCommunicationRecipient,
    runtimeMode: 'PRODUCTION' | 'CONTROLLED_QA' = 'PRODUCTION'
  ): { effectiveLocale: string; isFallbackApplied: boolean; injectionBlocked: boolean } {
    const registry = getDefaultLocaleRegistry();
    const candidate = recipient.accountPreferredLocale || recipient.guestPreferredLocale;

    if (!candidate) {
      return { effectiveLocale: 'en-PH', isFallbackApplied: true, injectionBlocked: false };
    }

    const loc = registry.get(candidate);
    if (!loc) {
      // Invalid BCP-47 tag or un-registered locale
      return { effectiveLocale: 'en-PH', isFallbackApplied: true, injectionBlocked: true };
    }

    if (runtimeMode === 'PRODUCTION') {
      if (loc.enabled && loc.releaseStatus === 'PRODUCTION_READY') {
        return { effectiveLocale: loc.tag, isFallbackApplied: false, injectionBlocked: false };
      }
      // QA_REQUIRED or REGISTERED locales are blocked in production
      return { effectiveLocale: 'en-PH', isFallbackApplied: true, injectionBlocked: true };
    }

    // Controlled QA mode allows QA_REQUIRED (fil-PH)
    if (loc.enabled && (loc.releaseStatus === 'PRODUCTION_READY' || loc.releaseStatus === 'QA_REQUIRED')) {
      return { effectiveLocale: loc.tag, isFallbackApplied: false, injectionBlocked: false };
    }

    return { effectiveLocale: 'en-PH', isFallbackApplied: true, injectionBlocked: true };
  }

  /**
   * Safely interpolates placeholders into template with HTML injection escaping.
   */
  public static interpolateSafe(
    template: string,
    variables: Record<string, string | number>
  ): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      if (variables[key] === undefined) return `{${key}}`;
      const val = String(variables[key]);
      return escapeTemplateHtml(val);
    });
  }
}

// ============================================================================
// 7. USER-GENERATED CONTENT (UGC) BOUNDARY
// ============================================================================

export interface UserGeneratedContentItem {
  readonly id: string;
  readonly entityType: 'LISTING' | 'REVIEW' | 'CHAT_MESSAGE';
  readonly authorId: string;
  readonly originalContent: string;
  readonly originalLanguageHint?: string;
  readonly createdAt: string;
}

export class UgcBoundaryGuard {
  /**
   * Preserves user-generated content verbatim, preventing the UI localization
   * engine from mutating or substituting original user listing/chat/review text.
   */
  public static renderUgcPreserved(item: UserGeneratedContentItem, activeLocale?: string): string {
    void activeLocale;
    // UGC is ALWAYS returned verbatim as the immutable original text
    return item.originalContent;
  }
}
