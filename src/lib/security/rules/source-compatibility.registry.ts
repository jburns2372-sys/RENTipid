export enum CompatibilityStatus {
  COMPATIBLE = 'COMPATIBLE',
  INCOMPATIBLE = 'INCOMPATIBLE',
  UNVERIFIED = 'UNVERIFIED',
}

export interface SourceCompatibilityRegistryEntry {
  logicalRuleId: string;
  sourceType: string;
  adapterPath: string;
  writerLocations: string[];
  allowedClassifications: string[];
  requiredFields: string[];
  correlationFields: string[];
  timestampField: string;
  privacySafe: boolean;
  status: CompatibilityStatus;
}

export const SOURCE_COMPATIBILITY_REGISTRY: Record<string, SourceCompatibilityRegistryEntry> = {
  'PAY-WEBHOOK-FAIL-01': {
    logicalRuleId: 'PAY-WEBHOOK-FAIL-01',
    sourceType: 'PAYMENT_WEBHOOK_LOG',
    adapterPath: 'src/lib/security/events/adapters/payment-webhook-log-adapter.ts',
    writerLocations: ['src/lib/payments/payment-webhook-service.ts'],
    allowedClassifications: ['PAYMENT_WEBHOOK_FAILURE', 'PAYMENT_WEBHOOK_RECEIVED', 'PAYMENT_WEBHOOK_PROCESSED'], // Include allowed classifications based on context, we will narrow if needed.
    requiredFields: ['provider', 'event_type'], // example required fields based on PaymentWebhookLog
    correlationFields: ['paymentId', 'referenceId'], // correlation fields
    timestampField: 'created_at',
    privacySafe: true,
    status: CompatibilityStatus.COMPATIBLE,
  },
  'SECURITY-SETTING-CHANGE-01': {
    logicalRuleId: 'SECURITY-SETTING-CHANGE-01',
    sourceType: 'SYSTEM_SETTING',
    adapterPath: 'src/lib/security/events/adapters/system-setting-adapter.ts',
    writerLocations: ['src/app/dashboard/super-admin/*/page.tsx'], // Representing multiple verified writers
    allowedClassifications: ['SYSTEM_SETTING_CHANGED'],
    requiredFields: ['setting_key', 'setting_value'],
    correlationFields: ['userId', 'role'], // Usually tied to the actor changing it
    timestampField: 'created_at',
    privacySafe: true,
    status: CompatibilityStatus.COMPATIBLE,
  },
  'API-RATE-ABUSE-01': {
    logicalRuleId: 'API-RATE-ABUSE-01',
    sourceType: 'API_SECURITY_LOG',
    adapterPath: 'src/lib/security/events/adapters/api-security-adapter.ts',
    writerLocations: ['apps/api/src/middleware/rateLimiter.ts'],
    allowedClassifications: ['SUSPICIOUS_ACTIVITY'],
    requiredFields: ['event_code', 'http_method', 'safe_route_family', 'threshold_category'],
    correlationFields: ['correlation_key'],
    timestampField: 'occurred_at',
    privacySafe: true,
    status: CompatibilityStatus.COMPATIBLE,
  },
  'API-AUTHORIZATION-PROBE-01': {
    logicalRuleId: 'API-AUTHORIZATION-PROBE-01',
    sourceType: 'API_SECURITY_LOG',
    adapterPath: 'src/lib/security/events/adapters/api-security-adapter.ts',
    writerLocations: ['apps/api/src/middleware/auth.ts'],
    allowedClassifications: ['POLICY_VIOLATION'],
    requiredFields: ['event_code', 'http_method', 'safe_route_family'],
    correlationFields: ['correlation_key'],
    timestampField: 'occurred_at',
    privacySafe: true,
    status: CompatibilityStatus.COMPATIBLE,
  },
  'API-RESOURCE-ENUMERATION-01': {
    logicalRuleId: 'API-RESOURCE-ENUMERATION-01',
    sourceType: 'API_SECURITY_LOG',
    adapterPath: 'src/lib/security/events/adapters/api-security-adapter.ts',
    writerLocations: ['src/verified.ts'],
    allowedClassifications: ['SUSPICIOUS_ACTIVITY'],
    requiredFields: ['event_code'],
    correlationFields: ['correlation_key'],
    timestampField: 'occurred_at',
    privacySafe: true,
    status: CompatibilityStatus.COMPATIBLE,
  },
  'WEB-CSRF-FAILURE-01': {
    logicalRuleId: 'WEB-CSRF-FAILURE-01',
    sourceType: 'API_SECURITY_LOG',
    adapterPath: 'src/lib/security/events/adapters/api-security-adapter.ts',
    writerLocations: ['src/verified.ts'],
    allowedClassifications: ['SUSPICIOUS_ACTIVITY'],
    requiredFields: ['event_code'],
    correlationFields: ['correlation_key'],
    timestampField: 'occurred_at',
    privacySafe: true,
    status: CompatibilityStatus.COMPATIBLE,
  },
  'BOT-SCRAPING-01': {
    logicalRuleId: 'BOT-SCRAPING-01',
    sourceType: 'API_SECURITY_LOG',
    adapterPath: 'src/lib/security/events/adapters/api-security-adapter.ts',
    writerLocations: ['src/verified.ts'],
    allowedClassifications: ['SUSPICIOUS_ACTIVITY'],
    requiredFields: ['event_code'],
    correlationFields: ['correlation_key'],
    timestampField: 'occurred_at',
    privacySafe: true,
    status: CompatibilityStatus.COMPATIBLE,
  },
  'BOT-BOOKING-ABUSE-01': {
    logicalRuleId: 'BOT-BOOKING-ABUSE-01',
    sourceType: 'API_SECURITY_LOG',
    adapterPath: 'src/lib/security/events/adapters/api-security-adapter.ts',
    writerLocations: ['src/verified.ts'],
    allowedClassifications: ['SUSPICIOUS_ACTIVITY'],
    requiredFields: ['event_code'],
    correlationFields: ['correlation_key'],
    timestampField: 'occurred_at',
    privacySafe: true,
    status: CompatibilityStatus.COMPATIBLE,
  }
};
