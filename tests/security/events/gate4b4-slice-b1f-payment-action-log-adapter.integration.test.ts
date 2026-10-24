
import { PaymentActionLogAdapter } from '../../../src/lib/security/events/adapters/payment-action-log-adapter';
import { 
  SecurityLifecycle, 
  SecurityEnvironment, 
  SecurityEventSource, 
  SecurityDomain, 
  SecurityEventClassification, 
  SecuritySeverity 
} from '../../../src/lib/security/events/taxonomy';
import { pseudonymizeTelemetryContext } from '../../../src/lib/security/telemetry-hmac';

describe('GATE4B4_SLICE_B1F - PaymentActionLogAdapter Integration', () => {
  process.env.SECURITY_TELEMETRY_HMAC_KEY = 'test_mock_hmac_key_for_telemetry_123456';
  const adapter = new PaymentActionLogAdapter();
  
  const mockValidRecord = {
    id: 'act_123',
    action_code: 'PAYMENT_FREEZE_BLOCKED',
    actor_type: 'RENTER',
    outcome: 'DENIED',
    booking_id: 'book_abc',
    actor_user_id: 'user_xyz',
    source_operation_id: 'op_999',
    idempotency_key: 'idem_456',
    occurred_at: new Date(),
    gateway_transaction_id: null,
    source_workflow: 'CHECKOUT_INITIALIZATION',
    amount: null,
    currency: null,
    provider: null
  };

  it('declares the correct stable source type fallback (PAYMENT_ACTION_LOG)', () => {
    expect(adapter.sourceType).toBe(SecurityEventSource.PAYMENT_ACTION_LOG);
  });

  it('supports valid PaymentActionLog structures', () => {
    expect(adapter.supports(mockValidRecord)).toBe(true);
    
    const invalidRecord = { ...mockValidRecord };
    // @ts-ignore
    delete invalidRecord.action_code;
    expect(adapter.supports(invalidRecord)).toBe(false);
  });

  it('rejects unsupported PaymentActionLog rows safely', () => {
    const unsupportedRecord = { ...mockValidRecord, action_code: 'PAYMENT_INITIALIZED', outcome: 'SUCCESS' };
    expect(() => adapter.normalize(
      unsupportedRecord as any, 
      SecurityLifecycle.TEST, 
      SecurityEnvironment.TEST
    )).toThrow(/Unsupported PaymentActionLog for SecurityEvent adapter/);
  });

  it('normalizes PAYMENT_FREEZE_BLOCKED correctly', () => {
    const result = adapter.normalize(
      mockValidRecord as any,
      SecurityLifecycle.LIVE,
      SecurityEnvironment.PRODUCTION
    );

    expect(result.event_code).toBe('PAYMENT_FREEZE_BLOCKED');
    expect(result.source_type).toBe(SecurityEventSource.PAYMENT_ACTION_LOG);
    expect(result.source_record_id).toBe('act_123');
    expect(result.security_domain).toBe(SecurityDomain.PAYMENT_SECURITY);
    expect(result.event_classification).toBe(SecurityEventClassification.COUNTERMEASURE);
    expect(result.severity).toBe(SecuritySeverity.HIGH);
    expect(result.lifecycle_type).toBe(SecurityLifecycle.LIVE);
    expect(result.environment).toBe(SecurityEnvironment.PRODUCTION);
    
    expect(result.actor_user_id).toBeNull(); // Must not leak
    expect(result.target_user_id).toBeNull();
    
    expect(result.action_attempted).toBe('PAYMENT_FREEZE_BLOCKED');
    expect(result.action_result).toBe('DENIED');
  });

  it('pseudonymizes renter reference properly via telemetry hmac in source_summary', () => {
    const result = adapter.normalize(
      mockValidRecord as any,
      SecurityLifecycle.TEST,
      SecurityEnvironment.TEST
    );
    
    const summary = result.source_summary as any;
    expect(summary.account_reference_hash).toBeTruthy();
    expect(summary.account_reference_hash).not.toBe('user_xyz');
    expect(summary.account_reference_hash).toBe(pseudonymizeTelemetryContext('payment-actor', 'user_xyz'));
  });

  it('pseudonymizes booking reference properly via telemetry hmac in correlation_key', () => {
    const result = adapter.normalize(
      mockValidRecord as any,
      SecurityLifecycle.TEST,
      SecurityEnvironment.TEST
    );
    
    expect(result.correlation_key).toBeTruthy();
    expect(result.correlation_key).not.toBe('book_abc');
    expect(result.correlation_key).toBe(pseudonymizeTelemetryContext('booking-reference', 'book_abc'));
  });

  it('generates a stable idempotency key incorporating source_type, record id, event_code, and version', () => {
    const result = adapter.normalize(
      mockValidRecord as any,
      SecurityLifecycle.TEST,
      SecurityEnvironment.TEST
    );
    expect(result.idempotency_key).toBeDefined();
    expect(result.idempotency_key.length).toBe(64); // SHA-256 hex length
  });
});
