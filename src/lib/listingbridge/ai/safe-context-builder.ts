import type { ListingBridgeReviewSnapshot } from '../review/types';
import type { ListingBridgeSafeAiContext } from './types';

export class ListingBridgeSafeAiContextBuilder {
  private static readonly PROHIBITED_FIELD_PATTERNS = [
    /secret/i,
    /token/i,
    /key/i,
    /password/i,
    /auth/i,
    /cookie/i,
    /credential/i,
    /guest/i,
    /payment/i,
    /card/i,
    /bank/i,
    /rating/i,
    /ranking/i,
    /review/i,
    /badge/i,
    /superhost/i,
  ];

  /**
   * Builds a strictly sanitized, safe AI context from a review snapshot.
   * Prohibited data (secrets, guest PII, payment info, third-party badges/ratings) is completely stripped.
   * External source snippets are explicitly delimited as untrusted data to prevent prompt-injection attacks.
   */
  static buildSafeContext(snapshot: ListingBridgeReviewSnapshot): ListingBridgeSafeAiContext {
    // 1. Filter and sanitize fields
    const safeFields = snapshot.fields
      .filter((field) => {
        // Exclude prohibited confidence states
        if (field.confidenceState === 'PROHIBITED') return false;

        // Exclude fields matching prohibited patterns
        const isProhibited = this.PROHIBITED_FIELD_PATTERNS.some((pattern) =>
          pattern.test(field.fieldName),
        );
        return !isProhibited;
      })
      .map((field) => ({
        fieldName: field.fieldName,
        displayName: field.displayName,
        normalizedValue: this.sanitizeValue(field.normalizedValue),
        confidenceState: field.confidenceState,
        isRequired: field.isRequired,
        isBlocking: field.isBlocking,
      }));

    // 2. Map unresolved items
    const unresolvedItems = snapshot.unresolvedItems.map((item) => ({
      fieldName: item.fieldName,
      reasonCode: item.reasonCode,
      severity: item.severity,
    }));

    // 3. Location summary
    const locationSummary = {
      locality: snapshot.location.normalizedAddress?.locality || undefined,
      administrativeArea1: snapshot.location.normalizedAddress?.administrativeArea1 || undefined,
      isWithinPhilippineBounds: snapshot.location.isWithinPhilippineBounds,
      hasConflicts: snapshot.location.conflicts.length > 0,
    };

    // 4. Media summary
    const mediaSummary = {
      validatedCount: snapshot.media.validatedCount,
      hasCoverPhoto: snapshot.media.hasCoverPhoto,
    };

    // 5. Duplicate summary
    const duplicateSummary = {
      isBlocking: snapshot.duplicate.isBlocking,
      requiresReview: snapshot.duplicate.requiresReview,
    };

    // 6. Untrusted source snippets, delimited with explicit data tags
    const untrustedSourceSnippets = safeFields
      .filter((f) => typeof f.normalizedValue === 'string')
      .map((f) => ({
        field: f.fieldName,
        content: `<untrusted_source_data field="${f.fieldName}">\n${String(f.normalizedValue).slice(0, 1000)}\n</untrusted_source_data>`,
      }));

    return Object.freeze({
      importJobId: snapshot.importJobId,
      providerId: snapshot.providerId,
      isRightsConfirmed: snapshot.rights.rightsConfirmed,
      fields: Object.freeze(safeFields),
      unresolvedItems: Object.freeze(unresolvedItems),
      locationSummary: Object.freeze(locationSummary),
      mediaSummary: Object.freeze(mediaSummary),
      duplicateSummary: Object.freeze(duplicateSummary),
      untrustedSourceSnippets: Object.freeze(untrustedSourceSnippets),
    });
  }

  private static sanitizeValue(value: unknown): unknown {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item));
    }
    if (typeof value === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (!this.PROHIBITED_FIELD_PATTERNS.some((pattern) => pattern.test(k))) {
          sanitized[k] = this.sanitizeValue(v);
        }
      }
      return sanitized;
    }
    return String(value);
  }
}
