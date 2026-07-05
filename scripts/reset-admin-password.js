const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@rentipid.local';
  const password = 'password123';
  const password_hash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password_hash,
      role: 'Super Admin',
      status: 'Verified',
    },
    create: {
      email,
      full_name: 'Super Admin User',
      account_type: 'Individual',
      role: 'Super Admin',
      status: 'Verified',
      password_hash,
      is_test_data: false,
    }
  });

  console.log('Password reset successfully for:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
