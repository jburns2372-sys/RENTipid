/**
 * RENTipid GLCC v1.0 — Dynamic Content Translation Service & Invalidation Engine
 *
 * Work Package: GLCC-P7
 * Acceptance Targets: TRN-02, SEC-02
 *
 * Implements:
 * 1. Dynamic content translation with original-source retention.
 * 2. SHA-256 source hashing to detect source edits and immediately invalidate stale derivatives (TRN-02).
 * 3. Pre-flight secret sanitization and PII protection (SEC-02).
 * 4. Safe fallback to original source text on provider failure without throwing or corrupting entity data.
 * 5. Deterministic in-memory store for translation provenance records.
 */

import { createHash } from 'crypto';
import type {
  DynamicTranslationRecord,
  DynamicTranslationProvider,
  ContentClassification,
} from './dynamic-translation-contracts';
import { sanitizeForTranslation } from './translation-sanitizer';

/**
 * Computes deterministic SHA-256 digest of source text.
 */
export function computeSourceContentHash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

export interface GetDynamicTranslationInput {
  readonly entityType: string;
  readonly entityId: string;
  readonly field: string;
  readonly sourceText: string;
  readonly sourceLocale?: string;
  readonly targetLocale: string;
  readonly classification?: ContentClassification;
  readonly provider?: DynamicTranslationProvider;
}

export interface DynamicTranslationResult {
  readonly text: string;
  readonly sourceText: string;
  readonly isTranslated: boolean;
  readonly isFallbackToSource: boolean;
  readonly record?: DynamicTranslationRecord;
  readonly invalidationOccurred?: boolean;
}

/**
 * Deterministic Test Translation Provider for reproducible development & testing.
 */
export class DeterministicTranslationProvider implements DynamicTranslationProvider {
  public readonly providerId = 'deterministic_mock';
  public readonly providerName = 'RENTipid Deterministic Mock Translation Engine';

  private failMode = false;
  private readonly customDictionary: Map<string, string> = new Map();

  public setFailMode(fail: boolean): void {
    this.failMode = fail;
  }

  public setTranslation(key: string, translated: string): void {
    this.customDictionary.set(key, translated);
  }

  public async translate(input: { text: string; targetLocale: string }): Promise<{
    translatedText: string;
    modelVersion: string;
  }> {
    if (this.failMode) {
      throw new Error('Upstream translation provider unavailable (simulated fault)');
    }

    const dictMatch = this.customDictionary.get(input.text);
    if (dictMatch) {
      return { translatedText: dictMatch, modelVersion: 'v1.0.0-mock' };
    }

    // Default mock behavior: Prefix with [TL:<targetLocale>] for clean test assertion
    return {
      translatedText: `[TL:${input.targetLocale}] ${input.text}`,
      modelVersion: 'v1.0.0-mock',
    };
  }

  public async getHealth(): Promise<{ status: 'HEALTHY' | 'UNAVAILABLE'; providerId: string }> {
    return {
      status: this.failMode ? 'UNAVAILABLE' : 'HEALTHY',
      providerId: this.providerId,
    };
  }
}

export class DynamicTranslationService {
  private readonly store: Map<string, DynamicTranslationRecord> = new Map();
  private readonly defaultProvider: DynamicTranslationProvider;

  constructor(defaultProvider?: DynamicTranslationProvider) {
    this.defaultProvider = defaultProvider ?? new DeterministicTranslationProvider();
  }

  private buildKey(entityType: string, entityId: string, field: string, targetLocale: string): string {
    return `${entityType.toLowerCase()}:${entityId}:${field.toLowerCase()}:${targetLocale.toLowerCase()}`;
  }

  /**
   * Retrieves an existing valid translation, or translates and stores the result.
   * If source text has changed relative to stored sourceHash, invalidates the old record (TRN-02).
   */
  public async resolveTranslation(input: GetDynamicTranslationInput): Promise<DynamicTranslationResult> {
    const sourceLocale = (input.sourceLocale || 'en-PH').trim();
    const targetLocale = (input.targetLocale || 'en-PH').trim();
    const sourceText = input.sourceText;

    // 1. Identity case: source locale matches target locale -> return original text directly
    if (sourceLocale.toLowerCase() === targetLocale.toLowerCase()) {
      return {
        text: sourceText,
        sourceText,
        isTranslated: false,
        isFallbackToSource: false,
      };
    }

    const currentHash = computeSourceContentHash(sourceText);
    const key = this.buildKey(input.entityType, input.entityId, input.field, targetLocale);
    const existing = this.store.get(key);

    let invalidationOccurred = false;

    // 2. Cache Hit: Existing active record with identical source hash
    if (existing && existing.status === 'ACTIVE' && existing.sourceHash === currentHash) {
      return {
        text: existing.translatedText,
        sourceText,
        isTranslated: true,
        isFallbackToSource: false,
        record: existing,
        invalidationOccurred: false,
      };
    }

    // 3. Source Edit Detected: Stored hash does not match current source hash (TRN-02)
    if (existing && existing.sourceHash !== currentHash) {
      invalidationOccurred = true;
      const invalidatedRecord: DynamicTranslationRecord = {
        ...existing,
        status: 'INVALIDATED',
        updatedAt: new Date().toISOString(),
      };
      this.store.set(key, Object.freeze(invalidatedRecord));
    }

    // 4. Sanitize payload before sending to provider (SEC-02)
    const { sanitizedText } = sanitizeForTranslation(sourceText);
    const provider = input.provider ?? this.defaultProvider;

    try {
      const translated = await provider.translate({
        text: sanitizedText,
        sourceLocale,
        targetLocale,
        classification: input.classification ?? 'ORDINARY_DYNAMIC',
      });

      const nowIso = new Date().toISOString();
      const newRecord: DynamicTranslationRecord = {
        id: `dtr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        entityType: input.entityType,
        entityId: input.entityId,
        field: input.field,
        sourceLocale,
        targetLocale,
        sourceText,
        sourceHash: currentHash,
        translatedText: translated.translatedText,
        providerRef: provider.providerId,
        classification: input.classification ?? 'ORDINARY_DYNAMIC',
        status: 'ACTIVE',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      this.store.set(key, Object.freeze(newRecord));

      return {
        text: newRecord.translatedText,
        sourceText,
        isTranslated: true,
        isFallbackToSource: false,
        record: newRecord,
        invalidationOccurred,
      };
    } catch {
      // Safe fallback on provider error: serve authoritative source text without corrupting data
      return {
        text: sourceText,
        sourceText,
        isTranslated: false,
        isFallbackToSource: true,
        invalidationOccurred,
      };
    }
  }

  /**
   * Retrieves stored record for audit or inspectability.
   */
  public getRecord(entityType: string, entityId: string, field: string, targetLocale: string): DynamicTranslationRecord | null {
    const key = this.buildKey(entityType, entityId, field, targetLocale);
    return this.store.get(key) ?? null;
  }

  public clear(): void {
    this.store.clear();
  }

  public size(): number {
    return this.store.size;
  }
}

// Shared singleton instance for server runtime
export const globalDynamicTranslationService = new DynamicTranslationService();
