require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkStatus() {
  const usersCount = await prisma.user.count();
  const authProviders = await prisma.authProviderIdentity.findMany({
    select: { id: true, user_id: true, provider: true, provider_subject: true, created_at: true }
  });
  const phoneIdentities = await prisma.phoneIdentity.findMany({
    select: { id: true, user_id: true, phone_e164: true, created_at: true }
  });
  const emailCredentials = await prisma.emailCredential.findMany({
    select: { id: true, user_id: true, normalized_email: true, created_at: true }
  });
  const recentEvents = await prisma.authIdentityEvent.findMany({
    take: 10,
    orderBy: { created_at: "desc" },
    select: { id: true, action: true, identity_type: true, outcome: true, user_id: true, provider: true, created_at: true }
  });
  const consentReceipts = await prisma.authConsentReceipt.findMany({
    take: 10,
    orderBy: { created_at: "desc" },
    select: { id: true, user_id: true, terms_version: true, privacy_version: true, created_at: true }
  });

  const providersFound = new Set(authProviders.map(p => p.provider));
  const hasGoogle = providersFound.has('google');
  const hasFacebook = providersFound.has('facebook');
  const hasApple = providersFound.has('apple');
  const hasWhatsApp = phoneIdentities.length > 0;
  const hasEmail = emailCredentials.length > 0;

  console.log("\n====================================================");
  console.log("RENTIPID — LOCAL MULTI-LOGIN PROGRESS MONITOR");
  console.log("====================================================");
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Database: rentipid_local_dev (127.0.0.1:5432)`);
  console.log(`Total Local Users: ${usersCount}`);
  console.log("\n--- Active Provider Status ---");
  console.log(`1. Email / Password:  ${hasEmail ? "PASS [x]" : "PENDING [ ]"} (${emailCredentials.length} credentials)`);
  console.log(`2. Google OAuth:      ${hasGoogle ? "PASS [x]" : "AWAITING SIGN-IN [ ]"} (${authProviders.filter(p => p.provider === 'google').length} identities)`);
  console.log(`3. Facebook OAuth:    ${hasFacebook ? "PASS [x]" : "AWAITING SIGN-IN [ ]"} (${authProviders.filter(p => p.provider === 'facebook').length} identities)`);
  console.log(`4. Apple Sign In:     ${hasApple ? "PASS [x]" : "AWAITING SIGN-IN [ ]"} (${authProviders.filter(p => p.provider === 'apple').length} identities)`);
  console.log(`5. WhatsApp OTP:      ${hasWhatsApp ? "PASS [x]" : "AWAITING SIGN-IN [ ]"} (${phoneIdentities.length} identities)`);

  console.log("\n--- Provider Identities in rentipid_local_dev ---");
  authProviders.forEach(p => {
    console.log(`- Provider: ${p.provider} | User ID: ${p.user_id} | Created: ${p.created_at.toISOString()}`);
  });
  phoneIdentities.forEach(p => {
    console.log(`- Phone: ${p.phone_e164} | User ID: ${p.user_id} | Created: ${p.created_at.toISOString()}`);
  });

  console.log(`\nRecent Auth Events: ${recentEvents.length}`);
  recentEvents.forEach(e => {
    console.log(`- [${e.action}/${e.outcome}] Provider: ${e.provider || 'N/A'} | User ID: ${e.user_id || 'N/A'}`);
  });

  return {
    hasEmail,
    hasGoogle,
    hasFacebook,
    hasApple,
    hasWhatsApp,
    allPassing: hasEmail && hasGoogle && hasFacebook && hasApple && hasWhatsApp
  };
}

checkStatus()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
