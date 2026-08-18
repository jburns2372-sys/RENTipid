const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
async function main() {
  const identities = await prisma.authIdentity.findMany({
    where: { provider: 'google' },
    include: { user: { select: { id: true, email: true, role: true, status: true } } },
    orderBy: { created_at: 'desc' },
    take: 5
  });
  console.log('=== Google Auth Identities ===');
  identities.forEach(i => console.log(JSON.stringify({
    userId: i.user.id, email: i.user.email, role: i.user.role, status: i.user.status,
    provider: i.provider, subject: i.provider_subject, created: i.created_at
  })));
  console.log('Total Google identities: ' + identities.length);

  const oauthSessions = await prisma.authSession.count({ where: { authentication_level: 'OAUTH' } });
  console.log('Total OAuth sessions: ' + oauthSessions);

  const mergeBlocks = await prisma.securityEvent.count({ where: { event_code: 'AUTH_UNSAFE_MERGE_BLOCKED' } });
  console.log('Unsafe merge blocks: ' + mergeBlocks);
  
  await prisma.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
