const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('====================================================');
  console.log('RENTIPID — DEDICATED LOCAL AUTHENTICATION BROWSER');
  console.log('Strict TLS: YES (ignoreHTTPSErrors: false)');
  console.log('Host Resolver: preview.rentipid.com.ph -> 127.0.0.1:443');
  console.log('====================================================');

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--host-resolver-rules=MAP preview.rentipid.com.ph 127.0.0.1, MAP local.rentipid.com.ph 127.0.0.1',
      '--no-sandbox'
    ]
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: false,
    viewport: { width: 1280, height: 850 }
  });

  const page = await context.newPage();
  console.log('Navigating to https://preview.rentipid.com.ph/login...');
  const res = await page.goto('https://preview.rentipid.com.ph/login', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  console.log('Login page loaded successfully! HTTP Status:', res.status());
  console.log('The dedicated browser is now active on your screen.');
  console.log('All requests to preview.rentipid.com.ph route directly to 127.0.0.1:443.');

  // Keep browser open and listen for navigations / session updates
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/auth/callback/')) {
      console.log(`\n>>> [LOCAL CALLBACK RECEIVED] Status: ${response.status()} URL: ${url}`);
    }
    if (url.includes('/api/auth/session') && response.status() === 200) {
      try {
        const session = await response.json();
        if (session?.user) {
          console.log(`\n>>> [LOCAL SESSION ACTIVE] User ID: ${session.user.id} Email: ${session.user.email} Name: ${session.user.name}`);
        }
      } catch (e) {}
    }
  });

  // Keep script alive while browser is open
  await new Promise((resolve) => {
    browser.on('disconnected', resolve);
  });
  console.log('Browser closed.');
}

main().catch(err => {
  console.error('Dedicated browser error:', err);
  process.exit(1);
});
