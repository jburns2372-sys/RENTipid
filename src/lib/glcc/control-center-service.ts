/**
 * RENTipid GLCC v1.0 — Localization Control Center Service
 *
 * Work Package: GLCC-P10
 * Acceptance Targets: SEC-01, OPS-01, OPS-02
 *
 * Implements:
 * 1. Strict RBAC enforcement for operational controls and audit logging (SEC-01).
 * 2. Emergency kill switches for GLCC, FX provider, translations, and locales (OPS-01).
 * 3. Observability metrics evaluation and threshold alerts (OPS-02).
 * 4. Legal translation approval governance actions (TRN-03).
 */

import type {
  ControlCenterActor,
  ControlCenterConfig,
  ControlCenterAuditLogEntry,
  OperationalMetricsSnapshot,
  OperationalAlert,
  TelemetryThresholds,
} from './control-center-contracts';
import { globalLegalTranslationGate } from './legal-translation-gate';
import type { LegalApprovalRecord } from './dynamic-translation-contracts';

const DEFAULT_THRESHOLDS: TelemetryThresholds = {
  maxFxErrorRatePercent: 5.0,
  maxFxLatencyMs: 4000,
  maxTranslationErrorRatePercent: 5.0,
  maxConsecutiveSecurityBlocks: 10,
};

export class ControlCenterService {
  private config: ControlCenterConfig = {
    glccV1Enabled: true,
    currencyOverrideEnabled: true,
    countryAutodetectEnabled: true,
    fxDisplayEnabled: true,
    fxProviderEnabled: true,
    translationEnabled: true,
    disabledLocales: [],
  };

  private readonly auditLogs: ControlCenterAuditLogEntry[] = [];
  private readonly thresholds: TelemetryThresholds;

  constructor(customThresholds?: Partial<TelemetryThresholds>) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...customThresholds };
  }

  /**
   * Asserts actor possesses administrative privileges (SEC-01).
   */
  private assertAdminRole(actor: ControlCenterActor): void {
    const role = actor.role?.toLowerCase() || '';
    if (role !== 'superadmin' && role !== 'admin') {
      throw new Error(`403 Forbidden: Role '${actor.role}' is not authorized to modify GLCC operational settings.`);
    }
  }

  /**
   * Asserts actor possesses legal governance privileges (SEC-01, TRN-03).
   */
  private assertLegalRole(actor: ControlCenterActor): void {
    const role = actor.role?.toLowerCase() || '';
    if (role !== 'superadmin' && role !== 'admin' && role !== 'legalofficer' && role !== 'complianceofficer') {
      throw new Error(`403 Forbidden: Role '${actor.role}' is not authorized to govern legal translation approvals.`);
    }
  }

  /**
   * Retrieves current operational configuration.
   */
  public getConfig(): ControlCenterConfig {
    return Object.freeze({ ...this.config });
  }

  /**
   * Emergency Kill Switch / Feature Flag Update (OPS-01, SEC-01).
   */
  public updateSetting(
    actor: ControlCenterActor,
    key: keyof Omit<ControlCenterConfig, 'disabledLocales'>,
    newValue: boolean,
    reason: string,
  ): ControlCenterAuditLogEntry {
    this.assertAdminRole(actor);

    if (!reason || reason.trim().length < 5) {
      throw new Error('A documented reason of at least 5 characters is required for operational configuration changes.');
    }

    const previousValue = String(this.config[key]);
    this.config = {
      ...this.config,
      [key]: newValue,
    };

    const auditEntry: ControlCenterAuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
      actorId: actor.userId,
      actorRole: actor.role,
      action: 'UPDATE_SETTING',
      settingKey: key,
      previousValue,
      newValue: String(newValue),
      reason: reason.trim(),
      ipAddress: actor.ipAddress,
    };

    this.auditLogs.push(Object.freeze(auditEntry));
    return auditEntry;
  }

  /**
   * Locale Isolation Kill Switch: disable or re-enable a specific locale (OPS-01).
   */
  public setLocaleDisabled(
    actor: ControlCenterActor,
    locale: string,
    disabled: boolean,
    reason: string,
  ): ControlCenterAuditLogEntry {
    this.assertAdminRole(actor);

    const targetLocale = locale.trim();
    const currentList = new Set(this.config.disabledLocales);
    const wasDisabled = currentList.has(targetLocale);

    if (disabled) {
      currentList.add(targetLocale);
    } else {
      currentList.delete(targetLocale);
    }

    this.config = {
      ...this.config,
      disabledLocales: Array.from(currentList),
    };

    const auditEntry: ControlCenterAuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
      actorId: actor.userId,
      actorRole: actor.role,
      action: disabled ? 'DISABLE_LOCALE' : 'ENABLE_LOCALE',
      settingKey: `locale_${targetLocale}`,
      previousValue: String(wasDisabled),
      newValue: String(disabled),
      reason: reason.trim(),
      ipAddress: actor.ipAddress,
    };

    this.auditLogs.push(Object.freeze(auditEntry));
    return auditEntry;
  }

  /**
   * Checks whether a locale is currently operational or disabled.
   */
  public isLocaleActive(locale: string): boolean {
    if (!this.config.glccV1Enabled) return false;
    return !this.config.disabledLocales.includes(locale.trim());
  }

  /**
   * Governance Action: Register authorized legal translation approval (TRN-03, SEC-01).
   */
  public approveLegalTranslation(
    actor: ControlCenterActor,
    approval: LegalApprovalRecord,
    reason: string,
  ): ControlCenterAuditLogEntry {
    this.assertLegalRole(actor);

    globalLegalTranslationGate.registerApproval(approval);

    const auditEntry: ControlCenterAuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
      actorId: actor.userId,
      actorRole: actor.role,
      action: 'APPROVE_LEGAL_TRANSLATION',
      settingKey: `legal_${approval.documentType}_v${approval.sourceVersion}_${approval.targetLocale}`,
      previousValue: 'UNAPPROVED',
      newValue: 'APPROVED',
      reason: reason.trim(),
      ipAddress: actor.ipAddress,
    };

    this.auditLogs.push(Object.freeze(auditEntry));
    return auditEntry;
  }

  /**
   * Governance Action: Revoke legal translation approval (TRN-03, SEC-01).
   */
  public revokeLegalTranslation(
    actor: ControlCenterActor,
    documentType: string,
    sourceVersion: string,
    targetLocale: string,
    reason: string,
  ): ControlCenterAuditLogEntry {
    this.assertLegalRole(actor);

    globalLegalTranslationGate.revokeApproval(documentType, sourceVersion, targetLocale);

    const auditEntry: ControlCenterAuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
      actorId: actor.userId,
      actorRole: actor.role,
      action: 'REVOKE_LEGAL_TRANSLATION',
      settingKey: `legal_${documentType}_v${sourceVersion}_${targetLocale}`,
      previousValue: 'APPROVED',
      newValue: 'REVOKED',
      reason: reason.trim(),
      ipAddress: actor.ipAddress,
    };

    this.auditLogs.push(Object.freeze(auditEntry));
    return auditEntry;
  }

  /**
   * Evaluates operational telemetry metrics against alerting thresholds (OPS-02).
   */
  public evaluateTelemetry(snapshot: OperationalMetricsSnapshot): OperationalAlert[] {
    const alerts: OperationalAlert[] = [];

    // 1. FX Provider Error Rate Check
    if (snapshot.fxRequestCount > 0) {
      const fxErrorRate = (snapshot.fxErrorCount / snapshot.fxRequestCount) * 100;
      if (fxErrorRate > this.thresholds.maxFxErrorRatePercent) {
        alerts.push({
          alertId: `alert_fx_err_${Date.now()}`,
          severity: 'CRITICAL',
          metric: 'FX_ERROR_RATE',
          threshold: this.thresholds.maxFxErrorRatePercent,
          observedValue: parseFloat(fxErrorRate.toFixed(2)),
          message: `FX provider error rate (${fxErrorRate.toFixed(2)}%) breached threshold of ${this.thresholds.maxFxErrorRatePercent}%.`,
          triggeredAt: new Date().toISOString(),
        });
      }
    }

    // 2. FX Provider Latency Check
    if (snapshot.fxAverageLatencyMs > this.thresholds.maxFxLatencyMs) {
      alerts.push({
        alertId: `alert_fx_lat_${Date.now()}`,
        severity: 'WARNING',
        metric: 'FX_LATENCY',
        threshold: this.thresholds.maxFxLatencyMs,
        observedValue: snapshot.fxAverageLatencyMs,
        message: `FX provider average latency (${snapshot.fxAverageLatencyMs}ms) breached threshold of ${this.thresholds.maxFxLatencyMs}ms.`,
        triggeredAt: new Date().toISOString(),
      });
    }

    // 3. Translation Error Rate Check
    if (snapshot.translationRequestCount > 0) {
      const trnErrorRate = (snapshot.translationErrorCount / snapshot.translationRequestCount) * 100;
      if (trnErrorRate > this.thresholds.maxTranslationErrorRatePercent) {
        alerts.push({
          alertId: `alert_trn_err_${Date.now()}`,
          severity: 'CRITICAL',
          metric: 'TRANSLATION_ERROR_RATE',
          threshold: this.thresholds.maxTranslationErrorRatePercent,
          observedValue: parseFloat(trnErrorRate.toFixed(2)),
          message: `Translation error rate (${trnErrorRate.toFixed(2)}%) breached threshold of ${this.thresholds.maxTranslationErrorRatePercent}%.`,
          triggeredAt: new Date().toISOString(),
        });
      }
    }

    // 4. Consecutive Security Block Events
    if (snapshot.securityBlockCount > this.thresholds.maxConsecutiveSecurityBlocks) {
      alerts.push({
        alertId: `alert_sec_blk_${Date.now()}`,
        severity: 'CRITICAL',
        metric: 'SECURITY_BLOCKS',
        threshold: this.thresholds.maxConsecutiveSecurityBlocks,
        observedValue: snapshot.securityBlockCount,
        message: `High volume of security injection blocks detected (${snapshot.securityBlockCount} events).`,
        triggeredAt: new Date().toISOString(),
      });
    }

    return alerts;
  }

  /**
   * Retrieves audit logs for security review and compliance verification (SEC-01).
   */
  public getAuditLogs(): readonly ControlCenterAuditLogEntry[] {
    return Object.freeze([...this.auditLogs]);
  }
}

export const globalControlCenterService = new ControlCenterService();
