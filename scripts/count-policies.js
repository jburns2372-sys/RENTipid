const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCount() {
  const count = await prisma.prohibitedItemPolicy.count();
  console.log(`POLICY_COUNT=${count}`);
  await prisma.$disconnect();
}

checkCount().catch(console.error);
