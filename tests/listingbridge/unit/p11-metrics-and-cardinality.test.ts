import { ListingBridgeMetricsCollector } from '../../../src/lib/listingbridge/observability/metrics';

describe('ListingBridge P11: Metrics Collection & Safe Cardinality Boundaries', () => {
  const metrics = ListingBridgeMetricsCollector.getInstance();

  beforeEach(() => {
    metrics.reset();
  });

  it('Increments metric counters with bounded safe dimensions', () => {
    metrics.increment('listingbridge_import_started_total', {
      environment: 'test',
      connectorId: 'url-connector',
      resultClass: 'SUCCESS',
      stage: 'FETCHING',
    });

    metrics.increment('listingbridge_import_started_total', {
      environment: 'test',
      connectorId: 'url-connector',
      resultClass: 'SUCCESS',
      stage: 'FETCHING',
    });

    const value = metrics.getMetricValue('listingbridge_import_started_total', {
      environment: 'test',
      connectorId: 'url-connector',
      resultClass: 'SUCCESS',
      stage: 'FETCHING',
    });

    expect(value).toBe(2);
  });

  it('Strictly sanitizes dimension keys to prevent cardinality explosions and URL/PII leaks', () => {
    // Attempting to pass dirty high-cardinality parameters
    metrics.increment('listingbridge_ssrf_block_total', {
      environment: 'test',
      connectorId: 'airbnb.com?token=secret123&user=alice',
      resultClass: 'BLOCKED',
      stage: 'RETRIEVAL',
      failureCategory: 'PRIVATE_IP_BLOCKED',
    });

    const snapshot = metrics.getSnapshot();
    const metricKeys = Object.keys(snapshot);

    expect(metricKeys.length).toBe(1);
    const key = metricKeys[0];

    // Verify special characters and query strings are stripped from connector dimension
    expect(key).not.toContain('?token=secret123');
    expect(key).not.toContain('user=alice');
    expect(key).toContain('airbnbcomtokensecret123useralice');
  });

  it('Records draft creations and failure metrics accurately', () => {
    metrics.increment('listingbridge_draft_created_total', {
      environment: 'test',
      connectorId: 'manual',
      resultClass: 'SUCCESS',
    });

    metrics.increment('listingbridge_draft_creation_failure_total', {
      environment: 'test',
      connectorId: 'manual',
      resultClass: 'FAILURE',
      failureCategory: 'DATABASE_TIMEOUT',
    });

    expect(metrics.getMetricValue('listingbridge_draft_created_total', {
      environment: 'test',
      connectorId: 'manual',
      resultClass: 'SUCCESS',
    })).toBe(1);

    expect(metrics.getMetricValue('listingbridge_draft_creation_failure_total', {
      environment: 'test',
      connectorId: 'manual',
      resultClass: 'FAILURE',
      failureCategory: 'DATABASE_TIMEOUT',
    })).toBe(1);
  });
});
