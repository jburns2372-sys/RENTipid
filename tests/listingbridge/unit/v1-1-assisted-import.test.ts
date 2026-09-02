import {
  AgodaAssistedConnector,
  AirbnbAssistedConnector,
  BookingComAssistedConnector,
  FacebookMarketplaceAssistedConnector,
  ExternalListingAssistedConnector,
  createListingBridgePlatformConnectors,
} from '@/lib/listingbridge/connectors';
import type { ExternalConnectorInput } from '@/lib/listingbridge/connectors/external-connector-base';

const textInput = (data: string): ExternalConnectorInput => ({ type: 'PASTED_TEXT', data, sourceReference: 'https://provider.example/listing' });

describe('ListingBridge v1.1 provider-assisted imports', () => {
  it('registers exactly five assisted connectors with stable IDs', () => {
    const registrations = createListingBridgePlatformConnectors();
    expect(registrations.map(value => value.descriptor.id)).toEqual(['airbnb.assisted.v1', 'booking.com.assisted.v1', 'agoda.assisted.v1', 'facebook.marketplace.assisted.v1', 'external.listing.assisted.v1']);
    expect(registrations.every(value => value.descriptor.sourceMode === 'ASSISTED_IMPORT' && value.descriptor.enabled === false)).toBe(true);
  });

  it.each([
    [new AirbnbAssistedConnector(), 'https://www.airbnb.com/rooms/123'],
    [new BookingComAssistedConnector(), 'https://www.booking.com/hotel/123'],
    [new AgodaAssistedConnector(), 'https://www.agoda.com/hotel/123'],
    [new FacebookMarketplaceAssistedConnector(), 'https://www.facebook.com/marketplace/item/123'],
  ] as const)('identifies %s URLs without retrieving them', async (connector, url) => {
    expect((await connector.identifySource(url)).matched).toBe(true);
    await expect(connector.fetchListing(url)).rejects.toThrow('ASSISTED_IMPORT_REQUIRES_PROVIDER_DATA');
  });

  it('maps provider text through the canonical contract with provenance', async () => {
    const contract = await new BookingComAssistedConnector().ingestProviderInput(textInput('Sample Bayview Stay\n2 bedrooms\nWi-Fi'), 'provider-1');
    expect(contract.identity.providerId).toBe('provider-1');
    expect(contract.source.connectorId).toBe('booking.com.assisted.v1');
    expect(contract.provenance.rawPayloadHash).toHaveLength(64);
    expect(contract.property.title).toBe('Sample Bayview Stay');
  });

  it('accepts JSON and CSV while preserving missing facts as unresolved', async () => {
    const connector = new AgodaAssistedConnector();
    const json = await connector.ingestProviderInput({ ...textInput('{"title":"Stay","description":"Facts"}'), type: 'STRUCTURED_FILE', mimeType: 'application/json' }, 'provider-1');
    expect(json.property.title).toBe('Stay');
    const csv = await connector.ingestProviderInput({ ...textInput('title,description\nStay,Facts'), type: 'STRUCTURED_FILE', mimeType: 'text/csv' }, 'provider-1');
    expect(csv.property.title).toBe('Stay');
    const missing = await connector.ingestProviderInput(textInput('Stay'), 'provider-1');
    expect(missing.capacity.bathrooms).toBeUndefined();
  });

  it('rejects unsafe source references, script content, and XML external entities', async () => {
    const connector = new AirbnbAssistedConnector();
    await expect(connector.ingestProviderInput({ ...textInput('Facts'), sourceReference: 'https://user:password@example.com/listing' }, 'provider-1')).rejects.toThrow('SOURCE_REFERENCE_UNSAFE');
    const safe = await connector.ingestProviderInput(textInput('<script>ignore</script>Facts'), 'provider-1');
    expect(safe.property.description).toBe('Facts');
    await expect(connector.ingestProviderInput({ ...textInput('<!DOCTYPE x [<!ENTITY x SYSTEM "file:///secret">]><x>&x;</x>'), type: 'STRUCTURED_FILE', mimeType: 'application/xml' }, 'provider-1')).rejects.toThrow('XML_EXTERNAL_ENTITY_REJECTED');
  });

  it('makes Facebook and generic assisted connectors incapable of third-party fetch', async () => {
    await expect(new FacebookMarketplaceAssistedConnector().fetchListing('https://www.facebook.com/marketplace/item/123')).rejects.toThrow();
    await expect(new ExternalListingAssistedConnector().fetchListing('https://unknown.example/listing')).rejects.toThrow();
    expect((await new ExternalListingAssistedConnector().ingestProviderInput(textInput('Other platform facts'), 'provider-1')).source.connectorId).toBe('external.listing.assisted.v1');
  });
});
