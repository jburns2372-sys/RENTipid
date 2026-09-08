import { seedCanonicalIntents } from '../src/lib/ai/context/canonical-intent-registry';
import { runDuplicateIntentAudit } from '../src/lib/ai/knowledge/duplicate-intent-auditor';
import { generateQuestionCoverageMatrix } from '../src/lib/ai/knowledge/question-coverage-matrix';

async function main() {
  console.log('🔍 Seeding canonical intents and access scopes...');
  const seedResult = await seedCanonicalIntents();
  console.log(`✅ Seed complete: Created ${seedResult.createdCount}, Updated ${seedResult.updatedCount}, Unchanged ${seedResult.unchangedCount}, Deleted ${seedResult.deletedCount}`);

  console.log('\n📊 Running zero-duplication audit...');
  const audit = await runDuplicateIntentAudit();
  console.log('Audit Metrics Result:');
  console.log(`  CANONICAL_INTENT_DUPLICATES: ${audit.CANONICAL_INTENT_DUPLICATES}`);
  console.log(`  CANONICAL_QUESTION_DUPLICATES: ${audit.CANONICAL_QUESTION_DUPLICATES}`);
  console.log(`  NORMALIZED_QUESTION_DUPLICATES: ${audit.NORMALIZED_QUESTION_DUPLICATES}`);
  console.log(`  ALIAS_DUPLICATES: ${audit.ALIAS_DUPLICATES}`);
  console.log(`  CANONICAL_ALIAS_COLLISIONS: ${audit.CANONICAL_ALIAS_COLLISIONS}`);
  console.log(`  UNJUSTIFIED_ROLE_DUPLICATES: ${audit.UNJUSTIFIED_ROLE_DUPLICATES}`);
  console.log(`  UNJUSTIFIED_AUTHORITY_DUPLICATES: ${audit.UNJUSTIFIED_AUTHORITY_DUPLICATES}`);
  console.log(`  UNJUSTIFIED_ANSWER_COPIES: ${audit.UNJUSTIFIED_ANSWER_COPIES}`);
  console.log(`  OUT_OF_SCOPE_QUESTIONS: ${audit.OUT_OF_SCOPE_QUESTIONS}`);

  if (!audit.passed) {
    console.error('❌ Zero-duplication audit FAILED:', audit.issues);
    process.exit(1);
  }
  console.log('✅ Zero-duplication audit PASSED (All metrics = 0)');

  console.log('\n📈 Generating 6-D Coverage Matrix...');
  const matrix = await generateQuestionCoverageMatrix();
  console.log(`Total Cells Checked: ${matrix.totalCellsChecked}`);
  console.log(`Applicable Cells: ${matrix.applicableCells}`);
  console.log(`Not Applicable Cells: ${matrix.notApplicableCells}`);
  console.log(`Covered Cells: ${matrix.coveredCells}`);
  console.log(`Partial Cells: ${matrix.partialCells}`);
  console.log(`Missing Cells: ${matrix.missingCells}`);
  console.log(`Coverage Rate: ${matrix.coverageRatePercent.toFixed(2)}%`);

  console.log('\n🎉 Question Coverage and Zero-Duplication Check Complete!');
}

main().catch(err => {
  console.error('Fatal error during check-question-coverage:', err);
  process.exit(1);
});
