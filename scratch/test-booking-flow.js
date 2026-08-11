const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBookingFlow() {
  console.log("Starting Booking Flow Test...");
  const baseUrl = "http://localhost:3000";
  
  // 1. Get or Create Category
  let category = await prisma.category.findFirst({ where: { name: 'Test Category' } });
  
  // 2. Setup Provider & Listing
  const providerEmail = `provider_${Date.now()}@rentipid.local`;
  const password = "password123!";
  
  await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: providerEmail, password, full_name: "Test Provider", account_type: "Individual", role: "Individual Provider" })
  });
  await new Promise(r => setTimeout(r, 500));
  await prisma.user.update({ where: { email: providerEmail }, data: { status: 'Verified' } });
  
  const provider = await prisma.user.findUnique({ where: { email: providerEmail } });

  const listing = await prisma.listing.create({
    data: {
      provider_id: provider.id,
      category_id: category.id,
      title: "Test Listing for Booking",
      description: "A test item",
      location: "Test Location",
      city: "Test",
      province: "Test",
      country: "Philippines",
      rental_type: "Daily",
      daily_rate: 100,
      quantity: 1,
      status: "Published"
    }
  });
  
  // 3. Setup Renter
  const renterEmail = `renter_${Date.now()}@rentipid.local`;
  await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: renterEmail, password, full_name: "Test Renter", account_type: "Individual", role: "Renter" })
  });
  await new Promise(r => setTimeout(r, 500));
  await prisma.user.update({ where: { email: renterEmail }, data: { status: 'Verified' } });

  // 4. Login Renter
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfCookie = csrfRes.headers.getSetCookie();
  
  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": csrfCookie ? csrfCookie.join('; ') : ""
    },
    body: new URLSearchParams({ email: renterEmail, password: password, csrfToken: csrfData.csrfToken, json: "true" })
  });
  const authCookies = loginRes.headers.getSetCookie();
  const cookieHeader = authCookies ? authCookies.join('; ') : "";

  // 5. Create Booking
  console.log("Testing Create Booking...");
  const sDate = new Date();
  sDate.setDate(sDate.getDate() + 1);
  const eDate = new Date();
  eDate.setDate(eDate.getDate() + 3);

  const createRes = await fetch(`${baseUrl}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cookie": cookieHeader },
    body: JSON.stringify({
      listing_id: listing.id,
      start_date: sDate.toISOString(),
      end_date: eDate.toISOString(),
      start_time: "10:00 AM",
      end_time: "10:00 AM",
      rental_duration: 2,
      rental_duration_unit: "Daily",
      pickup_option: "Self Pickup",
      delivery_requested: false
    })
  });
  
  console.log("Create Booking Status:", createRes.status);
  const data = await createRes.json();
  console.log("Booking Created Data:", data);

  if (createRes.status !== 201) {
    throw new Error("Failed to create booking!");
  }
}

testBookingFlow().catch(console.error).finally(() => prisma.$disconnect());
