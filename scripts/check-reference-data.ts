/**
 * CLI Runner for RENTipid Reference-Data Integrity Gate
 *
 * Usage:
 *   npx tsx scripts/check-reference-data.ts
 *
 * Exit code 0 on PASS, exit code 1 on FAIL.
 * Strictly READ-ONLY. Never mutates data.
 */

import { checkReferenceDataIntegrity } from '../src/lib/reference-data/reference-data-integrity';

async function main() {
  const databaseUrl = process.env.TARGET_DB_URL || process.env.DATABASE_URL;
  const expectedDatabaseName = process.env.EXPECTED_DATABASE_NAME;

  console.log('==================================================');
  console.log('  RENTipid Reference-Data Integrity Gate (Read-Only)');
  console.log('==================================================');

  const report = await checkReferenceDataIntegrity({
    databaseUrl,
    expectedDatabaseName,
  });

  console.log(`DATABASE:   ${report.databaseName} (${report.host})`);
  console.log(`CHECKED_AT: ${report.checkedAt}`);
  console.log('--------------------------------------------------');

  // Prohibited Items
  const pi = report.datasets.prohibitedItems;
  console.log(`[${pi.pass ? 'PASS' : 'FAIL'}] ProhibitedItemPolicy: ${pi.actualCount}/${pi.expectedCount} active canonical policies`);
  if (!pi.pass) {
    for (const err of pi.errors) {
      console.log(`       - ${err}`);
    }
  }

  // Categories
  const cat = report.datasets.categories;
  console.log(`[${cat.pass ? 'PASS' : 'FAIL'}] Category:             ${cat.actualCount}/${cat.expectedCount} active canonical categories`);
  if (!cat.pass) {
    for (const err of cat.errors) {
      console.log(`       - ${err}`);
    }
  }

  // AI Knowledge Center
  const ai = report.datasets.aiKnowledge;
  console.log(`[${ai.pass ? 'PASS' : 'FAIL'}] Unified AI Knowledge: ${ai.details.activeSources} active sources, ${ai.details.totalChunks} chunks`);
  if (!ai.pass) {
    for (const err of ai.errors) {
      console.log(`       - ${err}`);
    }
  }

  console.log('--------------------------------------------------');
  console.log(`OVERALL_REFERENCE_DATA_STATUS: ${report.overallPass ? 'PASS' : 'FAIL'}`);
  console.log('==================================================');

  if (!report.overallPass) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n[FATAL] Reference-data integrity check halted safely:');
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
