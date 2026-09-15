import { PrismaClient } from '@prisma/client';
import { canonicalizeEmail } from '../unified/identifiers';
import bcrypt from 'bcryptjs';

const APPROVED_SEED_DATABASES = new Set([
  'rentipid_local_dev',
  'rentipid_disposable_test',
  'rentipid_dev_test',
  'rentipid_test',
  'rentipid_test_soc'
]);

export interface UpsertSeededUserOptions {
  email: string;
  fullName: string;
  accountType?: 'Individual' | 'Business';
  role: string;
  status?: 'Pending' | 'Verified' | 'Suspended' | 'Blacklisted';
  plainPassword?: string;
  passwordHash?: string;
  isVerifiedCredential?: boolean;
}

export async function assertSafeLocalSeedDatabase(prisma: PrismaClient): Promise<{ databaseName: string }> {
  const result = await prisma.$queryRaw<Array<{ db_name: string; server_addr: string }>>`
    SELECT 
      current_database() AS db_name, 
      coalesce(inet_server_addr()::text, '127.0.0.1') AS server_addr;
  `;

  if (!result || result.length === 0) {
    throw new Error('[SECURITY_FAIL_CLOSED] Unable to verify database identity for user seeding.');
  }

  const { db_name, server_addr } = result[0];
  const cleanAddr = server_addr.split('/')[0];

  const isLoopback = cleanAddr === '127.0.0.1' || cleanAddr === '::1' || cleanAddr === 'localhost';
  if (!isLoopback) {
    throw new Error(`[SECURITY_FAIL_CLOSED] User seeding forbidden on non-loopback host: ${cleanAddr}`);
  }

  if (db_name.includes('prod') && !db_name.includes('test') && !APPROVED_SEED_DATABASES.has(db_name)) {
    throw new Error(`[SECURITY_FAIL_CLOSED] User seeding forbidden on production database: ${db_name}`);
  }
  if (db_name.includes('preview')) {
    throw new Error(`[SECURITY_FAIL_CLOSED] User seeding forbidden on preview database: ${db_name}`);
  }

  return { databaseName: db_name };
}

export async function upsertSeededEmailPasswordUser(
  prisma: PrismaClient,
  options: UpsertSeededUserOptions
): Promise<{ userId: string; email: string }> {
  // 1. Verify Local Safety Guards
  await assertSafeLocalSeedDatabase(prisma);

  const normalizedEmail = canonicalizeEmail(options.email);
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error(`[INVALID_EMAIL] Invalid email provided: ${options.email}`);
  }

  // Determine password hash
  let finalHash = options.passwordHash;
  if (!finalHash && options.plainPassword) {
    finalHash = await bcrypt.hash(options.plainPassword, 10);
  }

  if (!finalHash) {
    throw new Error(`[MISSING_CREDENTIAL] Either plainPassword or passwordHash must be provided for ${normalizedEmail}`);
  }

  const isVerifiedCredential = options.isVerifiedCredential ?? (options.status === 'Verified');

  // 2. Atomic Single-Transaction Upsert
  return await prisma.$transaction(async (tx) => {
    // Check if an EmailCredential already exists for this email
    const existingCred = await tx.emailCredential.findUnique({
      where: { normalized_email: normalizedEmail }
    });

    // Check if user exists
    const existingUser = await tx.user.findUnique({
      where: { email: normalizedEmail }
    });

    // Integrity check: if credential exists, it must belong to the existing user
    if (existingCred && existingUser && existingCred.user_id !== existingUser.id) {
      throw new Error(`[CREDENTIAL_OWNERSHIP_MISMATCH] EmailCredential for ${normalizedEmail} is mapped to user ${existingCred.user_id}, not ${existingUser.id}`);
    }

    let userId: string;

    if (existingUser) {
      const updatedUser = await tx.user.update({
        where: { id: existingUser.id },
        data: {
          full_name: options.fullName,
          account_type: options.accountType || existingUser.account_type,
          role: options.role,
          status: options.status || existingUser.status,
          password_hash: finalHash,
        }
      });
      userId = updatedUser.id;
    } else {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          full_name: options.fullName,
          account_type: options.accountType || 'Individual',
          role: options.role,
          status: options.status || 'Verified',
          password_hash: finalHash,
        }
      });
      userId = createdUser.id;
    }

    // Upsert companion EmailCredential atomically
    await tx.emailCredential.upsert({
      where: { normalized_email: normalizedEmail },
      update: {
        user_id: userId,
        password_hash: finalHash,
        is_verified: isVerifiedCredential,
        updated_at: new Date()
      },
      create: {
        user_id: userId,
        normalized_email: normalizedEmail,
        password_hash: finalHash,
        is_verified: isVerifiedCredential,
        verified_at: isVerifiedCredential ? new Date() : null,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    return { userId, email: normalizedEmail };
  });
}
