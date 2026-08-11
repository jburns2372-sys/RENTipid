// Native fetch is used
async function testRbacFlow() {
  console.log("Starting RBAC Flow Test...");
  const baseUrl = "http://localhost:3000";
  
  // Renter Credentials
  const renterEmail = `renter_${Date.now()}@rentipid.local`;
  const password = "password123!";
  
  // 1. REGISTER RENTER
  await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: renterEmail, password, full_name: "Test Renter", account_type: "Individual", role: "Renter" })
  });

  // 2. LOGIN RENTER
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const csrfCookie = csrfRes.headers.getSetCookie();
  
  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": csrfCookie ? csrfCookie.join('; ') : ""
    },
    body: new URLSearchParams({ email: renterEmail, password: password, csrfToken: csrfToken, json: "true" })
  });
  const authCookies = loginRes.headers.getSetCookie();
  const cookieHeader = authCookies ? authCookies.join('; ') : "";

  // 3. TRY TO ACCESS SOC API (Should be denied)
  console.log("Testing Renter accessing SOC API...");
  const socRes = await fetch(`${baseUrl}/api/soc/cases`, {
    headers: { "Cookie": cookieHeader }
  });
  console.log("SOC API Status (Renter):", socRes.status);
  if (socRes.status !== 401 && socRes.status !== 403 && socRes.status !== 404) {
    throw new Error("Renter was able to access SOC API! Status: " + socRes.status);
  }

  // 4. TRY TO ACCESS SUPER ADMIN API (Should be denied)
  console.log("Testing Renter accessing Super Admin API...");
  const adminRes = await fetch(`${baseUrl}/api/admin/users`, {
    headers: { "Cookie": cookieHeader }
  });
  console.log("Admin API Status (Renter):", adminRes.status);
  if (adminRes.status !== 401 && adminRes.status !== 403 && adminRes.status !== 404) {
    throw new Error("Renter was able to access Admin API! Status: " + adminRes.status);
  }

  // 5. LOGIN SUPER ADMIN (already seeded)
  console.log("Testing Super Admin access...");
  const saCsrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const saCsrfData = await saCsrfRes.json();
  const saCsrfToken = saCsrfData.csrfToken;
  const saCsrfCookie = saCsrfRes.headers.getSetCookie();
  
  const saLoginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": saCsrfCookie ? saCsrfCookie.join('; ') : ""
    },
    body: new URLSearchParams({ email: "superadmin@rentipid.local", password: "password123", csrfToken: saCsrfToken, json: "true" })
  });
  const saAuthCookies = saLoginRes.headers.getSetCookie();
  const saCookieHeader = saAuthCookies ? saAuthCookies.join('; ') : "";

  // 6. SUPER ADMIN ACCESSIBILITY
  const saSocRes = await fetch(`${baseUrl}/api/soc/cases`, {
    headers: { "Cookie": saCookieHeader }
  });
  console.log("SOC API Status (Super Admin):", saSocRes.status);
  // It might be 200, 400 (if bad request), or 405 (if GET is not allowed), but NOT 401/403.
  if (saSocRes.status === 401 || saSocRes.status === 403) {
    throw new Error("Super Admin was DENIED access to SOC API!");
  }

  console.log("RBAC Flow completed successfully!");
}

testRbacFlow().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
