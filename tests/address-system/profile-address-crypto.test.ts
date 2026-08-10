import { AddressService } from '../../src/lib/address/AddressService';
import { ProfileFieldProtection, ProfileFieldContext } from '../../src/lib/security/crypto/profile-field-protection';

describe('Address Crypto Round-trip & Tamper Tests', () => {
  it('should encrypt and decrypt a full normalized address correctly', () => {
    // 1. Create a dummy encrypted address row as it would be saved in the database
    const protect = ProfileFieldProtection.protect;
    const dbAddress = {
      addressLine1_encrypted: protect('123 Main St', ProfileFieldContext.ADDRESS_LINE_1),
      addressLine2_encrypted: protect('Apt 4B', ProfileFieldContext.ADDRESS_LINE_2),
      sublocality_encrypted: protect('Downtown', ProfileFieldContext.ADDRESS_SUBLOCALITY),
      locality_encrypted: protect('Metropolis', ProfileFieldContext.ADDRESS_LOCALITY),
      administrativeArea2_encrypted: protect('Metro County', ProfileFieldContext.ADDRESS_ADMIN_AREA_2),
      administrativeArea1_encrypted: protect('NY', ProfileFieldContext.ADDRESS_ADMIN_AREA_1),
      postalCode_encrypted: protect('10001', ProfileFieldContext.ADDRESS_POSTAL_CODE),
      countryCode: 'US',
      formattedAddress_encrypted: protect('123 Main St, Apt 4B, Metropolis, NY 10001, US', ProfileFieldContext.ADDRESS_FORMATTED),
      latitude_encrypted: protect('40.7128', ProfileFieldContext.ADDRESS_LATITUDE),
      longitude_encrypted: protect('-74.0060', ProfileFieldContext.ADDRESS_LONGITUDE),
      provider: 'MANUAL',
      providerPlaceId: null,
      validationStatus: 'UNVERIFIED',
      validationLevel: null,
      manuallyEdited: true,
      validatedAt: null,
      regionPsgcCode: '1300000000',
      provincePsgcCode: null,
      localityPsgcCode: '1381300000',
      sublocalityPsgcCode: '1381300139',
    };

    const normalized = AddressService.readNormalizedAddress(dbAddress);
    expect(normalized).not.toBeNull();

    expect(normalized!.addressLine1).toBe('123 Main St');
    expect(normalized!.addressLine2).toBe('Apt 4B');
    expect(normalized!.sublocality).toBe('Downtown');
    expect(normalized!.locality).toBe('Metropolis');
    expect(normalized!.administrativeArea2).toBe('Metro County');
    expect(normalized!.administrativeArea1).toBe('NY');
    expect(normalized!.postalCode).toBe('10001');
    expect(normalized!.countryCode).toBe('US');
    expect(normalized!.formattedAddress).toBe('123 Main St, Apt 4B, Metropolis, NY 10001, US');
    expect(normalized!.latitude).toBe(40.7128);
    expect(normalized!.longitude).toBe(-74.0060);
    expect(normalized!.provider).toBe('MANUAL');
    expect(normalized!.regionPsgcCode).toBe('1300000000');
    expect(normalized!.provincePsgcCode).toBeNull();
    expect(normalized!.localityPsgcCode).toBe('1381300000');
    expect(normalized!.sublocalityPsgcCode).toBe('1381300139');
  });

  it('should survive coordinate 0,0 accurately', () => {
    const protect = ProfileFieldProtection.protect;
    const dbAddress = {
      addressLine1_encrypted: protect('Null Island', ProfileFieldContext.ADDRESS_LINE_1),
      countryCode: 'US',
      latitude_encrypted: protect('0', ProfileFieldContext.ADDRESS_LATITUDE),
      longitude_encrypted: protect('0', ProfileFieldContext.ADDRESS_LONGITUDE),
      provider: 'MANUAL',
      providerPlaceId: null,
      validationStatus: 'UNVERIFIED',
      validationLevel: null,
      manuallyEdited: true,
      validatedAt: null,
    };

    const normalized = AddressService.readNormalizedAddress(dbAddress);
    expect(normalized).not.toBeNull();
    expect(normalized!.latitude).toBe(0);
    expect(normalized!.longitude).toBe(0);
    expect(normalized!.regionPsgcCode).toBeNull();
    expect(normalized!.provincePsgcCode).toBeNull();
    expect(normalized!.localityPsgcCode).toBeNull();
    expect(normalized!.sublocalityPsgcCode).toBeNull();
  });

  it('should reject tampered encrypted fields (return null)', () => {
    const protect = ProfileFieldProtection.protect;
    const validEncrypted = protect('123 Main St', ProfileFieldContext.ADDRESS_LINE_1);
    
    // Tamper the ciphertext slightly
    const tampered = validEncrypted.substring(0, validEncrypted.length - 2) + 'AA';

    const dbAddress = {
      addressLine1_encrypted: tampered,
      countryCode: 'US',
      provider: 'MANUAL',
      providerPlaceId: null,
      validationStatus: 'UNVERIFIED',
      validationLevel: null,
      manuallyEdited: true,
      validatedAt: null,
    };

    const normalized = AddressService.readNormalizedAddress(dbAddress);
    
    // The decrypter should swallow the error and return null to prevent 500s
    expect(normalized).not.toBeNull();
    expect(normalized!.addressLine1).toBeNull();
  });
});
