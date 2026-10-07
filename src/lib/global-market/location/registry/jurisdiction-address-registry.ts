/**
 * RENTipid GLOBAL-MKT / v2.0 — Jurisdiction Address Profile Registry
 *
 * Implements authoritative AddressProfiles for all 46 registered countries.
 * Integrates Philippine PSGC hierarchy while supporting international address schemas.
 * References the GLCC country catalog directly without duplicate country definitions.
 */

import { GLOBAL_COUNTRY_CATALOG } from '@/lib/glcc/country/country-registry';
import { getJurisdictionProfile } from '@/lib/global-market/registry/market-capability-registry';
import { type AddressProfile, type AddressFieldKey } from '../contracts/address-profile';

const STANDARD_REQUIRED_FIELDS: readonly AddressFieldKey[] = Object.freeze([
  'addressLine1',
  'locality',
  'administrativeAreaLevel1',
  'postalCode',
]);

const STANDARD_OPTIONAL_FIELDS: readonly AddressFieldKey[] = Object.freeze([
  'addressLine2',
  'administrativeAreaLevel2',
  'sublocality',
  'district',
  'coordinates',
]);

function buildAuthoritativeAddressProfiles(): ReadonlyMap<string, AddressProfile> {
  const map = new Map<string, AddressProfile>();

  for (const country of GLOBAL_COUNTRY_CATALOG) {
    const code = country.code;
    const name = country.name;

    let profile: AddressProfile;

    if (code === 'PH') {
      // Philippines — Active PSGC Support
      profile = {
        countryCode: 'PH',
        countryName: name,
        requiredFields: ['addressLine1', 'locality', 'administrativeAreaLevel1', 'postalCode'],
        optionalFields: ['addressLine2', 'sublocality', 'coordinates'],
        postalCodeRequired: true,
        postalCodeFormat: '^\\d{4}$',
        administrativeArea1Label: 'Province / Region',
        localityLabel: 'City / Municipality',
        sublocalityLabel: 'Barangay',
        coordinatesRequired: false,
        psgcSupported: true,
        status: 'READY',
        knownLimitations: ['PSGC hierarchy authoritative for domestic validation'],
      };
    } else if (code === 'TH') {
      // Thailand — Changwat / Amphoe / Tambon
      profile = {
        countryCode: 'TH',
        countryName: name,
        requiredFields: ['addressLine1', 'locality', 'administrativeAreaLevel1', 'postalCode'],
        optionalFields: ['addressLine2', 'sublocality', 'coordinates'],
        postalCodeRequired: true,
        postalCodeFormat: '^\\d{5}$',
        administrativeArea1Label: 'Province (Changwat)',
        localityLabel: 'District (Amphoe)',
        sublocalityLabel: 'Sub-district (Tambon)',
        coordinatesRequired: false,
        psgcSupported: false,
        status: 'READY',
        knownLimitations: ['Thai postal code is 5 digits'],
      };
    } else if (code === 'CN') {
      // China — Province / City / District
      profile = {
        countryCode: 'CN',
        countryName: name,
        requiredFields: ['addressLine1', 'locality', 'administrativeAreaLevel1', 'postalCode'],
        optionalFields: ['addressLine2', 'sublocality', 'district', 'coordinates'],
        postalCodeRequired: true,
        postalCodeFormat: '^\\d{6}$',
        administrativeArea1Label: 'Province / Municipality',
        localityLabel: 'City / Prefecture',
        sublocalityLabel: 'District / County',
        coordinatesRequired: false,
        psgcSupported: false,
        status: 'READY',
        knownLimitations: ['China postal code is 6 digits; domestic coordinate datum GCJ-02 may apply in future'],
      };
    } else if (code === 'US') {
      // United States — State / City / ZIP
      profile = {
        countryCode: 'US',
        countryName: name,
        requiredFields: ['addressLine1', 'locality', 'administrativeAreaLevel1', 'postalCode'],
        optionalFields: ['addressLine2', 'coordinates'],
        postalCodeRequired: true,
        postalCodeFormat: '^\\d{5}(-\\d{4})?$',
        administrativeArea1Label: 'State',
        localityLabel: 'City',
        coordinatesRequired: false,
        psgcSupported: false,
        status: 'READY',
        knownLimitations: ['ZIP code 5 digits or ZIP+4'],
      };
    } else if (code === 'JP') {
      // Japan — Prefecture / City / Chome
      profile = {
        countryCode: 'JP',
        countryName: name,
        requiredFields: ['addressLine1', 'locality', 'administrativeAreaLevel1', 'postalCode'],
        optionalFields: ['addressLine2', 'sublocality', 'district', 'coordinates'],
        postalCodeRequired: true,
        postalCodeFormat: '^\\d{3}-?\\d{4}$',
        administrativeArea1Label: 'Prefecture (Ken/To/Do/Fu)',
        localityLabel: 'City / Ward (Shi/Ku)',
        sublocalityLabel: 'Town / Village (Machi/Mura)',
        coordinatesRequired: false,
        psgcSupported: false,
        status: 'READY',
        knownLimitations: ['Postal code is 7 digits with optional hyphen'],
      };
    } else if (code === 'SG') {
      // Singapore — City-State
      profile = {
        countryCode: 'SG',
        countryName: name,
        requiredFields: ['addressLine1', 'postalCode'],
        optionalFields: ['addressLine2', 'locality', 'administrativeAreaLevel1', 'coordinates'],
        postalCodeRequired: true,
        postalCodeFormat: '^\\d{6}$',
        administrativeArea1Label: 'Region',
        localityLabel: 'Singapore',
        coordinatesRequired: false,
        psgcSupported: false,
        status: 'READY',
        knownLimitations: ['Building-specific 6-digit postal code system'],
      };
    } else {
      // Standard International Profile for remaining 40 jurisdictions (EU, Direct Compliance)
      profile = {
        countryCode: code,
        countryName: name,
        requiredFields: STANDARD_REQUIRED_FIELDS,
        optionalFields: STANDARD_OPTIONAL_FIELDS,
        postalCodeRequired: true,
        administrativeArea1Label: 'State / Province / Region',
        localityLabel: 'City / Municipality',
        sublocalityLabel: 'District / Suburb',
        coordinatesRequired: false,
        psgcSupported: false,
        status: 'READY',
        knownLimitations: ['Standard universal postal address validation baseline'],
      };
    }

    map.set(code, Object.freeze(profile));
  }

  return map;
}

const AUTHORITATIVE_ADDRESS_PROFILES: ReadonlyMap<string, AddressProfile> = buildAuthoritativeAddressProfiles();

/**
 * Resolves the AddressProfile for a jurisdiction.
 * Returns null (fail closed) for unknown or invalid countries.
 */
export function getJurisdictionAddressProfile(countryInput: string | null | undefined): AddressProfile | null {
  if (!countryInput || typeof countryInput !== 'string') return null;
  const upper = countryInput.trim().toUpperCase();

  // Validate against GM-1 baseline first
  if (!getJurisdictionProfile(upper)) {
    return null;
  }

  return AUTHORITATIVE_ADDRESS_PROFILES.get(upper) || null;
}

/**
 * Returns all 46 authoritative jurisdiction AddressProfiles.
 */
export function getAllJurisdictionAddressProfiles(): readonly AddressProfile[] {
  return Array.from(AUTHORITATIVE_ADDRESS_PROFILES.values());
}

/**
 * Returns the count of authoritative AddressProfiles (exactly 46).
 */
export function getAuthoritativeAddressProfileCount(): number {
  return AUTHORITATIVE_ADDRESS_PROFILES.size;
}

/**
 * Checks whether an AddressProfile is registered for the specified jurisdiction.
 */
export function isAddressProfileSupported(countryInput: string | null | undefined): boolean {
  return getJurisdictionAddressProfile(countryInput) !== null;
}

