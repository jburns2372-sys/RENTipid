const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'superadmin@rentipid.local' }
  });
  
  if (user) {
    const isValid = bcrypt.compareSync('password123', user.password_hash);
    console.log('User found. Password valid:', isValid);
  } else {
    console.log('User not found in DB.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
