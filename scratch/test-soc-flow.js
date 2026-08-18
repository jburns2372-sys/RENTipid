const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSocFlow() {
  console.log("Starting SOC Flow Test...");
  const baseUrl = "http://localhost:3000";
  
  // 1. REGISTER & LOGIN TO TRIGGER AUTHENTICATION SECURITY LOG
  const testEmail = `soc_test_${Date.now()}@rentipid.local`;
  const password = "password123!";
  
  await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password, full_name: "SOC Test User", account_type: "Individual", role: "Renter" })
  });
  await new Promise(r => setTimeout(r, 500));
  
  // Login to trigger AUTH_LOGIN_SUCCEEDED event
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfCookie = csrfRes.headers.getSetCookie();
  
  await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": csrfCookie ? csrfCookie.join('; ') : ""
    },
    body: new URLSearchParams({ email: testEmail, password: password, csrfToken: csrfData.csrfToken, json: "true" })
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // 2. VERIFY SECURITY EVENT INGESTION
  const user = await prisma.user.findUnique({ where: { email: testEmail } });
  if (!user) throw new Error("User not found after registration");
  
  const authLog = await prisma.authenticationSecurityLog.findFirst({
    where: { actor_user_id: user.id, event_code: 'AUTH_LOGIN_SUCCEEDED' },
    orderBy: { occurred_at: 'desc' }
  });
  console.log("Auth Log created:", !!authLog);
  
  const secEvent = await prisma.securityEvent.findFirst({
    where: { actor_user_id: user.id, event_code: 'AUTH_LOGIN_SUCCEEDED' },
    orderBy: { occurred_at: 'desc' }
  });
  console.log("Security Event ingested:", !!secEvent);
  
  if (secEvent) {
    console.log("Processing Status:", secEvent.processing_status);
    if (secEvent.processing_status === 'PENDING') {
      throw new Error("Defect still present: SecurityEvent stuck in PENDING status");
    }
  }

  // 3. CHECK HEALTH ENDPOINT
  console.log("SOC Flow Test completed.");
}

testSocFlow().catch(console.error).finally(() => prisma.$disconnect());
