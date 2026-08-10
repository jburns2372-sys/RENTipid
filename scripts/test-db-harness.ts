import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

async function main() {
  const dbName = `rentipid_test_soc_${crypto.randomBytes(4).toString('hex')}`;
  const rootDbUrl = 'postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public';
  const testDbUrl = `postgresql://postgres:postgres@127.0.0.1:5432/${dbName}?schema=public`;

  const prisma = new PrismaClient({ datasources: { db: { url: rootDbUrl } } });

  console.log(`Creating database ${dbName}...`);
  await prisma.$executeRawUnsafe(`CREATE DATABASE ${dbName};`);
  await prisma.$disconnect();

  try {
    console.log('Running prisma migrate deploy...');
    execSync(`npx prisma migrate deploy`, { 
      env: { ...process.env, DATABASE_URL: testDbUrl, DIRECT_URL: testDbUrl, NODE_ENV: 'test', ALLOW_TEST_DATABASE_MUTATION: 'true' },
      stdio: 'inherit'
    });

    console.log('Running Jest test suite for Address...');
    const args = process.argv.slice(2).join(' ') || 'tests/address-system';
    const result = execSync(`npx jest ${args} --runInBand --json --outputFile=jest-results.json`, {
      env: { 
        ...process.env, 
        DATABASE_URL: testDbUrl, 
        DIRECT_URL: testDbUrl,
        NODE_ENV: 'test', 
        SECURITY_TELEMETRY_HMAC_KEY: '0123456789abcdef0123456789abcdef',
        SOC_CORRELATION_HMAC_KEY: '0123456789abcdef0123456789abcdef'
      },
      stdio: 'pipe'
    });
    console.log(result.toString());

  } catch (error: unknown) {
    console.error('Test run failed or returned non-zero code.');
    const execError = error as { stdout?: Buffer; stderr?: Buffer };
    if (execError.stdout) console.log(execError.stdout.toString());
    if (execError.stderr) console.error(execError.stderr.toString());
  } finally {
    console.log(`Dropping database ${dbName}...`);
    const dropPrisma = new PrismaClient({ datasources: { db: { url: rootDbUrl } } });
    
    // Drop connections if any
    await dropPrisma.$executeRawUnsafe(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${dbName}' AND pid <> pg_backend_pid();
    `);
    await dropPrisma.$executeRawUnsafe(`DROP DATABASE ${dbName};`);
    await dropPrisma.$disconnect();
  }
}

main().catch(console.error);
