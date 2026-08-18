// Native fetch is used
// Node 20 has native fetch.
async function testAuthFlow() {
  console.log("Starting Auth Flow Test...");
  const baseUrl = "http://localhost:3000";
  let cookieHeader = "";

  // 1. REGISTER
  const randomEmail = `testuser_${Date.now()}@rentipid.local`;
  const password = "password123!";
  console.log(`1. REGISTER: ${randomEmail}`);
  
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: randomEmail, password, full_name: "Test User", account_type: "Individual", role: "Renter" })
  });
  console.log("Register Status:", regRes.status);
  const regText = await regRes.text();
  console.log("Register Body:", regText);
  if (regRes.status !== 200 && regRes.status !== 201) throw new Error("Registration failed");

  // 2. LOGIN (NextAuth Credentials)
  console.log("2. LOGIN");
  // First, get CSRF token
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
    body: new URLSearchParams({
      email: randomEmail,
      password: password,
      csrfToken: csrfToken,
      json: "true"
    })
  });
  console.log("Login Status:", loginRes.status);
  const loginData = await loginRes.json();
  console.log("Login Body:", loginData);
  if (loginRes.status !== 200 || loginData.url?.includes('error')) throw new Error("Login failed");
  const authCookies = loginRes.headers.getSetCookie();
  cookieHeader = authCookies ? authCookies.join('; ') : "";

  // 3. AUTHENTICATED SESSION
  console.log("3. AUTHENTICATED SESSION");
  const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { "Cookie": cookieHeader }
  });
  const sessionData = await sessionRes.json();
  console.log("Session User:", sessionData.user?.email);
  if (sessionData.user?.email !== randomEmail) throw new Error("Session invalid");

  // 4. PROTECTED PAGE
  console.log("4. PROTECTED PAGE");
  const protectedRes = await fetch(`${baseUrl}/dashboard`, {
    headers: { "Cookie": cookieHeader }
  });
  console.log("Protected Page Status:", protectedRes.status);
  // Middleware redirects to /login if unauthorized (307). 404 means it passed auth but page doesn't exist, which is fine for auth testing.
  if (protectedRes.status === 307 || protectedRes.redirected) throw new Error("Protected page denied while authenticated");

  // 5. LOGOUT
  console.log("5. LOGOUT");
  const logoutRes = await fetch(`${baseUrl}/api/auth/signout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": cookieHeader
    },
    body: new URLSearchParams({ csrfToken, json: "true" })
  });
  console.log("Logout Status:", logoutRes.status);
  // After logout, cookies are cleared

  // 6. PROTECTED PAGE DENIED
  console.log("6. PROTECTED PAGE DENIED");
  const deniedRes = await fetch(`${baseUrl}/dashboard`);
  console.log("Denied Page Status:", deniedRes.status);
  // Unauthenticated should be redirected (302 or 307)
  if (deniedRes.status === 200 && deniedRes.url.includes('/dashboard')) throw new Error("Protected page accessed without auth");

  console.log("Flow completed successfully!");
}

testAuthFlow().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
