import { ListingBridgeHealthDiagnosticsService } from '../../../src/lib/listingbridge/observability/health';
import { ListingBridgeAlertEngine } from '../../../src/lib/listingbridge/observability/alerts';
import { ListingBridgeMetricsCollector } from '../../../src/lib/listingbridge/observability/metrics';

describe('ListingBridge P11: Health Diagnostics & Alert Conditions', () => {
  const healthService = new ListingBridgeHealthDiagnosticsService();
  const alertEngine = new ListingBridgeAlertEngine();
  const metrics = ListingBridgeMetricsCollector.getInstance();

  beforeEach(() => {
    metrics.reset();
  });

  it('Generates health diagnostic report with operational metrics and connector states', () => {
    const report = healthService.getHealthReport();

    expect(report.status).toBe('HEALTHY');
    expect(typeof report.globalEnabled).toBe('boolean');
    expect(typeof report.aiMappingEnabled).toBe('boolean');
    expect(typeof report.mediaProcessingEnabled).toBe('boolean');
    expect(report.availableConnectorsCount).toBeGreaterThanOrEqual(0);
    expect(report.metricsSummary).toBeDefined();
  });

  it('Triggers CRITICAL alert on SSRF security block spike (>= 10)', () => {
    const alerts = alertEngine.evaluateAlertConditions({
      failedImportsCount: 2,
      completedImportsCount: 5,
      ssrfBlocksCount: 12,
      connectorErrorsCount: 0,
      draftCreationFailuresCount: 0,
    });

    expect(alerts.length).toBe(1);
    expect(alerts[0]?.alertId).toBe('LB_ALERT_SSRF_SPIKE');
    expect(alerts[0]?.severity).toBe('CRITICAL');
  });

  it('Triggers HIGH alert on draft creation failure anomaly (>= 5)', () => {
    const alerts = alertEngine.evaluateAlertConditions({
      failedImportsCount: 6,
      completedImportsCount: 2,
      ssrfBlocksCount: 1,
      connectorErrorsCount: 0,
      draftCreationFailuresCount: 6,
    });

    expect(alerts.length).toBe(1);
    expect(alerts[0]?.alertId).toBe('LB_ALERT_DRAFT_CREATION_FAILURES');
    expect(alerts[0]?.severity).toBe('HIGH');
  });

  it('Triggers HIGH alert on external connector outage (>= 15)', () => {
    const alerts = alertEngine.evaluateAlertConditions({
      failedImportsCount: 16,
      completedImportsCount: 0,
      ssrfBlocksCount: 0,
      connectorErrorsCount: 18,
      draftCreationFailuresCount: 0,
    });

    expect(alerts.length).toBe(1);
    expect(alerts[0]?.alertId).toBe('LB_ALERT_CONNECTOR_OUTAGE');
    expect(alerts[0]?.severity).toBe('HIGH');
  });

  it('Does NOT trigger alerts on normal provider validation errors below threshold', () => {
    const alerts = alertEngine.evaluateAlertConditions({
      failedImportsCount: 1,
      completedImportsCount: 10,
      ssrfBlocksCount: 0,
      connectorErrorsCount: 2,
      draftCreationFailuresCount: 0,
    });

    expect(alerts.length).toBe(0);
  });
});
