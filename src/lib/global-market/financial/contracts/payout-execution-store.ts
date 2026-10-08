import type { PayoutInstructionRecord } from './payout-record';
import type { CreatePayoutOutput } from './payout-provider';

export interface PayoutWebhookResult {
  readonly success: boolean;
  readonly isDuplicateReplay?: boolean;
  readonly outOfOrderIgnored?: boolean;
  readonly payoutInstruction?: PayoutInstructionRecord;
  readonly error?: string;
}
/** Persistence only; payout eligibility and state decisions belong to RENTipid. */
export interface PayoutExecutionStore {
  runCreate(bookingId: string, key: string, fingerprint: string, execute: () => Promise<CreatePayoutOutput>): Promise<CreatePayoutOutput>;
  getOperationByReference(reference: string): CreatePayoutOutput | null;
  getById(id: string): PayoutInstructionRecord | null;
  getByKey(key: string): PayoutInstructionRecord | null;
  getByReference(reference: string): PayoutInstructionRecord | null;
  getByBooking(bookingId: string, fingerprint?: string): PayoutInstructionRecord | null;
  attach(record: PayoutInstructionRecord, fingerprint: string): PayoutInstructionRecord;
  replace(record: PayoutInstructionRecord, expected: PayoutInstructionRecord): void;
  applyWebhook(reference: string, eventKey: string, fingerprint: string,
    decide: (record: PayoutInstructionRecord) => PayoutWebhookResult): PayoutWebhookResult;
}
