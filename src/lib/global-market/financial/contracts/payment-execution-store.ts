import type { PaymentAttemptRecord } from './payment-record';

export interface StoredWebhookResult {
  readonly success: boolean;
  readonly isDuplicateReplay?: boolean;
  readonly outOfOrderIgnored?: boolean;
  readonly paymentAttempt?: PaymentAttemptRecord;
  readonly error?: string;
}

/** Storage primitives only. Marketplace state decisions remain in the orchestrator. */
export interface PaymentExecutionStore {
  runOperation<T>(key: string, fingerprint: string, execute: () => Promise<T>): Promise<T>;
  getOperationByReference<T>(reference: string): T | null;
  getAttemptById(id: string): PaymentAttemptRecord | null;
  getAttemptByIdempotency(key: string, fingerprint?: string): PaymentAttemptRecord | null;
  getAttemptByReference(reference: string): PaymentAttemptRecord | null;
  attachAttempt(record: PaymentAttemptRecord, fingerprint: string): PaymentAttemptRecord;
  replaceAttempt(record: PaymentAttemptRecord, expected: PaymentAttemptRecord): PaymentAttemptRecord;
  applyWebhook(reference: string, eventKey: string, fingerprint: string,
    decide: (record: PaymentAttemptRecord) => StoredWebhookResult): StoredWebhookResult;
}
