const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

console.log("=== RENTipid Phase 17 Live Pilot Environment Check ===");

const requiredVars = [
  'PAYMENT_PROVIDER_MODE',
  'PAYMENT_LIVE_MODE',
  'PAYMONGO_PUBLIC_KEY_LIVE',
  'PAYMONGO_SECRET_KEY_LIVE',
  'PAYMONGO_WEBHOOK_SECRET_LIVE',
  'PAYMONGO_LIVE_ENABLED',
  'APP_BASE_URL'
];

let missing = 0;

for (const v of requiredVars) {
  if (process.env[v]) {
    console.log(`[PASS] ${v} is present.`);
  } else {
    console.log(`[FAIL] ${v} is MISSING.`);
    missing++;
  }
}

console.log("\nAdditional Verification:");

if (process.env.APP_BASE_URL && process.env.APP_BASE_URL.startsWith('https://')) {
    console.log(`[PASS] APP_BASE_URL uses HTTPS.`);
} else if (process.env.APP_BASE_URL) {
    console.log(`[WARN] APP_BASE_URL does not use HTTPS. Ensure this is for local testing only.`);
}

console.log("========================================================\n");

if (missing > 0) {
  console.log(`FAILED. ${missing} required live environment variables are missing.`);
  console.log(`Live Pilot MUST NOT be enabled.`);
  process.exit(1);
} else {
  console.log(`SUCCESS. All required live environment variables are present.`);
  console.log(`Proceeding to Legal and Finance Readiness checklist is approved.`);
}
