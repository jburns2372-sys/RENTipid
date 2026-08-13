import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@127.0.0.1:5432/rentipid_address_local?schema=public'
    }
  }
});

async function main() {
  await prisma.$executeRawUnsafe('ALTER USER rentipid_test_user CREATEDB;');
  await prisma.$executeRawUnsafe('GRANT ALL ON SCHEMA public TO rentipid_test_user;');
  await prisma.$executeRawUnsafe('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rentipid_test_user;');
  console.log('Permissions granted successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
