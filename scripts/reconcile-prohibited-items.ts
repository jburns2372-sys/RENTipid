/**
 * CLI Runner for Prohibited Items Reference-Data Reconciliation
 *
 * Usage:
 *   npx tsx scripts/reconcile-prohibited-items.ts [--dry-run] [--authorize-production-reference-reconciliation]
 *
 * Environment variables:
 *   TARGET_DB_URL or DATABASE_URL
 *   EXPECTED_DATABASE_NAME
 *   ALLOW_PROHIBITED_ITEMS_RECONCILIATION
 *   DRY_RUN
 */

import { reconcileProhibitedItems } from '../src/lib/prohibited-items/prohibited-items-reconciler';

async function main() {
  const isDryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
  const isProdAuthorized =
    process.argv.includes('--authorize-production-reference-reconciliation') ||
    process.env.ALLOW_PRODUCTION_PROHIBITED_ITEMS_RECONCILIATION === 'true';
  const isPreviewAuthorized =
    process.argv.includes('--authorize-preview-reference-reconciliation') ||
    process.env.ALLOW_PREVIEW_PROHIBITED_ITEMS_RECONCILIATION === 'true';

  const expectedDatabaseName = process.env.EXPECTED_DATABASE_NAME;
  const expectedEndpointId = process.env.EXPECTED_NEON_ENDPOINT_ID;
  const targetEnvironment = (process.env.REFERENCE_DATA_TARGET_ENVIRONMENT ||
    (process.argv.includes('--preview') ? 'preview' : process.argv.includes('--production') ? 'production' : undefined)) as 'production' | 'preview' | 'local' | undefined;

  const targetUrl = process.env.TARGET_DB_URL || process.env.DATABASE_URL;

  console.log('==================================================');
  console.log('  RENTipid Prohibited Items Reference Reconciler');
  console.log('==================================================');
  console.log(`MODE:                  ${isDryRun ? 'DRY_RUN (Read-Only Diff)' : 'MUTATION'}`);
  console.log(`TARGET_ENV:            ${targetEnvironment || 'UNSPECIFIED (FAIL-CLOSED)'}`);
  console.log(`EXPECTED_DB:           ${expectedDatabaseName || 'NONE_SPECIFIED'}`);
  console.log(`EXPECTED_ENDPOINT:     ${expectedEndpointId || 'NONE_SPECIFIED'}`);
  console.log(`AUTH_PROD:             ${isProdAuthorized}`);
  console.log(`AUTH_PREVIEW:          ${isPreviewAuthorized}`);
  console.log('--------------------------------------------------');

  const result = await reconcileProhibitedItems({
    databaseUrl: targetUrl,
    expectedDatabaseName,
    expectedEndpointId,
    targetEnvironment,
    allowProductionReconciliation: isProdAuthorized,
    allowPreviewReconciliation: isPreviewAuthorized,
    dryRun: isDryRun,
  });

  console.log('DATABASE_NAME:     ', result.databaseName);
  console.log('BEFORE_COUNT:      ', result.beforeCount);
  console.log('TO_CREATE / CREATED:', result.createdCount);
  console.log('TO_UPDATE / UPDATED:', result.updatedCount);
  console.log('UNCHANGED:         ', result.unchangedCount);
  console.log('UNEXPECTED:        ', result.unexpectedCount);
  console.log('TO_DELETE / DELETED:', result.deletedCount);
  console.log('CANONICAL_TOTAL:   ', result.canonicalCount);
  console.log('AFTER_COUNT:       ', result.afterCount);
  console.log('STATUS:            ', isDryRun ? 'DRY_RUN_COMPLETED' : 'RECONCILIATION_COMPLETED');

  if (result.diff.unexpected.length > 0) {
    console.log('\n[WARNING] Unexpected policies in database (NOT deleted):');
    for (const u of result.diff.unexpected) {
      console.log(` - ${u.policyCode} (${u.name})`);
    }
  }

  if (isDryRun && (result.createdCount > 0 || result.updatedCount > 0)) {
    console.log('\n[PLAN] Changes that would be applied:');
    for (const c of result.diff.toCreate) {
      console.log(` + CREATE: ${c.policyCode} - ${c.name}`);
    }
    for (const u of result.diff.toUpdate) {
      console.log(` ~ UPDATE: ${u.policyCode} - ${u.name} (reasons: ${u.reasons?.join('; ')})`);
    }
  }
}

main().catch((err) => {
  console.error('\n[FATAL] Prohibited items reconciliation failed safely:');
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
