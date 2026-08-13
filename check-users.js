const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ 
    where: { role: 'Super Admin' },
    select: { id: true, email: true, role: true, status: true } 
  });
  console.table(users);
}
main().catch(console.error).finally(() => prisma.$disconnect());
