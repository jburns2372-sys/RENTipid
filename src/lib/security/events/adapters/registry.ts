import { SecurityEventSourceAdapter } from "../taxonomy";
import { AuditLogAdapter } from "./audit-log-adapter";
import { SystemErrorLogAdapter } from "./system-error-log-adapter";
import { AIBotLogAdapter } from "./ai-bot-log-adapter";
import { PaymentWebhookLogAdapter } from "./payment-webhook-log-adapter";
import { PaymentReconciliationLogAdapter } from "./payment-reconciliation-log-adapter";
import { VerificationDocumentAdapter } from "./verification-document-adapter";
import { DamageClaimAdapter, DisputeCaseAdapter, InspectionReportAdapter } from "./trust-safety-adapters";
import { SystemSettingAdapter } from "./system-setting-adapter";
import { AuthenticationSecurityLogAdapter } from "./authentication-security-log-adapter";

export const ADAPTER_REGISTRY: SecurityEventSourceAdapter<unknown>[] = [
  new AuthenticationSecurityLogAdapter(),
  new AuditLogAdapter(),
  new SystemErrorLogAdapter(),
  new AIBotLogAdapter(),
  new PaymentWebhookLogAdapter(),
  new PaymentReconciliationLogAdapter(),
  new VerificationDocumentAdapter(),
  new DamageClaimAdapter(),
  new DisputeCaseAdapter(),
  new InspectionReportAdapter(),
  new SystemSettingAdapter()
];

export function getAdapterForRecord(record: unknown): SecurityEventSourceAdapter<unknown> | null {
  for (const adapter of ADAPTER_REGISTRY) {
    if (adapter.supports(record)) {
      return adapter;
    }
  }
  return null;
}
