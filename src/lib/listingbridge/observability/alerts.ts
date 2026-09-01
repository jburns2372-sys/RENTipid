export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ListingBridgeAlert {
  readonly alertId: string;
  readonly alertName: string;
  readonly severity: AlertSeverity;
  readonly description: string;
  readonly triggeredAt: string;
  readonly thresholdDetails: Readonly<Record<string, unknown>>;
  readonly recommendedAction: string;
}

export interface AlertNotificationSink {
  notify(alert: ListingBridgeAlert): Promise<void>;
}

export class ListingBridgeAlertEngine {
  private readonly sinks: AlertNotificationSink[] = [];

  registerSink(sink: AlertNotificationSink): void {
    this.sinks.push(sink);
  }

  evaluateAlertConditions(metrics: {
    failedImportsCount: number;
    completedImportsCount: number;
    ssrfBlocksCount: number;
    connectorErrorsCount: number;
    draftCreationFailuresCount: number;
  }): readonly ListingBridgeAlert[] {
    const alerts: ListingBridgeAlert[] = [];
    const timestamp = new Date().toISOString();

    // 1. Critical SSRF block spike
    if (metrics.ssrfBlocksCount >= 10) {
      alerts.push({
        alertId: 'LB_ALERT_SSRF_SPIKE',
        alertName: 'ListingBridge SSRF Security Block Spike',
        severity: 'CRITICAL',
        description: 'Excessive SSRF blocks detected on imported URLs or media endpoints.',
        triggeredAt: timestamp,
        thresholdDetails: { ssrfBlocksCount: metrics.ssrfBlocksCount, threshold: 10 },
        recommendedAction: 'Inspect recent import requests, verify source URLs, and consider enabling strict connector rate limiting.',
      });
    }

    // 2. High draft creation failure rate
    if (metrics.draftCreationFailuresCount >= 5) {
      alerts.push({
        alertId: 'LB_ALERT_DRAFT_CREATION_FAILURES',
        alertName: 'ListingBridge Native Draft Creation Failure Anomaly',
        severity: 'HIGH',
        description: 'Multiple validated imports failed to commit as native RENTipid draft listings.',
        triggeredAt: timestamp,
        thresholdDetails: { draftCreationFailuresCount: metrics.draftCreationFailuresCount, threshold: 5 },
        recommendedAction: 'Inspect native ListingService health, database constraints, and payload mapping exceptions.',
      });
    }

    // 3. Persistent connector error rate
    if (metrics.connectorErrorsCount >= 15) {
      alerts.push({
        alertId: 'LB_ALERT_CONNECTOR_OUTAGE',
        alertName: 'ListingBridge External Connector Outage Detected',
        severity: 'HIGH',
        description: 'Persistent failure communicating with one or more third-party connector APIs.',
        triggeredAt: timestamp,
        thresholdDetails: { connectorErrorsCount: metrics.connectorErrorsCount, threshold: 15 },
        recommendedAction: 'Check connector upstream status, expired tokens, or temporarily disable affected connector.',
      });
    }

    return Object.freeze(alerts);
  }

  async dispatchAlerts(alerts: readonly ListingBridgeAlert[]): Promise<void> {
    for (const alert of alerts) {
      for (const sink of this.sinks) {
        try {
          await sink.notify(alert);
        } catch (e) {
          console.error('[ListingBridge Alert Sink Failed]:', e);
        }
      }
    }
  }
}
