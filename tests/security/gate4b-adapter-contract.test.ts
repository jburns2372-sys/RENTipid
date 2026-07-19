import { AuthenticationSecurityLogAdapter } from "../../src/lib/security/events/adapters/authentication-security-log-adapter";
import { SecurityEventSource, SecurityDomain, SecurityEventClassification, SecuritySeverity, SecurityEnvironment, SecurityLifecycle } from "../../src/lib/security/events/taxonomy";

describe("Adapter Contract", () => {
  const adapter = new AuthenticationSecurityLogAdapter();

  it("1. Normalizes AUTH_LOGIN_SUCCEEDED", () => {
    const occurred_at = new Date();
    const expires_at = new Date(occurred_at.getTime() + 180 * 24 * 60 * 60 * 1000);
    const result = adapter.normalize({
      id: "log_1",
      event_code: "AUTH_LOGIN_SUCCEEDED",
      outcome: "Success",
      actor_user_id: "u_1",
      subject_reference_hash: "hash_subj",
      ip_reference_hash: "hash_ip",
      device_reference_hash: "hash_dev",
      session_reference_hash: "hash_sess",
      hmac_key_version: "v1",
      environment: "production",
      lifecycle: "production",
      retention_class: "AUTH_ROUTINE_180_DAYS",
      expires_at,
      sanitized_metadata: '{"method":"credentials"}',
      occurred_at
    }, SecurityLifecycle.LIVE, SecurityEnvironment.PRODUCTION);

    expect(result.source_record_id).toBe("log_1");
    expect(result.source_type).toBe(SecurityEventSource.AUTHENTICATION_SECURITY_LOG);
    expect(result.event_code).toBe("AUTH_LOGIN_SUCCEEDED");
    expect(result.event_classification).toBe(SecurityEventClassification.OBSERVATION);
    expect(result.severity).toBe(SecuritySeverity.INFO);
    expect(result.actor_user_id).toBe("u_1");
    expect(result.correlation_key).toBe("hash_subj");
    expect(result.environment).toBe(SecurityEnvironment.PRODUCTION);
    expect(result.lifecycle_type).toBe(SecurityLifecycle.LIVE);
    expect(result.occurred_at).toBe(occurred_at);
    expect(result.adapter_version).toBe("1.0");
    expect(result.source_summary).toEqual({ method: "credentials" });
  });

  it("2. Normalizes AUTH_LOGIN_FAILED", () => {
    const occurred_at = new Date();
    const expires_at = new Date(occurred_at.getTime() + 180 * 24 * 60 * 60 * 1000);
    const result = adapter.normalize({
      id: "log_2",
      event_code: "AUTH_LOGIN_FAILED",
      outcome: "Failure",
      actor_user_id: null,
      subject_reference_hash: "hash_subj",
      ip_reference_hash: "hash_ip",
      device_reference_hash: "hash_dev",
      session_reference_hash: null,
      hmac_key_version: "v1",
      environment: "production",
      lifecycle: "production",
      retention_class: "AUTH_ROUTINE_180_DAYS",
      expires_at,
      sanitized_metadata: null,
      occurred_at
    }, SecurityLifecycle.LIVE, SecurityEnvironment.PRODUCTION);

    expect(result.event_code).toBe("AUTH_LOGIN_FAILED");
    expect(result.severity).toBe(SecuritySeverity.LOW);
    expect(result.actor_user_id).toBeNull();
  });

  it("3. Normalizes AUTH_ACCOUNT_STATUS_DENIED", () => {
    const occurred_at = new Date();
    const expires_at = new Date(occurred_at.getTime() + 180 * 24 * 60 * 60 * 1000);
    const result = adapter.normalize({
      id: "log_3",
      event_code: "AUTH_ACCOUNT_STATUS_DENIED",
      outcome: "Failure",
      actor_user_id: "u_banned",
      subject_reference_hash: "hash_subj",
      ip_reference_hash: "hash_ip",
      device_reference_hash: "hash_dev",
      session_reference_hash: null,
      hmac_key_version: "v1",
      environment: "production",
      lifecycle: "production",
      retention_class: "AUTH_ROUTINE_180_DAYS",
      expires_at,
      sanitized_metadata: null,
      occurred_at
    }, SecurityLifecycle.LIVE, SecurityEnvironment.PRODUCTION);

    expect(result.event_code).toBe("AUTH_ACCOUNT_STATUS_DENIED");
    expect(result.severity).toBe(SecuritySeverity.MEDIUM);
  });
});
