const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    where: { email: 'oat.renter@rentipid.test' },
    data: { password_hash: '$2b$10$L521NNe5fGH3xFnWKbTsTej2hLryMVISRdi/GWorZUSyyXigoWaPO' }
  });
  console.log('Password hash updated for oat.renter@rentipid.test');
}
main().catch(console.error).finally(() => prisma.$disconnect());
