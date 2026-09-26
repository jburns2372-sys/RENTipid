/**
 * RENTipid GLCC v1.0 — Legal & Regulated Content Translation Gate
 *
 * Work Package: GLCC-P7
 * Acceptance Target: TRN-03
 *
 * Implements:
 * 1. Mandatory version-linked legal approval for regulated documents (Rental Agreements, TOS, Privacy, Payment Disclosures).
 * 2. Strict prohibition of machine translation auto-publishing as approved legal content.
 * 3. Fail-closed fallback: missing legal approval serves canonical English (en-PH) with legal disclosure notice.
 * 4. Auditable approval record linking documentType, sourceVersion, targetLocale, and authorized approval actor.
 */

import type { LegalApprovalRecord } from './dynamic-translation-contracts';

export type LegalGateOutcome =
  | 'APPROVED_CANONICAL'
  | 'APPROVED_TRANSLATED_VERSION'
  | 'FALLBACK_TO_CANONICAL_EN'
  | 'BLOCKED_STRICT_REGULATORY_REQUIREMENT';

export interface LegalPublicationDecision {
  readonly outcome: LegalGateOutcome;
  readonly isPermittedToRender: boolean;
  readonly effectiveLocale: string;
  readonly isMachineTranslationBlocked: boolean;
  readonly requiresLegalNotice: boolean;
  readonly approvalRecord?: LegalApprovalRecord;
  readonly reason: string;
}

export class LegalTranslationGate {
  private readonly approvalRegistry: Map<string, LegalApprovalRecord> = new Map();

  private buildKey(documentType: string, sourceVersion: string, targetLocale: string): string {
    return `${documentType.toLowerCase().trim()}:${sourceVersion.trim()}:${targetLocale.toLowerCase().trim()}`;
  }

  /**
   * Registers an explicit legal approval for a translated document version.
   */
  public registerApproval(record: LegalApprovalRecord): void {
    if (!record.documentType || !record.sourceVersion || !record.targetLocale || !record.approvedByActorId) {
      throw new Error('Invalid legal approval record: missing mandatory audit fields');
    }
    const key = this.buildKey(record.documentType, record.sourceVersion, record.targetLocale);
    this.approvalRegistry.set(key, Object.freeze({ ...record }));
  }

  /**
   * Revokes an existing legal approval.
   */
  public revokeApproval(documentType: string, sourceVersion: string, targetLocale: string): boolean {
    const key = this.buildKey(documentType, sourceVersion, targetLocale);
    return this.approvalRegistry.delete(key);
  }

  /**
   * Evaluates whether a legal document can be published in the requested locale.
   */
  public evaluatePublication(params: {
    readonly documentType: string;
    readonly sourceVersion: string;
    readonly requestedLocale: string;
    readonly strictBlockOnMissing?: boolean;
  }): LegalPublicationDecision {
    const reqLocale = (params.requestedLocale || 'en-PH').trim().toLowerCase();

    // 1. Canonical Source Language (en-PH) is always legally authoritative
    if (reqLocale === 'en-ph' || reqLocale === 'en') {
      return {
        outcome: 'APPROVED_CANONICAL',
        isPermittedToRender: true,
        effectiveLocale: 'en-PH',
        isMachineTranslationBlocked: false,
        requiresLegalNotice: false,
        reason: 'Canonical source document is authoritative and published directly.',
      };
    }

    // 2. Check for explicit legal approval record
    const key = this.buildKey(params.documentType, params.sourceVersion, params.requestedLocale);
    const approval = this.approvalRegistry.get(key);

    if (approval && approval.status === 'APPROVED') {
      return {
        outcome: 'APPROVED_TRANSLATED_VERSION',
        isPermittedToRender: true,
        effectiveLocale: params.requestedLocale,
        isMachineTranslationBlocked: false,
        requiresLegalNotice: false,
        approvalRecord: approval,
        reason: `Explicit legal approval verified (Approved by ${approval.approvedByActorId} at ${approval.approvedAt}).`,
      };
    }

    // 3. Unapproved translation handling: machine translation is strictly BLOCKED from auto-publishing
    if (params.strictBlockOnMissing) {
      return {
        outcome: 'BLOCKED_STRICT_REGULATORY_REQUIREMENT',
        isPermittedToRender: false,
        effectiveLocale: 'en-PH',
        isMachineTranslationBlocked: true,
        requiresLegalNotice: true,
        reason: `Strict regulatory block: Document '${params.documentType}' (v${params.sourceVersion}) has no legal approval for locale '${params.requestedLocale}'.`,
      };
    }

    // Default approved fallback: Serve canonical English with localized legal disclosure notice
    return {
      outcome: 'FALLBACK_TO_CANONICAL_EN',
      isPermittedToRender: true,
      effectiveLocale: 'en-PH',
      isMachineTranslationBlocked: true,
      requiresLegalNotice: true,
      reason: `No legal translation approval for '${params.requestedLocale}'. Falling back safely to canonical English (en-PH). Machine translation auto-publish prohibited.`,
    };
  }

  public clear(): void {
    this.approvalRegistry.clear();
  }

  public size(): number {
    return this.approvalRegistry.size;
  }
}

// Shared singleton instance for server runtime
export const globalLegalTranslationGate = new LegalTranslationGate();
