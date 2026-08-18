const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`DELETE FROM _prisma_migrations WHERE migration_name = '20260818020548_unified_multi_login_auth_v1'`);
  console.log("Deleted wrong resolution 1");
  await prisma.$executeRawUnsafe(`DELETE FROM _prisma_migrations WHERE migration_name = '20260818023102_merge_functional_modules'`);
  console.log("Deleted wrong resolution 2");
}
main().catch(console.error);
