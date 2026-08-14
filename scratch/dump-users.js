const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany({ select: { email: true, role: true } })
  .then(users => console.log(users))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
