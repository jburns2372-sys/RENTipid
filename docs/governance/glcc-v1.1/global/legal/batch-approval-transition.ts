/**
 * RENTipid GLCC v1.1 — Batch Legal Approval Transition Mechanism
 *
 * Controlling Master: RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0
 * Work Package: GLOBAL-W1-E Batch Legal Approval Promotion
 *
 * This script deterministically transitions all 32 translation work packages
 * from COMPLIANCE_REVIEW to APPROVED_FOR_QA in one batch operation once
 * legitimate human legal/compliance sign-off is verified in the sign-off package.
 *
 * SAFEGUARDS:
 * - Fail-closed: Exits without mutations if sign-off package is still PENDING.
 * - Requires explicit reviewer identity and non-null approval reference.
 * - Supports dry-run execution (--dry-run).
 */

import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../../../..');
const SIGNOFF_PATH = path.join(
  REPO_ROOT,
  'docs/governance/glcc-v1.1/global/legal/GLOBAL_W1_LEGAL_COMPLIANCE_SIGNOFF_PACKAGE.json'
);
const LANG_DIR = path.join(REPO_ROOT, 'docs/governance/glcc-v1.1/languages');

export interface BatchTransitionResult {
  transitionExecuted: boolean;
  dryRun: boolean;
  totalPackagesUpdated: number;
  totalMessagesApproved: number;
  newWorkflowState: string;
  error?: string;
}

export function executeBatchApprovalTransition(options: { dryRun?: boolean } = {}): BatchTransitionResult {
  const dryRun = options.dryRun ?? false;

  if (!fs.existsSync(SIGNOFF_PATH)) {
    throw new Error(`Signoff package not found at: ${SIGNOFF_PATH}`);
  }

  const signoff = JSON.parse(fs.readFileSync(SIGNOFF_PATH, 'utf-8'));
  const reviewer = signoff.governanceAuthorities?.legalComplianceReviewer;

  // Fail-closed guard: check for verified human legal signoff
  if (
    signoff.classCLegalApproval !== 'APPROVED' ||
    !reviewer ||
    reviewer.identity === 'PENDING GOVERNED ASSIGNMENT' ||
    !reviewer.signature ||
    !reviewer.approvalReference
  ) {
    return {
      transitionExecuted: false,
      dryRun,
      totalPackagesUpdated: 0,
      totalMessagesApproved: 0,
      newWorkflowState: 'COMPLIANCE_REVIEW',
      error: 'LEGAL_SIGNOFF_NOT_VERIFIED: Human legal/compliance reviewer assignment and approval required before transition.'
    };
  }

  const langDirs = fs
    .readdirSync(LANG_DIR)
    .filter((d) => fs.statSync(path.join(LANG_DIR, d)).isDirectory());

  let totalUpdated = 0;
  let totalApproved = 0;

  for (const lang of langDirs) {
    const pkgPath = path.join(LANG_DIR, lang, 'work', `${lang}-translation-work-package.json`);
    if (!fs.existsSync(pkgPath)) continue;

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    let pkgApproved = 0;

    for (const [key, msg] of Object.entries<any>(pkg.messages)) {
      if (msg.contentClass === 'CLASS_C_CONTROLLED_LEGAL_COMPLIANCE') {
        msg.legalApprovalStatus = 'APPROVED';
        msg.reviewerReference = reviewer.identity;
        pkgApproved++;
      }
    }

    pkg.workflowState = 'APPROVED_FOR_QA';
    totalApproved += pkgApproved;
    totalUpdated++;

    if (!dryRun) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
    }
  }

  return {
    transitionExecuted: !dryRun,
    dryRun,
    totalPackagesUpdated: totalUpdated,
    totalMessagesApproved: totalApproved,
    newWorkflowState: 'APPROVED_FOR_QA'
  };
}

if (require.main === module) {
  const isDryRun = process.argv.includes('--dry-run');
  const result = executeBatchApprovalTransition({ dryRun: isDryRun });
  console.log(JSON.stringify(result, null, 2));
}
