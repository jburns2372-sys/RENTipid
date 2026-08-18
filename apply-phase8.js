const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  const sqlFile = path.join(__dirname, 'prisma/migrations/20260813070000_phase8_campaign/migration.sql');
  
  // Read as UTF-16LE in case it was generated from powershell > redirect
  let sql = fs.readFileSync(sqlFile, 'utf16le');
  
  // If it doesn't look like valid SQL, maybe it was utf8
  if (!sql.includes('CREATE TABLE')) {
    sql = fs.readFileSync(sqlFile, 'utf8');
  }

  console.log("Read SQL, length: ", sql.length);
  
  try {
    // split by ';' and execute
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const statement of statements) {
      console.log("Executing:", statement.substring(0, 50));
      await prisma.$executeRawUnsafe(statement);
    }
    console.log("Migration applied successfully!");
    
    // Add to _prisma_migrations so it is tracked
    const checksum = "phase8_campaign_" + Date.now();
    await prisma.$executeRawUnsafe(`
      INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES ($1, $2, NOW(), $3, '', NULL, NOW(), 1)
    `, "phase8_" + Date.now(), checksum, "20260813070000_phase8_campaign");
    
    console.log("Migration recorded.");
  } catch(e) {
    console.error("Migration failed:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
