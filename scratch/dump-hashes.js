const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { email: { in: ['oat.renter@rentipid.test', 'oat.provider@rentipid.test', 'oat.superadmin@rentipid.test'] } },
    select: { email: true, status: true, role: true }
  });
  console.log(users);
}
main();
