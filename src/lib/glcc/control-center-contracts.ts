/**
 * RENTipid GLCC v1.0 — Localization Control Center Contracts
 *
 * Work Package: GLCC-P10
 * Acceptance Targets: SEC-01, OPS-01, OPS-02
 *
 * Implements:
 * 1. Operational kill switch & feature configuration contracts (OPS-01).
 * 2. RBAC access control & immutable audit logging models (SEC-01).
 * 3. Observability, metrics tracking & alert evaluation contracts (OPS-02).
 * 4. Administrative legal translation governance actions (TRN-03).
 */

export interface ControlCenterActor {
  readonly userId: string;
  readonly role: 'SuperAdmin' | 'Admin' | 'ComplianceOfficer' | 'LegalOfficer' | string;
  readonly ipAddress?: string;
}

export interface ControlCenterConfig {
  readonly glccV1Enabled: boolean;
  readonly currencyOverrideEnabled: boolean;
  readonly countryAutodetectEnabled: boolean;
  readonly fxDisplayEnabled: boolean;
  readonly fxProviderEnabled: boolean;
  readonly translationEnabled: boolean;
  readonly disabledLocales: readonly string[];
}

export interface ControlCenterAuditLogEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly actorId: string;
  readonly actorRole: string;
  readonly action: string;
  readonly settingKey: string;
  readonly previousValue: string | null;
  readonly newValue: string;
  readonly reason: string;
  readonly ipAddress?: string;
}

export interface OperationalMetricsSnapshot {
  readonly fxRequestCount: number;
  readonly fxErrorCount: number;
  readonly fxOutlierCount: number;
  readonly fxAverageLatencyMs: number;
  readonly translationRequestCount: number;
  readonly translationErrorCount: number;
  readonly canonicalFallbackCount: number;
  readonly securityBlockCount: number;
  readonly timestamp: string;
}

export interface OperationalAlert {
  readonly alertId: string;
  readonly severity: 'WARNING' | 'CRITICAL';
  readonly metric: string;
  readonly threshold: number;
  readonly observedValue: number;
  readonly message: string;
  readonly triggeredAt: string;
}

export interface TelemetryThresholds {
  readonly maxFxErrorRatePercent: number; // default: 5.0%
  readonly maxFxLatencyMs: number; // default: 4000ms
  readonly maxTranslationErrorRatePercent: number; // default: 5.0%
  readonly maxConsecutiveSecurityBlocks: number; // default: 10
}
