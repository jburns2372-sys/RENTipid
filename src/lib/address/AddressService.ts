import { AddressProvider, NormalizedAddress } from './types';
import { GoogleAddressProvider } from './providers/google';
import { normalizeAddress } from './normalizer';
import { ProfileFieldProtection, ProfileFieldContext } from '@/lib/security/crypto/profile-field-protection';
import { MockAddressProvider } from './providers/mock';

export class AddressService {
  private static provider: AddressProvider = process.env.ADDRESS_PROVIDER === 'MOCK_E2E' 
    ? new MockAddressProvider() 
    : new GoogleAddressProvider();

  static async searchAutocomplete(input: string, countryCode?: string, sessionToken?: string) {
    if (!input) return { status: 'NO_RESULTS', suggestions: [] };
    const ctx: Record<string, string> = {};
    if (countryCode) ctx.countryCode = countryCode;
    if (sessionToken) ctx.sessionToken = sessionToken;
    try {
      const result = await this.provider.autocomplete(input, ctx);
      return result;
    } catch {
      console.error('Address autocomplete failed');
      return { status: 'PROVIDER_UNAVAILABLE', suggestions: [] };
    }
  }

  static async getDetails(placeId: string, sessionToken?: string) {
    const ctx: Record<string, string> = {};
    if (sessionToken) ctx.sessionToken = sessionToken;
    try {
      const address = await this.provider.getDetails(placeId, ctx);
      return { status: 'SUCCESS', details: normalizeAddress(address) };
    } catch (err: unknown) {
      console.error('Address details failed');
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      if (['NO_RESULTS', 'RATE_LIMITED', 'INVALID_PROVIDER_REQUEST', 'PROVIDER_CONFIGURATION_MISSING', 'PROVIDER_UNAVAILABLE'].includes(errorMessage)) {
        return { status: errorMessage, details: null };
      }
      
      return { status: 'PROVIDER_UNAVAILABLE', details: null };
    }
  }

  static readNormalizedAddress(address: Record<string, unknown> | null): NormalizedAddress | null {
    if (!address) return null;
    
    const readField = (encryptedValue: string | null | undefined, context: ProfileFieldContext) => {
      if (!encryptedValue) return null;
      try {
        return ProfileFieldProtection.read(encryptedValue, null, context).value;
      } catch {
        return null; // Silent fail on decryption to prevent crash, returns null for tampered
      }
    };

    const latitudeStr = readField(address.latitude_encrypted as string | null, ProfileFieldContext.ADDRESS_LATITUDE);
    const longitudeStr = readField(address.longitude_encrypted as string | null, ProfileFieldContext.ADDRESS_LONGITUDE);
    const lat = latitudeStr ? parseFloat(latitudeStr) : null;
    const lng = longitudeStr ? parseFloat(longitudeStr) : null;

    return {
      addressLine1: readField(address.addressLine1_encrypted as string | null, ProfileFieldContext.ADDRESS_LINE_1),
      addressLine2: readField(address.addressLine2_encrypted as string | null, ProfileFieldContext.ADDRESS_LINE_2),
      sublocality: readField(address.sublocality_encrypted as string | null, ProfileFieldContext.ADDRESS_SUBLOCALITY),
      locality: readField(address.locality_encrypted as string | null, ProfileFieldContext.ADDRESS_LOCALITY),
      administrativeArea2: readField(address.administrativeArea2_encrypted as string | null, ProfileFieldContext.ADDRESS_ADMIN_AREA_2),
      administrativeArea1: readField(address.administrativeArea1_encrypted as string | null, ProfileFieldContext.ADDRESS_ADMIN_AREA_1),
      postalCode: readField(address.postalCode_encrypted as string | null, ProfileFieldContext.ADDRESS_POSTAL_CODE),
      countryCode: address.countryCode as string | null,
      formattedAddress: readField(address.formattedAddress_encrypted as string | null, ProfileFieldContext.ADDRESS_FORMATTED),
      latitude: (lat !== null && !isNaN(lat)) ? lat : null,
      longitude: (lng !== null && !isNaN(lng)) ? lng : null,
      provider: address.provider as string,
      providerPlaceId: address.providerPlaceId as string | null,
      validationStatus: address.validationStatus as string,
      validationLevel: address.validationLevel as string | null,
      manuallyEdited: address.manuallyEdited as boolean,
      regionPsgcCode: typeof address.regionPsgcCode === 'string' ? address.regionPsgcCode : null,
      provincePsgcCode: typeof address.provincePsgcCode === 'string' ? address.provincePsgcCode : null,
      localityPsgcCode: typeof address.localityPsgcCode === 'string' ? address.localityPsgcCode : null,
      sublocalityPsgcCode: typeof address.sublocalityPsgcCode === 'string' ? address.sublocalityPsgcCode : null,
    } as NormalizedAddress;
  }
}
