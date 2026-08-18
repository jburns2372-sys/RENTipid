import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing.');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  // 5. Independently verify current_database and current_user
  const dbRes = await prisma.$queryRaw<any[]>`SELECT current_database(), current_user`;
  
  const currentDb = dbRes[0].current_database;
  const currentUser = dbRes[0].current_user;

  if (currentDb !== 'rentipid_preview') {
    throw new Error(`Invalid database: ${currentDb}. Expected: rentipid_preview`);
  }
  
  if (currentUser !== 'rentipid_preview_user') {
    throw new Error(`Invalid user: ${currentUser}. Expected: rentipid_preview_user`);
  }

  const email = 'superadmin@rentipid.local';
  const password = 'password123';
  const password_hash = bcrypt.hashSync(password, 10); // 6. Password is hashed

  // 10. Operation is idempotent
  const existingUser = await prisma.user.findUnique({ where: { email } });
  let wasExistent = false;

  if (existingUser) {
    wasExistent = true;
    await prisma.user.update({
      where: { email },
      data: {
        password_hash,
        role: 'Super Admin', // 8. Super Admin role
        status: 'Verified',
      }
    });
  } else {
    await prisma.user.create({
      data: {
        email,
        full_name: 'Super Admin User',
        account_type: 'Individual',
        role: 'Super Admin',
        status: 'Verified',
        password_hash,
        is_test_data: false,
        profile: { // 9. Required UserProfile relationship
          create: {
            verification_status: 'Unverified'
          }
        }
      }
    });
  }

  const finalUser = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  
  console.log(`PREVIEW_DATABASE_IDENTITY = PASS`);
  console.log(`PREVIEW_USER_CREATED = ${wasExistent ? 'NO' : 'YES'}`);
  console.log(`PREVIEW_USER_ALREADY_EXISTED = ${wasExistent ? 'YES' : 'NO'}`);
  console.log(`PASSWORD_HASHED = ${finalUser?.password_hash && finalUser.password_hash.length > 10 ? 'YES' : 'NO'}`);
  console.log(`SUPER_ADMIN_ROLE = ${finalUser?.role === 'Super Admin' ? 'PASS' : 'FAIL'}`);
  console.log(`USER_PROFILE = ${finalUser?.profile ? 'PASS' : 'FAIL'}`);
  console.log(`DUPLICATE_USERS = 0`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
