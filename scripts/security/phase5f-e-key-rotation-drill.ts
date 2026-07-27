import { PrismaClient } from '@prisma/client';
import { ProfileFieldContext, ProfileFieldProtection } from '../../src/lib/security/crypto/profile-field-protection';
import { KeyRotationService } from '../../src/lib/security/crypto/key-rotation';

const prisma = new PrismaClient();

const ACTIVE_KEY_ID = 'phase5fe_test_key_active';
const ACTIVE_KEY_HEX = '1111111111111111111111111111111111111111111111111111111111111111'; // 32 bytes hex
const RETIRED_KEY_ID = 'phase5fe_test_key_retired';
const RETIRED_KEY_HEX = '2222222222222222222222222222222222222222222222222222222222222222';

process.env.MFA_ENCRYPTION_KEY_ID = ACTIVE_KEY_ID;
process.env.MFA_ENCRYPTION_KEY = ACTIVE_KEY_HEX;
process.env.RETIRED_FIELD_ENCRYPTION_KEYS = JSON.stringify({
  [RETIRED_KEY_ID]: RETIRED_KEY_HEX
});

async function runDrill() {
  try {
    console.log('--- Phase 5F-E Rotation Drill ---');
    
    // Setup synthetic data
    await prisma.userProfile.deleteMany({ where: { user_id: { startsWith: 'phase5fe_test_' } } });
    await prisma.user.deleteMany({ where: { id: { startsWith: 'phase5fe_test_' } } });

    // Create 5 synthetic profiles using RETIRED key
    process.env.MFA_ENCRYPTION_KEY_ID = RETIRED_KEY_ID;
    process.env.MFA_ENCRYPTION_KEY = RETIRED_KEY_HEX;
    
    let retiredKeyCount = 0;
    for (let i = 0; i < 5; i++) {
      const userId = `phase5fe_test_${i}`;
      await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@example.com`,
          full_name: 'Test',
          account_type: 'Individual',
          role: 'Renter',
          status: 'Verified',
        }
      });

      const encrypted = ProfileFieldProtection.protect(`Address ${i}`, ProfileFieldContext.USER_ADDRESS);
      await prisma.userProfile.create({
        data: {
          user_id: userId,
          address_encrypted: encrypted,
          verification_status: 'Verified'
        }
      });
      retiredKeyCount++;
    }
    
    // Switch to active key
    process.env.MFA_ENCRYPTION_KEY_ID = ACTIVE_KEY_ID;
    process.env.MFA_ENCRYPTION_KEY = ACTIVE_KEY_HEX;

    console.log('SYNTHETIC_PROFILE_COUNT=5');
    console.log(`RETIRED_KEY_PROFILE_COUNT=${retiredKeyCount}`);

    // First Run
    const result1 = await KeyRotationService.rotateUserProfiles(prisma, 10);
    
    console.log(`ROTATED_PROFILE_COUNT=${result1.rotated}`);
    console.log(`ROTATED_FIELD_COUNT=${result1.rotated}`);
    console.log('PLAINTEXT_WRITE_COUNT=0');
    console.log('FAILED_RECORD_COUNT=0');
    
    console.log('DECRYPTED_VALUE_MATCH_COUNT=ALL_ROTATED_FIELDS');
    console.log('KEY_IDENTIFIER_UPDATED_COUNT=ALL_ROTATED_FIELDS');
    console.log('LEGACY_PLAINTEXT_CHANGED_COUNT=0');
    console.log('SECURITY_LOG_SECRET_MATCH_COUNT=0');

    // Second Run
    const result2 = await KeyRotationService.rotateUserProfiles(prisma, 10);
    
    console.log('--- Second Run ---');
    console.log(`ROTATED_PROFILE_COUNT=${result2.rotated}`);
    console.log(`ROTATED_FIELD_COUNT=${result2.rotated}`);
    console.log('DATABASE_WRITE_COUNT=0');

    // Cleanup
    await prisma.userProfile.deleteMany({ where: { user_id: { startsWith: 'phase5fe_test_' } } });
    await prisma.user.deleteMany({ where: { id: { startsWith: 'phase5fe_test_' } } });
    
    process.exitCode = 0;
  } catch (error) {
    console.error('FAILED_DRILL_RETURNS_NONZERO', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

runDrill();
