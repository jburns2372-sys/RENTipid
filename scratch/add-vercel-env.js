const { execSync } = require('child_process');
const fs = require('fs');

const envContent = fs.readFileSync('.env.preview.agent.local', 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);

if (dbUrlMatch && dbUrlMatch[1]) {
  const dbUrl = dbUrlMatch[1].trim();
  console.log('Adding DATABASE_URL securely (value not logged)');
  execSync(`npx vercel env add DATABASE_URL preview --git-branch feature/soc-phase4-threat-response --force --sensitive`, {
    input: dbUrl,
    stdio: ['pipe', 'inherit', 'inherit']
  });
  console.log('Successfully added.');
} else {
  console.error('Could not find DATABASE_URL in .env.preview.agent.local');
}
