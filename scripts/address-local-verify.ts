import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { AddressService } from '../src/lib/address/AddressService';
import { AddressTokenService } from '../src/lib/address/address-token';
import { GoogleAddressProvider } from '../src/lib/address/providers/google';
import { normalizeAddress } from '../src/lib/address/normalizer';
import { PsgcService } from '../src/lib/address/psgc/psgc-service';
import { NormalizedAddress } from '../src/lib/address/types';
import {
  ProfileFieldContext,
  ProfileFieldProtection,
} from '../src/lib/security/crypto/profile-field-protection';
import {
  assertLocalDatabaseUrl,
  LOCAL_ADDRESS_DATABASE,
} from './address-local-common';

const prisma = new PrismaClient();
const results = new Map<string, boolean>();

function protect(value: string | number | null, context: ProfileFieldContext): string | null {
  return value === null ? null : ProfileFieldProtection.protect(String(value), context);
}

function protectedFields(address: NormalizedAddress) {
  return {
    addressLine1_encrypted: protect(address.addressLine1, ProfileFieldContext.ADDRESS_LINE_1),
    addressLine2_encrypted: protect(address.addressLine2, ProfileFieldContext.ADDRESS_LINE_2),
    sublocality_encrypted: protect(address.sublocality, ProfileFieldContext.ADDRESS_SUBLOCALITY),
    locality_encrypted: protect(address.locality, ProfileFieldContext.ADDRESS_LOCALITY),
    administrativeArea2_encrypted: protect(address.administrativeArea2, ProfileFieldContext.ADDRESS_ADMIN_AREA_2),
    administrativeArea1_encrypted: protect(address.administrativeArea1, ProfileFieldContext.ADDRESS_ADMIN_AREA_1),
    postalCode_encrypted: protect(address.postalCode, ProfileFieldContext.ADDRESS_POSTAL_CODE),
    formattedAddress_encrypted: protect(address.formattedAddress, ProfileFieldContext.ADDRESS_FORMATTED),
    latitude_encrypted: protect(address.latitude, ProfileFieldContext.ADDRESS_LATITUDE),
    longitude_encrypted: protect(address.longitude, ProfileFieldContext.ADDRESS_LONGITUDE),
  };
}

function report(): void {
  const names = [
    'LOCAL_GOOGLE_AUTOCOMPLETE', 'LOCAL_GOOGLE_PLACE_DETAILS', 'LOCAL_ADDRESS_TOKEN',
    'LOCAL_FIELD_ENCRYPTION', 'LOCAL_PSGC_REGISTRY', 'LOCAL_PH_CITY_RESOLUTION',
    'LOCAL_PH_BARANGAY_DROPDOWN', 'LOCAL_PH_BARANGAY_AUTO_LOAD',
    'LOCAL_PH_SAVE_RELOAD', 'LOCAL_PH_PSGC_PERSISTENCE', 'LOCAL_NON_PH_REGRESSION',
  ];
  for (const name of names) console.log(`${name} = ${results.get(name) ? 'PASS' : 'FAIL'}`);
  if (names.some((name) => !results.get(name))) throw new Error('Local Address acceptance verification failed.');
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  assertLocalDatabaseUrl(databaseUrl, LOCAL_ADDRESS_DATABASE);
  if (process.env.ADDRESS_PROVIDER !== 'GOOGLE') throw new Error('ADDRESS_PROVIDER must be GOOGLE.');

  const user = await prisma.user.findUnique({ where: { email: process.env.ADDRESS_LOCAL_TEST_EMAIL } });
  if (!user) throw new Error('Local Address test user is missing.');
  const sessionToken = randomUUID();
  const provider = new GoogleAddressProvider();
  const autocomplete = await provider.autocomplete('Batasan Hills Quezon City Philippines', {
    countryCode: 'PH', sessionToken,
  });
  results.set('LOCAL_GOOGLE_AUTOCOMPLETE', autocomplete.status === 'OK' && autocomplete.suggestions.length > 0);
  if (!results.get('LOCAL_GOOGLE_AUTOCOMPLETE')) return report();

  const details = normalizeAddress(await provider.getDetails(autocomplete.suggestions[0].placeId, { sessionToken }));
  results.set('LOCAL_GOOGLE_PLACE_DETAILS',
    details.provider === 'google' && Boolean(details.providerPlaceId) && details.countryCode === 'PH',
  );
  const token = AddressTokenService.generateToken({ ...details, userId: user.id });
  const verified = AddressTokenService.verifyToken(token);
  results.set('LOCAL_ADDRESS_TOKEN', Boolean(
    verified && verified.userId === user.id && verified.providerPlaceId === details.providerPlaceId,
  ));
  if (!verified || verified.userId !== user.id || verified.providerPlaceId !== details.providerPlaceId) {
    throw new Error('Secure Address Selection Token verification failed.');
  }

  const [city, barangays, match] = await Promise.all([
    PsgcService.resolveCityByName('Quezon City'),
    PsgcService.getBarangaysByCityCode('1381300000'),
    PsgcService.autoMatchBarangay('Batasan Hills', '1381300000'),
  ]);
  const registryCount = await prisma.psgcSubdivision.count({
    where: { geographicLevel: 'BARANGAY', isActive: true },
  });
  results.set('LOCAL_PSGC_REGISTRY', registryCount >= 40000);
  results.set('LOCAL_PH_CITY_RESOLUTION', city.resolved && city.psgcCode === '1381300000');
  results.set('LOCAL_PH_BARANGAY_DROPDOWN', barangays.length === 142 && match === '1381300139');
  results.set('LOCAL_PH_BARANGAY_AUTO_LOAD', barangays.length === 142);

  const authoritative = normalizeAddress({
    ...details,
    regionPsgcCode: '1300000000',
    provincePsgcCode: null,
    localityPsgcCode: '1381300000',
    sublocalityPsgcCode: '1381300139',
  });
  Object.assign(authoritative, {
    regionPsgcCode: '1300000000', provincePsgcCode: null,
    localityPsgcCode: '1381300000', sublocalityPsgcCode: '1381300139',
  });
  await verifyPhilippinePersistence(user.id, authoritative);
  await verifyNonPhilippinePersistence();
  report();
}

async function verifyPhilippinePersistence(userId: string, address: NormalizedAddress): Promise<void> {
  const data = {
    ...protectedFields(address),
    countryCode: address.countryCode,
    provider: address.provider,
    providerPlaceId: address.providerPlaceId,
    validationStatus: address.validationStatus,
    validationLevel: address.validationLevel,
    manuallyEdited: address.manuallyEdited,
    validatedAt: address.validatedAt ? new Date(address.validatedAt) : null,
    regionPsgcCode: address.regionPsgcCode ?? null,
    provincePsgcCode: address.provincePsgcCode ?? null,
    localityPsgcCode: address.localityPsgcCode ?? null,
    sublocalityPsgcCode: address.sublocalityPsgcCode ?? null,
  };
  await prisma.$transaction(async (tx) => {
    const profile = await tx.userProfile.findUniqueOrThrow({ where: { user_id: userId } });
    const saved = profile.global_address_id
      ? await tx.address.update({ where: { id: profile.global_address_id }, data })
      : await tx.address.create({ data });
    await tx.userProfile.update({
      where: { id: profile.id },
      data: {
        global_address_id: saved.id,
        address: null,
        address_encrypted: protect(
          address.formattedAddress || address.addressLine1,
          ProfileFieldContext.USER_ADDRESS,
        ),
        city: address.locality,
        province: address.administrativeArea1,
        country: address.countryCode,
      },
    });
  });
  const row = await prisma.userProfile.findUniqueOrThrow({
    where: { user_id: userId }, include: { global_address: true },
  });
  const raw = row.global_address;
  const read = AddressService.readNormalizedAddress(raw as unknown as Record<string, unknown>);
  const ciphertext = raw ? Object.entries(raw)
    .filter(([key]) => key.endsWith('_encrypted'))
    .map(([, value]) => String(value || '')).join('') : '';
  const encrypted = Boolean(raw?.addressLine1_encrypted)
    && !ciphertext.includes(address.addressLine1 || '__absent__')
    && !ciphertext.includes(address.formattedAddress || '__absent__');
  results.set('LOCAL_FIELD_ENCRYPTION', encrypted);
  results.set('LOCAL_PH_SAVE_RELOAD', Boolean(
    read
    && read.addressLine1 === address.addressLine1
    && read.formattedAddress === address.formattedAddress
    && read.localityPsgcCode === '1381300000'
    && read.sublocalityPsgcCode === '1381300139',
  ));
  results.set('LOCAL_PH_PSGC_PERSISTENCE', Boolean(
    read?.localityPsgcCode === '1381300000' && read?.sublocalityPsgcCode === '1381300139',
  ));
}

async function verifyNonPhilippinePersistence(): Promise<void> {
  const address = normalizeAddress({
    addressLine1: '1 Local Verification Way',
    locality: 'Singapore',
    countryCode: 'SG',
    formattedAddress: '1 Local Verification Way, Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    provider: 'MANUAL',
    validationStatus: 'UNVERIFIED',
    manuallyEdited: true,
  });
  const row = await prisma.address.create({
    data: {
      ...protectedFields(address),
      countryCode: address.countryCode,
      provider: address.provider,
      providerPlaceId: null,
      validationStatus: address.validationStatus,
      validationLevel: null,
      manuallyEdited: true,
    },
  });
  try {
    const read = AddressService.readNormalizedAddress(row as unknown as Record<string, unknown>);
    results.set('LOCAL_NON_PH_REGRESSION', Boolean(
      read
      && read.addressLine1 === address.addressLine1
      && read.countryCode === 'SG'
      && read.localityPsgcCode == null
      && read.sublocalityPsgcCode == null,
    ));
  } finally {
    await prisma.address.delete({ where: { id: row.id } });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Local Address verification failed safely.');
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
