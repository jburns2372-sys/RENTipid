const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
  const prisma = new PrismaClient();
  const sql = fs.readFileSync('prisma/migrations/20260813040000_phase6_approval_scheduling/migration.sql', 'utf16le').replace(/^\uFEFF/, '');
  
  try {
    console.log('Executing migration script...');
    // We can't execute raw sql strings directly with multiple statements using executeRawUnsafe in some versions of Prisma
    // But we'll try splitting by statement or just running it. 
    // Prisma client $executeRawUnsafe supports multiple statements if we pass them.
    const statements = sql.split(';').filter(stmt => stmt.trim() !== '');
    for (const stmt of statements) {
      await prisma.$executeRawUnsafe(stmt + ';');
    }
    console.log('Migration applied successfully.');
  } catch (e) {
    console.error('Failed to apply migration:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
