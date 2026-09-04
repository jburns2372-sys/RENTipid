import type { ListingBridgeConnectorDescriptor } from './descriptor';
import { ListingBridgeExternalConnector, makeCanonicalMapper, type ExternalConnectorOptions } from './external-connector-base';

const assistedEnvironments = {
  LOCAL: { state: 'APPROVED' as const },
  TEST: { state: 'APPROVED' as const },
  PREVIEW: { state: 'APPROVED' as const },
  PRODUCTION: { state: 'APPROVED' as const },
};

function assistedDescriptor(input: { id: string; internalName: string; displayName: string; complianceReference: string }): ListingBridgeConnectorDescriptor {
  return {
    id: input.id, internalName: input.internalName, displayName: input.displayName, version: '1.1.0', tier: 'TIER_3_FILE', sourceMode: 'ASSISTED_IMPORT',
    authorization: { type: 'MANUAL_PROVIDER_INPUT', requiresProviderRightsConfirmation: true, serverSideOnly: false, credentialReferenceRequired: false },
    capabilities: ['LISTING_FACTS', 'MEDIA', 'STRUCTURED_FILE', 'ASSISTED_PROVIDER_DATA', 'PROVIDER_RIGHTS_CONFIRMATION'], environments: assistedEnvironments,
    featureStatus: 'ENABLED', featureControl: { requiredGlobalFlag: 'LISTINGBRIDGE_GLOBAL', requiredCapabilityFlags: ['LISTINGBRIDGE_FILE_IMPORT'] },
    compliance: { status: 'APPROVED', reference: input.complianceReference }, health: { state: 'HEALTHY', message: 'Local provider-input processing only; no external platform is contacted' },
    timeoutPolicy: { connectTimeoutMs: 1000, responseTimeoutMs: 10000, maxRedirects: 0, maxResponseBytes: 10 * 1024 * 1024 },
    retryPolicy: { maxAttempts: 1, baseDelayMs: 100, maxDelayMs: 100, retryableStatusCodes: [] }, ratePolicy: { policyRef: `${input.id}.local-input-policy`, maxRequestsPerMinute: 60, burstLimit: 5 }, enabled: true,
  };
}

const bookingMapper = makeCanonicalMapper({ connectorId: 'booking.com.assisted.v1', tier: 'TIER_3_FILE', authorizationMethod: 'MANUAL_PROVIDER_INPUT', propertyType: 'Accommodation' });
const agodaMapper = makeCanonicalMapper({ connectorId: 'agoda.assisted.v1', tier: 'TIER_3_FILE', authorizationMethod: 'MANUAL_PROVIDER_INPUT', propertyType: 'Accommodation' });
const airbnbMapper = makeCanonicalMapper({ connectorId: 'airbnb.assisted.v1', tier: 'TIER_3_FILE', authorizationMethod: 'MANUAL_PROVIDER_INPUT', propertyType: 'Accommodation' });
const facebookMapper = makeCanonicalMapper({ connectorId: 'facebook.marketplace.assisted.v1', tier: 'TIER_3_FILE', authorizationMethod: 'MANUAL_PROVIDER_INPUT', propertyType: 'Rental property' });
const externalMapper = makeCanonicalMapper({ connectorId: 'external.listing.assisted.v1', tier: 'TIER_3_FILE', authorizationMethod: 'MANUAL_PROVIDER_INPUT', propertyType: 'Rental property' });

export const AIRBNB_ASSISTED_CONNECTOR_ID = 'airbnb.assisted.v1';
export const BOOKING_COM_ASSISTED_CONNECTOR_ID = 'booking.com.assisted.v1';
export const AGODA_ASSISTED_CONNECTOR_ID = 'agoda.assisted.v1';
export const FACEBOOK_MARKETPLACE_CONNECTOR_ID = 'facebook.marketplace.assisted.v1';
export const EXTERNAL_LISTING_CONNECTOR_ID = 'external.listing.assisted.v1';

export const airbnbAssistedDescriptor = assistedDescriptor({ id: AIRBNB_ASSISTED_CONNECTOR_ID, internalName: 'Airbnb Provider-Assisted Import', displayName: 'Airbnb', complianceReference: 'AIRBNB_ASSISTED_ONLY' });
export const bookingComAssistedDescriptor = assistedDescriptor({ id: BOOKING_COM_ASSISTED_CONNECTOR_ID, internalName: 'Booking.com Provider-Assisted Import', displayName: 'Booking.com', complianceReference: 'BOOKING_ASSISTED_ONLY' });
export const agodaAssistedDescriptor = assistedDescriptor({ id: AGODA_ASSISTED_CONNECTOR_ID, internalName: 'Agoda Provider-Assisted Import', displayName: 'Agoda', complianceReference: 'AGODA_ASSISTED_ONLY' });
export const facebookMarketplaceDescriptor = assistedDescriptor({ id: FACEBOOK_MARKETPLACE_CONNECTOR_ID, internalName: 'Facebook Marketplace Provider-Assisted Import', displayName: 'Facebook Marketplace', complianceReference: 'FACEBOOK_NO_AUTOMATED_FETCH' });
export const externalListingDescriptor = assistedDescriptor({ id: EXTERNAL_LISTING_CONNECTOR_ID, internalName: 'Generic External Provider-Assisted Import', displayName: 'Other Listing Platform', complianceReference: 'GENERIC_ASSISTED_ONLY' });

function options(descriptor: ListingBridgeConnectorDescriptor, mapper: ExternalConnectorOptions['normalizePayload'], sourceReference: string, label: string, payload: Record<string, unknown>): ExternalConnectorOptions {
  return { descriptor, config: { id: descriptor.id, name: descriptor.displayName, tier: descriptor.tier, capabilities: { supportsMedia: true, supportsAvailability: false, supportsBatch: false, requiresAuthorization: true, authorizationType: 'MANUAL_PROVIDER_INPUT' }, timeoutPolicy: descriptor.timeoutPolicy, retryPolicy: descriptor.retryPolicy, featureStatus: descriptor.featureStatus, environmentStatus: 'TEST', complianceStatus: descriptor.compliance.status }, fixture: { sourceReference, sourceReferenceLabel: label, payload }, authorizationMessage: 'Provider-supplied input only; no third-party credentials or sessions are used', retrievalMode: 'ASSISTED', normalizePayload: mapper };
}

abstract class AssistedPlatformConnector extends ListingBridgeExternalConnector {
  protected constructor(optionsValue: ExternalConnectorOptions, private readonly platformHostnames: readonly string[]) { super(optionsValue); }
  override async identifySource(input: string | Uint8Array) {
    const value = typeof input === 'string' ? input : Buffer.from(input).toString('utf8');
    try { const url = new URL(value); const matched = url.protocol === 'https:' && this.platformHostnames.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`)); return Object.freeze({ matched, connectorId: this.config.id, confidence: matched ? 1 : 0, sourceReferenceHash: this.sourceReferenceHash(value) }); } catch { return Object.freeze({ matched: false, connectorId: this.config.id, confidence: 0, sourceReferenceHash: this.sourceReferenceHash(value) }); }
  }
}

export function isFacebookMarketplaceUrl(value: string): boolean {
  try { const url = new URL(value); return url.protocol === 'https:' && (url.hostname === 'facebook.com' || url.hostname.endsWith('.facebook.com')) && url.pathname.toLowerCase().startsWith('/marketplace/'); } catch { return false; }
}

export class AirbnbAssistedConnector extends AssistedPlatformConnector { constructor() { super(options(airbnbAssistedDescriptor, airbnbMapper, 'https://www.airbnb.com/rooms/provider-reference', 'Provider-supplied Airbnb reference', { title: 'Sample Bayview Stay', description: 'Fictitious provider-supplied property facts.', locationText: 'Cebu City, Cebu, Philippines', location: { city: 'Cebu City', province: 'Cebu' }, bedrooms: 2, maxGuests: 4, amenities: ['Wi-Fi', 'Air conditioning'] }), ['airbnb.com']); } }
export class BookingComAssistedConnector extends AssistedPlatformConnector { constructor() { super(options(bookingComAssistedDescriptor, bookingMapper, 'https://www.booking.com/hotel/provider-reference', 'Provider-supplied Booking.com reference', { title: 'Sample Bayview Stay', description: 'Fictitious provider-supplied property facts.', locationText: 'Cebu City, Cebu, Philippines', location: { city: 'Cebu City', province: 'Cebu' }, bedrooms: 2, maxGuests: 4, amenities: ['Wi-Fi', 'Air conditioning'] }), ['booking.com']); } }
export class AgodaAssistedConnector extends AssistedPlatformConnector { constructor() { super(options(agodaAssistedDescriptor, agodaMapper, 'https://www.agoda.com/provider-reference', 'Provider-supplied Agoda reference', { title: 'Sample Bayview Stay', description: 'Fictitious provider-supplied property facts.', locationText: 'Cebu City, Cebu, Philippines', location: { city: 'Cebu City', province: 'Cebu' }, bedrooms: 2, maxGuests: 4, amenities: ['Wi-Fi', 'Air conditioning'] }), ['agoda.com']); } }
export class FacebookMarketplaceAssistedConnector extends AssistedPlatformConnector { constructor() { super(options(facebookMarketplaceDescriptor, facebookMapper, 'https://www.facebook.com/marketplace/item/provider-reference', 'Provider-supplied Marketplace reference', { title: 'Sample Bayview Stay', description: 'Fictitious provider-supplied property facts.', locationText: 'Cebu City, Cebu, Philippines', location: { city: 'Cebu City', province: 'Cebu' }, bedrooms: 2, maxGuests: 4, amenities: ['Wi-Fi', 'Air conditioning'] }), ['facebook.com']); } }
export class ExternalListingAssistedConnector extends ListingBridgeExternalConnector { constructor() { super(options(externalListingDescriptor, externalMapper, 'https://provider-source.invalid/listing', 'Provider-supplied external listing reference', { title: 'Sample Bayview Stay', description: 'Fictitious provider-supplied property facts.', locationText: 'Cebu City, Cebu, Philippines', location: { city: 'Cebu City', province: 'Cebu' }, bedrooms: 2, maxGuests: 4, amenities: ['Wi-Fi', 'Air conditioning'] })); } }

export function createListingBridgePlatformConnectors() { return [{ connector: new AirbnbAssistedConnector(), descriptor: airbnbAssistedDescriptor }, { connector: new BookingComAssistedConnector(), descriptor: bookingComAssistedDescriptor }, { connector: new AgodaAssistedConnector(), descriptor: agodaAssistedDescriptor }, { connector: new FacebookMarketplaceAssistedConnector(), descriptor: facebookMarketplaceDescriptor }, { connector: new ExternalListingAssistedConnector(), descriptor: externalListingDescriptor }] as const; }
