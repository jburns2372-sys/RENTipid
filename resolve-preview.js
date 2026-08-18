const { execSync } = require('child_process');
const fs = require('fs');
const envPreview = fs.readFileSync('.env.preview', 'utf-8');
const dbUrlMatch = envPreview.match(/^DATABASE_URL="(.*)"$/m);
const dbUrl = dbUrlMatch[1];

try {
  execSync('npx prisma migrate resolve --applied 20260815010000_p7a_feedback_analytics', {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'inherit'
  });
  console.log('Resolved 20260815010000_p7a_feedback_analytics');
} catch(e) { console.error(e.message); }

try {
  execSync('npx prisma migrate resolve --applied 20260815020000_p7a_system_events', {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'inherit'
  });
} catch(e) { console.error(e.message); }

try {
  execSync('npx prisma migrate resolve --applied 20260818020548_unified_multi_login_auth_v1', {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'inherit'
  });
} catch(e) { console.error(e.message); }

try {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'inherit'
  });
} catch(e) { console.error(e.message); }
