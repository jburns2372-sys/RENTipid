const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
  const prisma = new PrismaClient();
  const sql = fs.readFileSync('phase7.sql', 'utf16le').replace(/^\uFEFF/, '');
  
  try {
    console.log('Executing Phase 7 migration script...');
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
