const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function check() {
  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'superadmin@rentipid.local' },
    update: { password_hash: hash, role: 'Super Admin', status: 'Verified' },
    create: {
      email: 'superadmin@rentipid.local',
      full_name: 'Super Admin User',
      account_type: 'Individual',
      role: 'Super Admin',
      status: 'Verified',
      password_hash: hash
    }
  });
  console.log('Upserted superadmin@rentipid.local');
}
check().finally(() => prisma.$disconnect());
