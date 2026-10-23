import { NormalizedAddress } from './types';

export function normalizeAddress(input: Partial<NormalizedAddress>): NormalizedAddress {
  const finalLat = typeof input.latitude === 'number' ? input.latitude : null;
  const finalLng = typeof input.longitude === 'number' ? input.longitude : null;

  if (finalLat !== null && (!Number.isFinite(finalLat) || finalLat < -90 || finalLat > 90)) {
    throw new Error('Invalid coordinates: latitude must be between -90 and 90');
  }
  if (finalLng !== null && (!Number.isFinite(finalLng) || finalLng < -180 || finalLng > 180)) {
    throw new Error('Invalid coordinates: longitude must be between -180 and 180');
  }

  return {
    addressLine1: input.addressLine1 || null,
    addressLine2: input.addressLine2 || null,
    sublocality: input.sublocality || null,
    locality: input.locality || null,
    administrativeArea2: input.administrativeArea2 || null,
    administrativeArea1: input.administrativeArea1 || null,
    postalCode: input.postalCode || null,
    countryCode: input.countryCode || null,
    formattedAddress: input.formattedAddress || null,
    latitude: finalLat,
    longitude: finalLng,
    provider: input.provider || 'MANUAL',
    providerPlaceId: input.providerPlaceId || null,
    validationStatus: input.validationStatus || 'UNVERIFIED',
    validationLevel: input.validationLevel || null,
    manuallyEdited: input.manuallyEdited ?? true,
    validatedAt: input.validatedAt || null,
  };
}

export function isAddressEmpty(address: Partial<NormalizedAddress>): boolean {
  return !address.addressLine1 && !address.locality && !address.administrativeArea1 && !address.countryCode;
}

export function validateAddressCompleteness(address: NormalizedAddress): boolean {
  // A basic global address needs at least a country and addressLine1
  if (!address.countryCode || !address.addressLine1) {
    return false;
  }
  return true;
}
