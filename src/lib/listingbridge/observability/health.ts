import { isListingBridgeEnabled } from '../connectors/feature-flags';
import {
  createListingBridgeConnectorRegistry,
  type ListingBridgeConnectorRegistry,
} from '../connectors/registry';
import {
  createListingBridgeTestConnector,
  testConnectorDescriptor,
} from '../connectors/test-connector';
import { ListingBridgeMetricsCollector } from './metrics';

export interface ListingBridgeHealthReport {
  readonly status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  readonly timestamp: string;
  readonly globalEnabled: boolean;
  readonly aiMappingEnabled: boolean;
  readonly mediaProcessingEnabled: boolean;
  readonly availableConnectorsCount: number;
  readonly connectorHealthSummary: Readonly<Record<string, { enabled: boolean; status: string }>>;
  readonly metricsSummary: {
    readonly importsStarted: number;
    readonly importsCompleted: number;
    readonly importsFailed: number;
    readonly ssrfBlocks: number;
    readonly draftCreations: number;
  };
}

export class ListingBridgeHealthDiagnosticsService {
  private readonly metrics = ListingBridgeMetricsCollector.getInstance();
  private readonly registry: ListingBridgeConnectorRegistry;

  constructor(registry?: ListingBridgeConnectorRegistry) {
    if (registry) {
      this.registry = registry;
    } else {
      const testConnector = createListingBridgeTestConnector();
      this.registry = createListingBridgeConnectorRegistry([
        { connector: testConnector, descriptor: testConnectorDescriptor },
      ]);
    }
  }

  getHealthReport(): ListingBridgeHealthReport {
    const globalEnabled = isListingBridgeEnabled();
    const aiMappingEnabled = process.env.LISTINGBRIDGE_AI_MAPPING !== 'false';
    const mediaProcessingEnabled = process.env.LISTINGBRIDGE_MEDIA_IMPORT !== 'false';

    const allConnectors = this.registry.listRegisteredConnectors();
    const connectorHealthSummary: Record<string, { enabled: boolean; status: string }> = {};

    for (const descriptor of allConnectors) {
      connectorHealthSummary[descriptor.id] = {
        enabled: descriptor.enabled,
        status: descriptor.enabled ? 'OPERATIONAL' : 'DISABLED',
      };
    }

    const availableConnectorsCount = allConnectors.filter((c) => c.enabled).length;

    const started = this.metrics.getMetricValue('listingbridge_import_started_total');
    const completed = this.metrics.getMetricValue('listingbridge_import_completed_total');
    const failed = this.metrics.getMetricValue('listingbridge_import_failed_total');
    const ssrf = this.metrics.getMetricValue('listingbridge_ssrf_block_total');
    const drafts = this.metrics.getMetricValue('listingbridge_draft_created_total');

    let status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' = 'HEALTHY';
    if (!globalEnabled) {
      status = 'UNAVAILABLE';
    } else if (failed > 0 && completed === 0 && started > 5) {
      status = 'DEGRADED';
    }

    return Object.freeze({
      status,
      timestamp: new Date().toISOString(),
      globalEnabled,
      aiMappingEnabled,
      mediaProcessingEnabled,
      availableConnectorsCount,
      connectorHealthSummary: Object.freeze(connectorHealthSummary),
      metricsSummary: Object.freeze({
        importsStarted: started,
        importsCompleted: completed,
        importsFailed: failed,
        ssrfBlocks: ssrf,
        draftCreations: drafts,
      }),
    });
  }
}
