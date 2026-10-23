/**
 * RENTipid GLCC v1.1 — Legal Source Registry & Validator
 *
 * Implements authoritative source registration and governance validation
 * for Class C legal and compliance documents.
 */

import { createHash } from 'crypto';
import {
  LegalSourceRecord,
  LegalSourceValidationResult,
} from './legal-control-schema';

/**
 * Calculates SHA-256 hash of legal document content.
 */
export function calculateLegalContentChecksum(content: string): string {
  return createHash('sha256').update(content ?? '').digest('hex');
}

/**
 * Validates an authoritative LegalSourceRecord against repository governance standards.
 */
export function validateLegalSourceRecord(
  record: LegalSourceRecord,
  existingRecords: LegalSourceRecord[] = []
): LegalSourceValidationResult {
  const errors: string[] = [];

  if (!record || typeof record !== 'object') {
    return { isValid: false, errorCount: 1, errors: ['Legal source record is null or malformed.'] };
  }

  // 1. Mandatory identification fields
  if (!record.sourceId || record.sourceId.trim() === '') {
    errors.push('Missing required sourceId.');
  }

  if (!record.sourceVersion || record.sourceVersion.trim() === '') {
    errors.push('Missing required sourceVersion.');
  }

  if (!record.sourceChecksum || record.sourceChecksum.trim() === '') {
    errors.push('Missing required sourceChecksum.');
  }

  if (!record.content || record.content.trim() === '') {
    errors.push('Missing required content string.');
  }

  // 2. Checksum integrity
  if (record.content && record.sourceChecksum) {
    const computedChecksum = calculateLegalContentChecksum(record.content);
    if (computedChecksum !== record.sourceChecksum) {
      errors.push(
        `CHECKSUM_MISMATCH: Computed content checksum "${computedChecksum.slice(0, 16)}..." does not match sourceChecksum "${record.sourceChecksum.slice(0, 16)}...".`
      );
    }
  }

  // 3. Authoritative state & references
  if (record.isAuthoritative !== true) {
    errors.push('Authoritative legal source record must have isAuthoritative: true.');
  }

  if (!record.approvalAuthority || record.approvalAuthority.trim() === '') {
    errors.push('Missing required approvalAuthority reference.');
  }

  if (!record.retentionReference || record.retentionReference.trim() === '') {
    errors.push('Missing required retentionReference.');
  }

  // 4. Effective Date & Expiry Ordering
  if (!record.effectiveDate || isNaN(Date.parse(record.effectiveDate))) {
    errors.push('Invalid or missing effectiveDate format (must be ISO 8601 string).');
  }

  if (record.expiryDate) {
    if (isNaN(Date.parse(record.expiryDate))) {
      errors.push('Invalid expiryDate format.');
    } else if (new Date(record.effectiveDate) > new Date(record.expiryDate)) {
      errors.push(
        `DATE_ORDER_VIOLATION: effectiveDate "${record.effectiveDate}" is after expiryDate "${record.expiryDate}".`
      );
    }
  }

  // 5. Jurisdictions check
  if (!Array.isArray(record.jurisdictions) || record.jurisdictions.length === 0) {
    errors.push('Missing required jurisdictions array.');
  } else {
    for (const j of record.jurisdictions) {
      if (!/^[A-Z]{2,3}$|^GLOBAL$/.test(j)) {
        errors.push(`Invalid jurisdiction format "${j}". Must be ISO alpha-2/3 or GLOBAL.`);
      }
    }
  }

  // 6. Duplicate Active Source/Version conflict check
  const duplicate = existingRecords.find(
    (r) =>
      r.sourceId === record.sourceId &&
      r.sourceVersion === record.sourceVersion &&
      r.status === 'ACTIVE' &&
      record.status === 'ACTIVE'
  );
  if (duplicate) {
    errors.push(
      `DUPLICATE_ACTIVE_CONFLICT: An active record for sourceId "${record.sourceId}" version "${record.sourceVersion}" already exists.`
    );
  }

  // 7. Supersession check
  if (record.supersedesSourceId === record.sourceId) {
    errors.push(`INVALID_SUPERSESSION: A source record cannot supersede itself.`);
  }

  return {
    isValid: errors.length === 0,
    errorCount: errors.length,
    errors,
  };
}

/**
 * In-memory Legal Source Registry for governed lookups and validation.
 */
export class LegalSourceRegistry {
  private sources: Map<string, LegalSourceRecord> = new Map();

  public register(record: LegalSourceRecord): void {
    const existing = Array.from(this.sources.values());
    const validation = validateLegalSourceRecord(record, existing);
    if (!validation.isValid) {
      throw new Error(`LEGAL_SOURCE_REGISTRATION_FAILED: ${validation.errors.join('; ')}`);
    }
    const key = `${record.sourceId}@${record.sourceVersion}`;
    this.sources.set(key, record);
  }

  public get(sourceId: string, version?: string): LegalSourceRecord | null {
    if (version) {
      return this.sources.get(`${sourceId}@${version}`) ?? null;
    }
    // Return latest active version for sourceId
    const matching = Array.from(this.sources.values()).filter(
      (s) => s.sourceId === sourceId && s.status === 'ACTIVE'
    );
    if (matching.length === 0) return null;
    matching.sort((a, b) => b.sourceVersion.localeCompare(a.sourceVersion, undefined, { numeric: true }));
    return matching[0];
  }

  public listActive(): LegalSourceRecord[] {
    return Array.from(this.sources.values()).filter((s) => s.status === 'ACTIVE');
  }

  public getAll(): LegalSourceRecord[] {
    return Array.from(this.sources.values());
  }
}
