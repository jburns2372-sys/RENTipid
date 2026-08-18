const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMarketplaceFlow() {
  console.log("Starting Marketplace Flow Test...");
  const baseUrl = "http://localhost:3000";
  
  // Create a category
  let category = await prisma.category.findFirst({ where: { name: 'Test Category' } });
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Test Category',
        description: 'Test Category for Testing',
        slug: 'test-category',
        icon: 'test',
        risk_level: 'Low'
      }
    });
  }

  // Provider Credentials
  const providerEmail = `provider_${Date.now()}@rentipid.local`;
  const password = "password123!";
  
  // 1. REGISTER PROVIDER
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: providerEmail, password, full_name: "Test Provider", account_type: "Individual", role: "Individual Provider" })
  });
  if (!regRes.ok) {
    console.error("Register Failed", await regRes.text());
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));

  // VERIFY PROVIDER
  await prisma.user.update({
    where: { email: providerEmail },
    data: { status: 'Verified' }
  });

  // 2. LOGIN PROVIDER
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfCookie = csrfRes.headers.getSetCookie();
  
  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": csrfCookie ? csrfCookie.join('; ') : ""
    },
    body: new URLSearchParams({ email: providerEmail, password: password, csrfToken: csrfData.csrfToken, json: "true" })
  });
  const authCookies = loginRes.headers.getSetCookie();
  const cookieHeader = authCookies ? authCookies.join('; ') : "";

  // 3. CREATE LISTING
  console.log("Testing Create Listing...");
  const createRes = await fetch(`${baseUrl}/api/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cookie": cookieHeader },
    body: JSON.stringify({
      title: "Test Listing",
      description: "A test item",
      category_id: category.id,
      rental_type: "Daily",
      daily_rate: 100,
      quantity: 1,
      location: "Test Location",
      status: "Draft"
    })
  });
  console.log("Create Listing Status:", createRes.status);
  const data = await createRes.json();
  console.log("Listing Created Data:", data);

  if (createRes.status !== 201) {
    throw new Error("Failed to create listing!");
  }
}

testMarketplaceFlow().catch(console.error).finally(() => prisma.$disconnect());
