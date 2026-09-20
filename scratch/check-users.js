const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      full_name: true,
      role: true,
      authProviderIdentities: true
    }
  });
  console.log('Total users in local DB:', users.length);
  for (const u of users) {
    console.log(`- [${u.id}] ${u.email} (${u.full_name}, ${u.role}) | Identities: ${u.authProviderIdentities.map(p => p.provider + ':' + p.provider_subject).join(', ') || 'none'}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
