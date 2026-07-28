const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const events = await prisma.securityEvent.findMany({
    take: 1,
    orderBy: { occurred_at: 'desc' },
    include: { geo_enrichment: true }
  });
  console.log("EVENT:", Object.keys(events[0]));
  if (events[0].geo_enrichment) console.log("HAS geo_enrichment");
  if (events[0].geoEnrichment) console.log("HAS geoEnrichment");
}
run().catch(console.error).finally(() => prisma.$disconnect());
