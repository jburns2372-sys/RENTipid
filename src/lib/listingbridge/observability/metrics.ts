export interface SafeMetricDimensions {
  readonly environment?: 'production' | 'preview' | 'development' | 'test';
  readonly connectorId?: string;
  readonly resultClass?: 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'WARNING' | 'RETRY';
  readonly stage?: string;
  readonly failureCategory?: string;
  readonly aiEnabled?: boolean;
}

export type ListingBridgeMetricName =
  | 'listingbridge_import_started_total'
  | 'listingbridge_import_completed_total'
  | 'listingbridge_import_failed_total'
  | 'listingbridge_connector_failure_total'
  | 'listingbridge_ssrf_block_total'
  | 'listingbridge_rate_limit_total'
  | 'listingbridge_media_failure_total'
  | 'listingbridge_duplicate_detected_total'
  | 'listingbridge_review_required_total'
  | 'listingbridge_ai_fallback_total'
  | 'listingbridge_draft_created_total'
  | 'listingbridge_draft_creation_failure_total';

export class ListingBridgeMetricsCollector {
  private static instance = new ListingBridgeMetricsCollector();
  private readonly metricStore = new Map<string, number>();

  static getInstance(): ListingBridgeMetricsCollector {
    return this.instance;
  }

  increment(metricName: ListingBridgeMetricName, dimensions?: SafeMetricDimensions, value: number = 1): void {
    const key = this.buildMetricKey(metricName, dimensions);
    const current = this.metricStore.get(key) || 0;
    this.metricStore.set(key, current + value);
  }

  getMetricValue(metricName: ListingBridgeMetricName, dimensions?: SafeMetricDimensions): number {
    const key = this.buildMetricKey(metricName, dimensions);
    return this.metricStore.get(key) || 0;
  }

  reset(): void {
    this.metricStore.clear();
  }

  getSnapshot(): Readonly<Record<string, number>> {
    const snapshot: Record<string, number> = {};
    for (const [k, v] of this.metricStore.entries()) {
      snapshot[k] = v;
    }
    return Object.freeze(snapshot);
  }

  private buildMetricKey(metricName: ListingBridgeMetricName, dimensions?: SafeMetricDimensions): string {
    if (!dimensions) return metricName;

    // Enforce strict dimension allowlist to prevent cardinality explosion and PII leakage
    const sanitizedDim = {
      env: dimensions.environment || process.env.NODE_ENV || 'development',
      connector: dimensions.connectorId ? dimensions.connectorId.replace(/[^a-zA-Z0-9_-]/g, '') : 'none',
      result: dimensions.resultClass || 'none',
      stage: dimensions.stage ? dimensions.stage.replace(/[^a-zA-Z0-9_-]/g, '') : 'none',
      cat: dimensions.failureCategory ? dimensions.failureCategory.replace(/[^a-zA-Z0-9_-]/g, '') : 'none',
      ai: dimensions.aiEnabled !== undefined ? String(dimensions.aiEnabled) : 'none',
    };

    return `${metricName}{env="${sanitizedDim.env}",connector="${sanitizedDim.connector}",result="${sanitizedDim.result}",stage="${sanitizedDim.stage}",cat="${sanitizedDim.cat}",ai="${sanitizedDim.ai}"}`;
  }
}
