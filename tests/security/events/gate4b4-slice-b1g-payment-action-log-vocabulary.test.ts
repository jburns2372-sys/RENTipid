import { validatePaymentVocabulary } from '@/lib/payments/payment-action-log-writer';

describe('GATE4B4_SLICE_B1G: PaymentActionLog Vocabulary', () => {
  it('1. SYSTEM, MISMATCH_DETECTED, PAYMENT_AMOUNT_MISMATCH, PAYMENT_RECONCILIATION are accepted', () => {
    expect(() => validatePaymentVocabulary('PAYMENT_AMOUNT_MISMATCH', 'SYSTEM', 'MISMATCH_DETECTED', 'PAYMENT_RECONCILIATION')).not.toThrow();
  });

  it('2. Existing values remain accepted', () => {
    expect(() => validatePaymentVocabulary('PAYMENT_INITIALIZED', 'RENTER', 'SUCCESS', 'CHECKOUT_INITIALIZATION')).not.toThrow();
    expect(() => validatePaymentVocabulary('PAYMENT_FREEZE_BLOCKED', 'RENTER', 'DENIED', 'CHECKOUT_INITIALIZATION')).not.toThrow();
  });

  it('3. Unknown values remain rejected', () => {
    expect(() => validatePaymentVocabulary('UNKNOWN_CODE', 'SYSTEM', 'MISMATCH_DETECTED', 'PAYMENT_RECONCILIATION')).toThrow(/VOCABULARY_VIOLATION/);
    expect(() => validatePaymentVocabulary('PAYMENT_AMOUNT_MISMATCH', 'UNKNOWN_ACTOR', 'MISMATCH_DETECTED', 'PAYMENT_RECONCILIATION')).toThrow(/VOCABULARY_VIOLATION/);
    expect(() => validatePaymentVocabulary('PAYMENT_AMOUNT_MISMATCH', 'SYSTEM', 'UNKNOWN_OUTCOME', 'PAYMENT_RECONCILIATION')).toThrow(/VOCABULARY_VIOLATION/);
    expect(() => validatePaymentVocabulary('PAYMENT_AMOUNT_MISMATCH', 'SYSTEM', 'MISMATCH_DETECTED', 'UNKNOWN_WORKFLOW')).toThrow(/VOCABULARY_VIOLATION/);
  });
});
