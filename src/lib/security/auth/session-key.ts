import { createHash } from 'node:crypto';

export function isTrustedSessionIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 32;
}

export function hashSessionIdentifier(sessionId: string): string {
  return createHash('sha256').update(sessionId, 'utf8').digest('hex');
}
