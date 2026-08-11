const { execSync } = require('child_process');
const fs = require('fs');

const envPreview = fs.readFileSync('.env.preview', 'utf-8');
const dbUrlMatch = envPreview.match(/^DATABASE_URL="(.*)"$/m);

if (!dbUrlMatch) {
  console.error('DATABASE_URL not found in .env.preview');
  process.exit(1);
}

const dbUrl = dbUrlMatch[1];
console.log('Got preview DB URL');

try {
  console.log('Running migrate deploy...');
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'inherit'
  });
  console.log('Running sync script...');
  execSync('npx tsx scripts/psgc-sync.ts', {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'inherit'
  });
  console.log('Done.');
} catch (e) {
  console.error('Failed:', e.message);
  process.exit(1);
}
