import { PrismaClient } from '@prisma/client';
import { ProfileFieldProtection, ProfileFieldContext } from '../src/lib/security/crypto/profile-field-protection';
import { Client } from 'pg';

import { LEGACY_MIGRATION_LOCK_ID, assertDatabaseIsSafe } from './legacy-migration-constants';

const prisma = new PrismaClient();
const isExecute = process.argv.includes('--execute');
const expectedDbArg = process.argv.find(arg => arg.startsWith('--expected-db='));
const expectedDb = expectedDbArg ? expectedDbArg.split('=')[1] : null;

let lockClient: Client | null = null;

async function main() {
  console.log(`Starting legacy address data migration... (Execute: ${isExecute})`);

  if (isExecute && !expectedDb) {
    throw new Error('Missing --expected-db. You must explicitly declare the target database.');
  }

  if (isExecute && expectedDb) {
    assertDatabaseIsSafe(expectedDb);
  }

  try {
    if (isExecute) {
      lockClient = new Client({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public' });
      await lockClient.connect();
      
      const dbRes = await lockClient.query('SELECT current_database() as db_name');
      const dbName = dbRes.rows[0].db_name;
      
      if (dbName !== expectedDb) {
        throw new Error(`Database safety guard: Expected database '${expectedDb}', but connected to '${dbName}'.`);
      }
      
      assertDatabaseIsSafe(dbName);

      // LEGACY_MIGRATION_LOCK_ID is a specific lock ID for this migration
      const res = await lockClient.query(`SELECT pg_try_advisory_lock(${LEGACY_MIGRATION_LOCK_ID}) as lock_acquired`);
      if (!res.rows[0].lock_acquired) {
        throw new Error("Migration is already running in another process. Aborting.");
      }
    }
    
    await prisma.$connect();
  } catch (e) {
    console.error(e instanceof Error ? e.message : 'Database connection failed. Aborting migration.');
    throw e; // throw instead of process.exit to ensure finally blocks run
  }

  const userProfiles = await prisma.userProfile.findMany({
    where: { global_address_id: null }
  });

  console.log(`Found ${userProfiles.length} user profiles to migrate.`);

  let userMigrated = 0;
  for (const profile of userProfiles) {
    let addressLine1 = profile.address;
    
    if (profile.address_encrypted) {
      try {
        const result = ProfileFieldProtection.read(profile.address_encrypted, profile.address, ProfileFieldContext.USER_ADDRESS);
        addressLine1 = result.value;
      } catch {
        console.warn(`Failed to decrypt address for a userProfile. Skipping record to prevent plaintext fallback.`);
        continue;
      }
    }

    if (addressLine1 || profile.city || profile.province || profile.country) {
      const mappedCountry = mapLegacyCountryToCode(profile.country);
      let legacyFallback: string | null = null;
      if (profile.country && !mappedCountry) {
        legacyFallback = `Legacy Country: ${profile.country}`;
      }

      const p = ProfileFieldProtection.protect;
      
      const mergedLine1 = [addressLine1, legacyFallback].filter(Boolean).join(' | ');
      
      const data = {
        addressLine1_encrypted: mergedLine1 ? p(mergedLine1, ProfileFieldContext.ADDRESS_LINE_1) : null,
        locality_encrypted: profile.city ? p(profile.city, ProfileFieldContext.ADDRESS_LOCALITY) : null,
        administrativeArea1_encrypted: profile.province ? p(profile.province, ProfileFieldContext.ADDRESS_ADMIN_AREA_1) : null,
        countryCode: mappedCountry,
        provider: 'LEGACY',
        validationStatus: 'UNVERIFIED',
      };

      if (isExecute) {
        try {
          await prisma.$transaction(async (tx) => {
            const address = await tx.address.create({ data });
            await tx.userProfile.update({
              where: { id: profile.id },
              data: { global_address_id: address.id }
            });
          });
          userMigrated++;
        } catch {
          console.error(`Transaction failed for a userProfile`);
        }
      } else {
        userMigrated++;
      }
    }
  }

  const businessProfiles = await prisma.businessProfile.findMany({
    where: { global_business_address_id: null }
  });

  console.log(`Found ${businessProfiles.length} business profiles to migrate.`);
  
  let businessMigrated = 0;
  for (const profile of businessProfiles) {
    let addressLine1 = profile.business_address;
    
    if (profile.business_address_encrypted) {
      try {
        const result = ProfileFieldProtection.read(profile.business_address_encrypted, profile.business_address, ProfileFieldContext.BUSINESS_ADDRESS);
        addressLine1 = result.value;
      } catch {
        console.warn(`Failed to decrypt business address for a businessProfile. Skipping record to prevent plaintext fallback.`);
        continue;
      }
    }

    if (addressLine1) {
      const p = ProfileFieldProtection.protect;
      const data = {
        addressLine1_encrypted: addressLine1 ? p(addressLine1, ProfileFieldContext.ADDRESS_LINE_1) : null,
        provider: 'LEGACY',
        validationStatus: 'UNVERIFIED',
      };

      if (isExecute) {
        try {
          await prisma.$transaction(async (tx) => {
            const address = await tx.address.create({ data });
            await tx.businessProfile.update({
              where: { id: profile.id },
              data: { global_business_address_id: address.id }
            });
          });
          businessMigrated++;
        } catch {
          console.error(`Transaction failed for a businessProfile`);
        }
      } else {
        businessMigrated++;
      }
    }
  }

  console.log(`Data migration complete. (Migrated User: ${userMigrated}, Business: ${businessMigrated})`);
}

function mapLegacyCountryToCode(country: string | null): string | null {
  if (!country) return null;
  const c = country.trim().toLowerCase();
  if (c === 'philippines' || c === 'ph') return 'PH';
  if (c === 'united states' || c === 'us' || c === 'usa') return 'US';
  if (c === 'canada' || c === 'ca') return 'CA';
  if (c === 'united kingdom' || c === 'uk' || c === 'gb') return 'GB';
  if (c === 'australia' || c === 'au') return 'AU';
  if (c === 'singapore' || c === 'sg') return 'SG';
  if (c === 'japan' || c === 'jp') return 'JP';
  
  return null;
}

main()
  .then(() => {
    console.log("Migration script completed.");
    process.exitCode = 0;
  })
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    if (lockClient) {
      try {
        await lockClient.query(`SELECT pg_advisory_unlock(${LEGACY_MIGRATION_LOCK_ID})`);
      } catch {}
      await lockClient.end();
    }
  });
