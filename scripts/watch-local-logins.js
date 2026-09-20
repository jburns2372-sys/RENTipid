require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('WATCHING LOCAL LOGINS & DB WRITES (rentipid_local_dev)');
  console.log('Target: 127.0.0.1:5432');
  console.log('====================================================');

  const initialTime = new Date();
  let knownIdentities = new Set();
  let knownPhone = new Set();

  // Load existing
  const existingId = await prisma.authProviderIdentity.findMany({ select: { id: true } });
  existingId.forEach(x => knownIdentities.add(x.id));
  const existingPhone = await prisma.phoneIdentity.findMany({ select: { id: true } });
  existingPhone.forEach(x => knownPhone.add(x.id));

  console.log(`Baseline: ${knownIdentities.size} OAuth identities, ${knownPhone.size} phone identities.`);
  console.log('Ready! Log in at https://preview.rentipid.com.ph/login in your browser...');

  while (true) {
    // Check new authProviderIdentity
    const newIdentities = await prisma.authProviderIdentity.findMany({
      where: { id: { notIn: Array.from(knownIdentities) } },
      include: { user: true }
    });

    for (const i of newIdentities) {
      console.log(`\n🎉 [NEW LOCAL OAUTH IDENTITY] Provider: ${i.provider}`);
      console.log(`- Local User ID: ${i.user_id}`);
      console.log(`- User Email: ${i.user?.email}`);
      console.log(`- User Name: ${i.user?.full_name}`);
      console.log(`- Provider Subject: ${i.provider_subject}`);
      console.log(`- Created: ${i.created_at.toISOString()}`);
      knownIdentities.add(i.id);
    }

    // Check new phoneIdentity
    const newPhones = await prisma.phoneIdentity.findMany({
      where: { id: { notIn: Array.from(knownPhone) } },
      include: { user: true }
    });

    for (const p of newPhones) {
      console.log(`\n🎉 [NEW LOCAL PHONE IDENTITY] WhatsApp Phone: ${p.phone_e164}`);
      console.log(`- Local User ID: ${p.user_id}`);
      console.log(`- User Email: ${p.user?.email}`);
      console.log(`- User Name: ${p.user?.full_name}`);
      console.log(`- Created: ${p.created_at.toISOString()}`);
      knownPhone.add(p.id);
    }

    // Check recent challenge
    const latestChallenge = await prisma.phoneVerificationChallenge.findFirst({
      where: { created_at: { gte: initialTime } },
      orderBy: { created_at: 'desc' }
    });
    if (latestChallenge && latestChallenge.status === 'VERIFIED') {
      console.log(`\n✅ [WHATSAPP CHALLENGE VERIFIED] ID: ${latestChallenge.id} Phone: ${latestChallenge.phone_e164}`);
    }

    await new Promise(r => setTimeout(r, 2000));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
