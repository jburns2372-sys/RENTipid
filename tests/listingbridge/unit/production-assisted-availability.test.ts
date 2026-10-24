import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  createListingBridgePlatformConnectors,
  AIRBNB_ASSISTED_CONNECTOR_ID,
  BOOKING_COM_ASSISTED_CONNECTOR_ID,
  AGODA_ASSISTED_CONNECTOR_ID,
  FACEBOOK_MARKETPLACE_CONNECTOR_ID,
  EXTERNAL_LISTING_CONNECTOR_ID,
} from '@/lib/listingbridge/connectors/platform-connectors';
import { ListingBridgeUiService } from '@/lib/listingbridge/ui/actions';

describe('ListingBridge v1.1 Production Assisted-Connector Availability & UI Uniformity', () => {
  const allConnectorIds = [
    AIRBNB_ASSISTED_CONNECTOR_ID,
    BOOKING_COM_ASSISTED_CONNECTOR_ID,
    AGODA_ASSISTED_CONNECTOR_ID,
    FACEBOOK_MARKETPLACE_CONNECTOR_ID,
    EXTERNAL_LISTING_CONNECTOR_ID,
  ];

  it('1. all five v1.1 assisted descriptors are APPROVED for PREVIEW and PRODUCTION environments', () => {
    const connectors = createListingBridgePlatformConnectors();
    expect(connectors).toHaveLength(5);

    for (const { descriptor } of connectors) {
      expect(descriptor.environments.PREVIEW.state).toBe('APPROVED');
      expect(descriptor.environments.PRODUCTION.state).toBe('APPROVED');
      expect(descriptor.environments.LOCAL.state).toBe('APPROVED');
      expect(descriptor.environments.TEST.state).toBe('APPROVED');
      expect(descriptor.featureStatus).toBe('ENABLED');
      expect(descriptor.enabled).toBe(true);
    }
  });

  it('2. all five connectors use MANUAL_PROVIDER_INPUT authorization without credential collection', () => {
    const connectors = createListingBridgePlatformConnectors();
    for (const { descriptor } of connectors) {
      expect(descriptor.authorization.type).toBe('MANUAL_PROVIDER_INPUT');
      expect(descriptor.authorization.requiresProviderRightsConfirmation).toBe(true);
      expect(descriptor.authorization.credentialReferenceRequired).toBe(false);
      expect(descriptor.authorization.serverSideOnly).toBe(false);
      expect(descriptor.tier).toBe('TIER_3_FILE');
      expect(descriptor.sourceMode).toBe('ASSISTED_IMPORT');
    }
  });

  it('3. getAvailableConnectors returns consistent retrievalMode = ASSISTED and AVAILABLE state in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      (process.env as any).NODE_ENV = 'production';
      const uiService = new ListingBridgeUiService();
      const res = await uiService.getAvailableConnectors();
      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();

      const assisted = res.data!.filter(c => allConnectorIds.includes(c.id));
      expect(assisted).toHaveLength(5);

      for (const connector of assisted) {
        expect(connector.retrievalMode).toBe('ASSISTED');
        expect(connector.automatedFetch).toBe(false);
        expect(connector.availabilityState).toBe('AVAILABLE');
        expect(connector.requiresAuth).toBe(true);
        expect(connector.tier).toBe('TIER_3_FILE');
      }

      // Verify Facebook has no divergent special-casing from the other four
      const fb = assisted.find(c => c.id === FACEBOOK_MARKETPLACE_CONNECTOR_ID);
      const airbnb = assisted.find(c => c.id === AIRBNB_ASSISTED_CONNECTOR_ID);
      expect(fb?.retrievalMode).toBe(airbnb?.retrievalMode);
      expect(fb?.availabilityState).toBe(airbnb?.availabilityState);
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
    }
  });

  it('4. draft/review safety is preserved across all connectors', () => {
    const connectors = createListingBridgePlatformConnectors();
    for (const { descriptor } of connectors) {
      expect(descriptor.capabilities).toContain('PROVIDER_RIGHTS_CONFIRMATION');
      expect(descriptor.capabilities).toContain('ASSISTED_PROVIDER_DATA');
      expect(descriptor.capabilities).toContain('LISTING_FACTS');
      expect(descriptor.compliance.status).toBe('APPROVED');
    }
  });
});
