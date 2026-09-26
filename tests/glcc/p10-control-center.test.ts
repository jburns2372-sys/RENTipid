/**
 * RENTipid GLCC v1.0 — Test Suite: GLCC-P10 Localization Control Center
 *
 * Work Package: GLCC-P10
 * Acceptance Targets: SEC-01, OPS-01, OPS-02, TRN-03, REG-01
 */

import { ControlCenterService } from '@/lib/glcc/control-center-service';
import { globalLegalTranslationGate } from '@/lib/glcc/legal-translation-gate';
import type {
  ControlCenterActor,
  OperationalMetricsSnapshot,
} from '@/lib/glcc/control-center-contracts';

describe('GLCC-P10: Localization Control Center (Admin, RBAC, Ops & Telemetry)', () => {
  const superAdminActor: ControlCenterActor = {
    userId: 'usr_super_01',
    role: 'SuperAdmin',
    ipAddress: '127.0.0.1',
  };

  const adminActor: ControlCenterActor = {
    userId: 'usr_admin_02',
    role: 'Admin',
    ipAddress: '192.168.1.10',
  };

  const legalOfficerActor: ControlCenterActor = {
    userId: 'usr_legal_03',
    role: 'LegalOfficer',
  };

  const renterActor: ControlCenterActor = {
    userId: 'usr_renter_04',
    role: 'Renter',
  };

  describe('SEC-01: Administrative RBAC & Audit Trail', () => {
    it('allows SuperAdmin and Admin to update operational configuration', () => {
      const service = new ControlCenterService();

      const log = service.updateSetting(
        superAdminActor,
        'currencyOverrideEnabled',
        false,
        'Temporary policy lock during system upgrade',
      );

      expect(service.getConfig().currencyOverrideEnabled).toBe(false);
      expect(log.actorId).toBe('usr_super_01');
      expect(log.settingKey).toBe('currencyOverrideEnabled');
      expect(log.previousValue).toBe('true');
      expect(log.newValue).toBe('false');
      expect(log.reason).toBe('Temporary policy lock during system upgrade');
    });

    it('rejects unauthorized roles with 403 Forbidden (SEC-01)', () => {
      const service = new ControlCenterService();

      expect(() => {
        service.updateSetting(
          renterActor,
          'fxDisplayEnabled',
          false,
          'Unauthorized attempt',
        );
      }).toThrow('403 Forbidden');
    });

    it('requires a valid reason of at least 5 characters for all operational changes', () => {
      const service = new ControlCenterService();

      expect(() => {
        service.updateSetting(adminActor, 'glccV1Enabled', false, 'no');
      }).toThrow('A documented reason of at least 5 characters is required');
    });

    it('maintains an immutable, chronological audit trail', () => {
      const service = new ControlCenterService();

      service.updateSetting(adminActor, 'fxProviderEnabled', false, 'Routine maintenance drill');
      service.setLocaleDisabled(adminActor, 'ja-JP', true, 'Isolate Japanese locale for quality review');

      const logs = service.getAuditLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].settingKey).toBe('fxProviderEnabled');
      expect(logs[1].settingKey).toBe('locale_ja-JP');
      expect(logs[1].action).toBe('DISABLE_LOCALE');
    });
  });

  describe('OPS-01: Operational Kill Switches & Fail-Closed Behavior', () => {
    it('isolates specific locales via setLocaleDisabled without affecting others', () => {
      const service = new ControlCenterService();

      expect(service.isLocaleActive('ja-JP')).toBe(true);
      expect(service.isLocaleActive('en-PH')).toBe(true);

      service.setLocaleDisabled(adminActor, 'ja-JP', true, 'Temporary locale suspension');

      expect(service.isLocaleActive('ja-JP')).toBe(false);
      expect(service.isLocaleActive('en-PH')).toBe(true);

      // Re-enabling restores active status
      service.setLocaleDisabled(adminActor, 'ja-JP', false, 'Re-activating Japanese locale');
      expect(service.isLocaleActive('ja-JP')).toBe(true);
    });

    it('reports all locales inactive when master kill switch is tripped', () => {
      const service = new ControlCenterService();

      service.updateSetting(superAdminActor, 'glccV1Enabled', false, 'Emergency system freeze');

      expect(service.isLocaleActive('en-PH')).toBe(false);
      expect(service.isLocaleActive('fil-PH')).toBe(false);
    });
  });

  describe('OPS-02: Observability & Telemetry Threshold Alerts', () => {
    it('emits CRITICAL alert when FX error rate breaches threshold', () => {
      const service = new ControlCenterService({ maxFxErrorRatePercent: 5.0 });

      const metrics: OperationalMetricsSnapshot = {
        fxRequestCount: 100,
        fxErrorCount: 8, // 8% error rate > 5% threshold
        fxOutlierCount: 1,
        fxAverageLatencyMs: 850,
        translationRequestCount: 50,
        translationErrorCount: 1,
        canonicalFallbackCount: 2,
        securityBlockCount: 0,
        timestamp: new Date().toISOString(),
      };

      const alerts = service.evaluateTelemetry(metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].metric).toBe('FX_ERROR_RATE');
      expect(alerts[0].severity).toBe('CRITICAL');
      expect(alerts[0].observedValue).toBe(8);
    });

    it('emits WARNING alert when FX provider latency breaches threshold', () => {
      const service = new ControlCenterService({ maxFxLatencyMs: 4000 });

      const metrics: OperationalMetricsSnapshot = {
        fxRequestCount: 50,
        fxErrorCount: 0,
        fxOutlierCount: 0,
        fxAverageLatencyMs: 4800, // > 4000ms
        translationRequestCount: 20,
        translationErrorCount: 0,
        canonicalFallbackCount: 0,
        securityBlockCount: 0,
        timestamp: new Date().toISOString(),
      };

      const alerts = service.evaluateTelemetry(metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].metric).toBe('FX_LATENCY');
      expect(alerts[0].severity).toBe('WARNING');
    });

    it('emits CRITICAL alert when translation error rate breaches threshold', () => {
      const service = new ControlCenterService({ maxTranslationErrorRatePercent: 5.0 });

      const metrics: OperationalMetricsSnapshot = {
        fxRequestCount: 50,
        fxErrorCount: 0,
        fxOutlierCount: 0,
        fxAverageLatencyMs: 500,
        translationRequestCount: 100,
        translationErrorCount: 10, // 10% > 5%
        canonicalFallbackCount: 10,
        securityBlockCount: 0,
        timestamp: new Date().toISOString(),
      };

      const alerts = service.evaluateTelemetry(metrics);

      expect(alerts.some((a) => a.metric === 'TRANSLATION_ERROR_RATE')).toBe(true);
    });

    it('emits CRITICAL alert when high volume of security blocks is detected', () => {
      const service = new ControlCenterService({ maxConsecutiveSecurityBlocks: 10 });

      const metrics: OperationalMetricsSnapshot = {
        fxRequestCount: 50,
        fxErrorCount: 0,
        fxOutlierCount: 0,
        fxAverageLatencyMs: 500,
        translationRequestCount: 100,
        translationErrorCount: 0,
        canonicalFallbackCount: 0,
        securityBlockCount: 18, // > 10
        timestamp: new Date().toISOString(),
      };

      const alerts = service.evaluateTelemetry(metrics);

      expect(alerts.some((a) => a.metric === 'SECURITY_BLOCKS')).toBe(true);
    });

    it('emits zero alerts when all operational metrics remain within thresholds', () => {
      const service = new ControlCenterService();

      const healthyMetrics: OperationalMetricsSnapshot = {
        fxRequestCount: 200,
        fxErrorCount: 2, // 1% < 5%
        fxOutlierCount: 0,
        fxAverageLatencyMs: 450,
        translationRequestCount: 150,
        translationErrorCount: 2, // 1.3% < 5%
        canonicalFallbackCount: 3,
        securityBlockCount: 1,
        timestamp: new Date().toISOString(),
      };

      const alerts = service.evaluateTelemetry(healthyMetrics);
      expect(alerts).toHaveLength(0);
    });
  });

  describe('TRN-03 & Legal Translation Approval Governance', () => {
    it('allows LegalOfficer to approve and register legal translations', () => {
      const service = new ControlCenterService();

      const log = service.approveLegalTranslation(
        legalOfficerActor,
        {
          documentType: 'privacy_policy_v2',
          sourceVersion: '2.0.0',
          targetLocale: 'fil-PH',
          approvedByActorId: 'usr_legal_03',
          approvedAt: '2026-09-26T12:00:00Z',
          legalApprovalHash: 'hash_privacy_v2',
          status: 'APPROVED',
        },
        'Verified translation matches legal terms',
      );

      expect(log.action).toBe('APPROVE_LEGAL_TRANSLATION');
      expect(log.actorRole).toBe('LegalOfficer');

      // Verify gate reflects approval
      const evalDecision = globalLegalTranslationGate.evaluatePublication({
        documentType: 'privacy_policy_v2',
        sourceVersion: '2.0.0',
        requestedLocale: 'fil-PH',
      });
      expect(evalDecision.outcome).toBe('APPROVED_TRANSLATED_VERSION');
    });

    it('allows LegalOfficer to revoke legal translation approvals', () => {
      const service = new ControlCenterService();

      service.revokeLegalTranslation(
        legalOfficerActor,
        'privacy_policy_v2',
        '2.0.0',
        'fil-PH',
        'Revoked due to upstream policy update',
      );

      const evalDecision = globalLegalTranslationGate.evaluatePublication({
        documentType: 'privacy_policy_v2',
        sourceVersion: '2.0.0',
        requestedLocale: 'fil-PH',
      });
      expect(evalDecision.outcome).toBe('FALLBACK_TO_CANONICAL_EN');
    });

    it('strictly denies non-legal actors from approving legal translations', () => {
      const service = new ControlCenterService();

      expect(() => {
        service.approveLegalTranslation(
          renterActor,
          {
            documentType: 'terms_of_service',
            sourceVersion: '1.0.0',
            targetLocale: 'es-ES',
            approvedByActorId: 'renter',
            approvedAt: '2026-09-26T12:00:00Z',
            legalApprovalHash: 'hash',
            status: 'APPROVED',
          },
          'Unauthorized',
        );
      }).toThrow('403 Forbidden');
    });
  });
});
