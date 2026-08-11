import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@rentipid.local';
  const password = 'password123';
  const password_hash = bcrypt.hashSync(password, 10);

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data: {
        password_hash,
        role: 'Super Admin',
        status: 'Verified',
      }
    });
    console.log('Local Superadmin updated successfully.');
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
        profile: {
          create: {
            verification_status: 'Unverified'
          }
        }
      }
    });
    console.log('Local Superadmin created successfully.');
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
