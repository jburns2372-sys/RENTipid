import { createHash } from 'crypto';
import { normalizeKnowledgeText, stableJson } from './normalizer';

export function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function hashNormalizedContent(value: string): string {
  return sha256(normalizeKnowledgeText(value));
}

export function hashStableObject(value: unknown): string {
  return sha256(stableJson(value));
}
