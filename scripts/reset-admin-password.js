/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const { upsertSeededEmailPasswordUser } = require('../src/lib/auth/seed/upsert-seeded-user');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.RESET_ADMIN_EMAIL || 'superadmin@rentipid.local';
  const plainPassword = process.env.RESET_ADMIN_PASSWORD || 'password123';

  await upsertSeededEmailPasswordUser(prisma, {
    email,
    fullName: 'Super Admin User',
    accountType: 'Individual',
    role: 'Super Admin',
    status: 'Verified',
    plainPassword,
  });

  console.log('Password reset successfully for:', email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
