require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const provider = process.argv[2] || 'google';

async function main() {
  console.log(`Watching rentipid_local_dev for [${provider}] authentication...`);
  const startTime = new Date();

  for (let i = 0; i < 60; i++) { // watch for up to 120 seconds
    const identity = await prisma.authProviderIdentity.findFirst({
      where: {
        provider: provider,
        updated_at: { gte: new Date(startTime.getTime() - 10000) }
      },
      include: {
        user: {
          select: { id: true, email: true, full_name: true, role: true, status: true }
        }
      },
      orderBy: { updated_at: 'desc' }
    });

    if (identity) {
      console.log(`\nSUCCESS: Detected [${provider}] identity in rentipid_local_dev!`);
      console.log('User ID:', identity.user_id);
      console.log('User Details:', identity.user);
      console.log('Provider Subject Hash/ID:', identity.provider_subject);
      console.log('Timestamp:', identity.updated_at.toISOString());
      return;
    }

    // Also check PhoneIdentity if provider is whatsapp
    if (provider === 'whatsapp') {
      const phoneIdentity = await prisma.phoneIdentity.findFirst({
        where: {
          updated_at: { gte: new Date(startTime.getTime() - 10000) }
        },
        include: {
          user: {
            select: { id: true, email: true, full_name: true, role: true, status: true }
          }
        },
        orderBy: { updated_at: 'desc' }
      });

      if (phoneIdentity) {
        console.log(`\nSUCCESS: Detected [whatsapp] phone identity in rentipid_local_dev!`);
        console.log('User ID:', phoneIdentity.user_id);
        console.log('User Details:', phoneIdentity.user);
        console.log('Phone E164:', phoneIdentity.phone_e164);
        console.log('Timestamp:', phoneIdentity.updated_at.toISOString());
        return;
      }
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`Timeout: No new [${provider}] identity detected yet.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
