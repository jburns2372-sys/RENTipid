import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { execSync } from 'child_process';

// Load preview envs in correct order (highest priority last, with override)
if (fs.existsSync('.env.preview')) {
  dotenv.config({ path: '.env.preview', override: true });
}
if (fs.existsSync('.env.preview.agent.local')) {
  dotenv.config({ path: '.env.preview.agent.local', override: true });
}
if (fs.existsSync('.env.preview.local')) {
  dotenv.config({ path: '.env.preview.local', override: true });
}
// BUT wait, we know .env.preview.local has the WRONG database url (unparseable).
// We should make sure .env.preview.agent.local takes precedence!
if (fs.existsSync('.env.preview.agent.local')) {
  dotenv.config({ path: '.env.preview.agent.local', override: true });
}

// @ts-ignore
process.env.NODE_ENV = 'preview';

const command = process.argv.slice(2).join(' ');
console.log(`Running: ${command}`);

try {
  execSync(command, { stdio: 'inherit', env: process.env });
} catch (e: any) {
  process.exit(1);
}
