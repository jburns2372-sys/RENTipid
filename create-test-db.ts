const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://rentipid_test_user:o3uHj8ds0ZV9CJpbY74U@127.0.0.1:5432/rentipid_test_soc?schema=public"
    }
  }
});

async function main() {
  await prisma.$executeRawUnsafe('CREATE DATABASE rentipid_test_migration;');
  console.log("Database created");
}

main().catch(console.error).finally(() => prisma.$disconnect());
