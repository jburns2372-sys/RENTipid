const { execSync } = require('child_process');
const fs = require('fs');

const envPreview = fs.readFileSync('.env.preview', 'utf-8');
const dbUrlMatch = envPreview.match(/^DATABASE_URL="(.*)"$/m);
const dbUrl = dbUrlMatch[1];
const env = { ...process.env, DATABASE_URL: dbUrl };

let success = false;
let attempts = 0;

while (!success && attempts < 10) {
  attempts++;
  try {
    console.log(`Attempt ${attempts}: Running prisma migrate deploy...`);
    execSync('npx prisma migrate deploy', { env, stdio: 'pipe' });
    console.log('Migration deploy succeeded!');
    success = true;
  } catch (err) {
    const output = err.stdout ? err.stdout.toString() : '';
    const errorOutput = err.stderr ? err.stderr.toString() : '';
    const combined = output + '\n' + errorOutput + '\n' + err.message;
    console.log('Migration deploy failed.');
    
    // Check if it's a P3018 (migration failed to apply) or similar because relation already exists
    const match = combined.match(/Migration name: (\d+_[a-zA-Z0-9_]+)/);
    if (match && match[1]) {
      const migrationName = match[1];
      console.log(`Detected failed migration: ${migrationName}. Attempting to resolve...`);
      try {
        execSync(`npx prisma migrate resolve --applied ${migrationName}`, { env, stdio: 'inherit' });
        console.log(`Resolved ${migrationName}`);
      } catch (resolveErr) {
        console.error(`Failed to resolve ${migrationName}: ${resolveErr.message}`);
        break; // Stop if we can't resolve it
      }
    } else {
      console.error('Could not determine failed migration name from output:');
      console.error(combined);
      break;
    }
  }
}
