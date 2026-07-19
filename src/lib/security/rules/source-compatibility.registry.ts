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
  }
};
