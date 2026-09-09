import { execSync } from 'child_process';
import { prisma } from '@/lib/prisma';
import { diffKnowledge } from '@/lib/ai/knowledge/synchronizer';
import { CANONICAL_CUSTOMER_OBJECTIVES } from '@/lib/ai/context/customer-objective-catalog';

export type KnowledgeImpactClassification =
  | 'NO_KNOWLEDGE_IMPACT'
  | 'KNOWLEDGE_UPDATE_REQUIRED';

export interface KnowledgeImpactReport {
  classification: KnowledgeImpactClassification;
  triggerFiles: readonly string[];
  missingSourcesCount: number;
  staleSourcesCount: number;
  duplicateIntentsCount: number;
  invalidAccessScopesCount: number;
  isCompliant: boolean;
  issues: readonly string[];
}

const KNOWLEDGE_SENSITIVE_PATTERNS = [
  /^src\/app\/\(marketing\)/,
  /^src\/app\/\(authenticated\)/,
  /^src\/app\/api\/(bookings|payments|payouts|listings|auth|kyc|insurance|claims)/,
  /^src\/lib\/(categories|prohibited-items|pricing|insurance|policies)/,
  /^src\/lib\/ai\/(context|knowledge)/,
  /^prisma\/schema\.prisma/,
];

export async function checkCustomerKnowledgeImpact(targetBranch = 'main'): Promise<KnowledgeImpactReport> {
  const issues: string[] = [];
  let triggerFiles: string[] = [];

  try {
    const diffOutput = execSync(`git diff --name-only origin/${targetBranch}...HEAD`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    triggerFiles = diffOutput
      .split('\n')
      .map(f => f.trim().replace(/\\/g, '/'))
      .filter(f => f.length > 0 && KNOWLEDGE_SENSITIVE_PATTERNS.some(pat => pat.test(f)));
  } catch {
    // If git diff fails (e.g. detached HEAD or single commit), inspect staged/working tree
    try {
      const statusOutput = execSync('git status --porcelain', { encoding: 'utf-8' });
      triggerFiles = statusOutput
        .split('\n')
        .map(line => line.slice(3).trim().replace(/\\/g, '/'))
        .filter(f => f.length > 0 && KNOWLEDGE_SENSITIVE_PATTERNS.some(pat => pat.test(f)));
    } catch {
      triggerFiles = [];
    }
  }

  const classification: KnowledgeImpactClassification = triggerFiles.length > 0
    ? 'KNOWLEDGE_UPDATE_REQUIRED'
    : 'NO_KNOWLEDGE_IMPACT';

  // Automated Machine-Blocking Integrity Checks
  let missingSourcesCount = 0;
  let staleSourcesCount = 0;
  let duplicateIntentsCount = 0;
  let invalidAccessScopesCount = 0;

  // 1. Verify all registered canonical knowledge sources exist in DB and have approved status
  const diff = await diffKnowledge(prisma);
  for (const item of diff.items) {
    if (item.action === 'CREATE') {
      missingSourcesCount++;
      issues.push(`MISSING_SOURCE:${item.sourceKey}`);
    } else if (item.action === 'UPDATE') {
      staleSourcesCount++;
      issues.push(`STALE_SOURCE:${item.sourceKey}`);
    }
  }

  const dbSources = await prisma.aiKnowledgeSource.findMany({
    where: { status: 'ACTIVE' },
    select: { sourceKey: true },
  });
  const dbSourceKeys = new Set(dbSources.map(s => s.sourceKey));

  // 2. Verify all customer objectives have valid non-dangling authorities
  for (const obj of CANONICAL_CUSTOMER_OBJECTIVES) {
    if (obj.answerContract.authorityClass === 'STATIC_KNOWLEDGE') {
      const sourceKey = obj.answerContract.knowledgeSourceKey ?? obj.answerContract.authorityReference;
      if (!dbSourceKeys.has(sourceKey)) {
        invalidAccessScopesCount++;
        issues.push(`INVALID_OBJECTIVE_SOURCE:${obj.objectiveId} -> ${sourceKey}`);
      }
    }
  }

  // 3. Verify zero duplicates in active canonical intents
  const activeIntents = await prisma.canonicalQuestionIntent.findMany({
    where: { status: 'ACTIVE' },
    select: { intentKey: true },
  });
  const keys = activeIntents.map(i => i.intentKey);
  const duplicates = keys.length - new Set(keys).size;
  if (duplicates > 0) {
    duplicateIntentsCount = duplicates;
    issues.push(`DUPLICATE_INTENTS_FOUND:${duplicates}`);
  }

  const isCompliant =
    missingSourcesCount === 0 &&
    staleSourcesCount === 0 &&
    duplicateIntentsCount === 0 &&
    invalidAccessScopesCount === 0 &&
    issues.length === 0;

  return {
    classification,
    triggerFiles: Object.freeze(triggerFiles),
    missingSourcesCount,
    staleSourcesCount,
    duplicateIntentsCount,
    invalidAccessScopesCount,
    isCompliant,
    issues: Object.freeze(issues),
  };
}

async function main() {
  console.log('🛡️ Running RENTipid Customer Knowledge Impact & Freshness Release Control...');
  const report = await checkCustomerKnowledgeImpact();

  console.log('\n============================================================');
  console.log('CUSTOMER KNOWLEDGE IMPACT CI CHECK REPORT');
  console.log('============================================================');
  console.log(`CLASSIFICATION:               ${report.classification}`);
  console.log(`SENSITIVE TRIGGER FILES:      ${report.triggerFiles.length}`);
  if (report.triggerFiles.length > 0) {
    report.triggerFiles.slice(0, 5).forEach(f => console.log(`  - ${f}`));
    if (report.triggerFiles.length > 5) console.log(`  ... and ${report.triggerFiles.length - 5} more files`);
  }
  console.log(`MISSING KNOWLEDGE SOURCES:    ${report.missingSourcesCount} (Must be 0)`);
  console.log(`STALE KNOWLEDGE SOURCES:      ${report.staleSourcesCount} (Must be 0)`);
  console.log(`DUPLICATE INTENTS:            ${report.duplicateIntentsCount} (Must be 0)`);
  console.log(`INVALID ACCESS SCOPES:        ${report.invalidAccessScopesCount} (Must be 0)`);
  console.log(`G10 MACHINE-BLOCKING STATUS:  ${report.isCompliant ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log('============================================================\n');

  if (!report.isCompliant) {
    console.error('❌ Machine-blocking Customer Knowledge Impact check FAILED with issues:');
    report.issues.forEach(i => console.error(`  - ${i}`));
    process.exit(1);
  }

  console.log('🎉 G10 Machine-Blocking Knowledge Check PASSED: 0 missing, 0 stale, 0 duplicate, 0 invalid.');
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error during knowledge impact check:', err);
    process.exit(1);
  }).finally(async () => {
    await prisma.$disconnect();
  });
}
