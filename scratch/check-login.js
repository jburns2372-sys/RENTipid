const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const events = await prisma.securityEvent.findMany({
    where: { event_code: { startsWith: 'AUTH_LOGIN' } },
    orderBy: { occurred_at: 'desc' },
    take: 10
  });
  console.log(JSON.stringify(events, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
