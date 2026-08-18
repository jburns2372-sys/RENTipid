import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load preview envs
if (fs.existsSync('.env.preview.local')) {
  dotenv.config({ path: '.env.preview.local', override: true });
}
if (fs.existsSync('.env.preview.agent.local')) {
  dotenv.config({ path: '.env.preview.agent.local', override: true });
}
if (fs.existsSync('.env.preview')) {
  dotenv.config({ path: '.env.preview', override: true });
}

console.log('VERCEL_ENV:', process.env.VERCEL_ENV || 'preview (assumed)');

const dbUrl = process.env.DATABASE_URL;
console.log('DATABASE_URL:', dbUrl ? 'PRESENT' : 'MISSING');

let parseable = 'NO';
let isProd = 'YES (UNKNOWN)';
let dbIdentity = 'UNKNOWN';

if (dbUrl) {
  try {
    const parsed = new URL(dbUrl);
    parseable = 'YES';
    
    // Check if production
    if (parsed.hostname.includes('prod') || process.env.VERCEL_ENV === 'production') {
      isProd = 'YES';
      dbIdentity = 'PRODUCTION';
    } else {
      isProd = 'NO';
      dbIdentity = 'PREVIEW';
    }
  } catch (e) {
    parseable = 'NO';
  }
}

console.log('DATABASE_IDENTITY:', dbIdentity);
console.log('DATABASE_URL_PARSEABLE:', parseable);
console.log('PRODUCTION_DATABASE:', isProd);
