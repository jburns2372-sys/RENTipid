/**
 * RENTipid GLCC v1.1 — GLOBAL-W1-E Legal / Compliance Review Test Suite
 *
 * Controlling Master: RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0
 * Work Package: GLOBAL-W1-E Consolidated Multilingual Legal Review
 *
 * Verifies:
 * 1. Class C dossier integrity (241 canonical keys, 32 languages, 7712 representations).
 * 2. Canonical-source identity & zero checksum drift (241/241 resolved to SRC-GLCC-* v1.0.1).
 * 3. Cryptographic translation checksum integrity across all 7712 representations.
 * 4. Semantic-review artifact completeness (matrix, queue, sign-off package).
 * 5. Language/jurisdiction independence (0 jurisdiction substitutions).
 * 6. Global legal review matrix integrity (P1=16, P2=104, P3=121).
 * 7. Batch approval-transition readiness & fail-closed execution safety.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { executeBatchApprovalTransition } from '../../docs/governance/glcc-v1.1/global/legal/batch-approval-transition';

const REPO_ROOT = path.resolve(__dirname, '../..');
const DOSSIER_PATH = path.join(
  REPO_ROOT,
  'docs/governance/glcc-v1.1/global/legal/GLOBAL_W1_CLASS_C_MULTILINGUAL_REVIEW_DOSSIER.json'
);
const MATRIX_PATH = path.join(
  REPO_ROOT,
  'docs/governance/glcc-v1.1/global/legal/GLOBAL_W1_CLASS_C_REVIEW_MATRIX.json'
);
const QUEUE_PATH = path.join(
  REPO_ROOT,
  'docs/governance/glcc-v1.1/global/legal/GLOBAL_W1_HUMAN_LEGAL_REVIEW_QUEUE.json'
);
const SIGNOFF_PATH = path.join(
  REPO_ROOT,
  'docs/governance/glcc-v1.1/global/legal/GLOBAL_W1_LEGAL_COMPLIANCE_SIGNOFF_PACKAGE.json'
);

describe('GLCC GLOBAL-W1-E: Consolidated Legal & Compliance Review Test Suite', () => {
  let dossier: any;
  let matrix: any;
  let queue: any;
  let signoff: any;

  beforeAll(() => {
    dossier = JSON.parse(fs.readFileSync(DOSSIER_PATH, 'utf-8'));
    matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf-8'));
    queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
    signoff = JSON.parse(fs.readFileSync(SIGNOFF_PATH, 'utf-8'));
  });

  describe('1. Class C Dossier Integrity', () => {
    test('contains exactly 241 canonical Class C keys', () => {
      expect(dossier.entries.length).toBe(241);
      expect(dossier.totalClassCKeys).toBe(241);
    });

    test('every key covers all 32 target languages with PENDING approval status', () => {
      expect(dossier.overallLegalApprovalStatus).toBe('PENDING');
      for (const entry of dossier.entries) {
        expect(entry.translationsCount).toBe(32);
        expect(entry.controlledApprovalStatus).toBe('PENDING');
        expect(Object.keys(entry.translations).length).toBe(32);
        for (const [lang, t] of Object.entries<any>(entry.translations)) {
          expect(t.controlledApprovalStatus).toBe('PENDING');
          expect(t.targetText.trim().length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('2. Canonical-Source Identity & Zero Drift', () => {
    test('all 241 keys map to authoritative SRC-GLCC-* v1.0.1 sources', () => {
      for (const entry of dossier.entries) {
        expect(entry.authoritativeSourceId).toBe(`SRC-GLCC-${entry.canonicalKey}`);
        expect(entry.authoritativeSourceVersion).toBe('v1.0.1');
      }
    });

    test('source checksums match computed SHA-256 with 0 mismatches', () => {
      for (const entry of dossier.entries) {
        const hash = crypto
          .createHash('sha256')
          .update(entry.sourceText, 'utf-8')
          .digest('hex');
        expect(entry.sourceChecksum).toBe(hash);
      }
    });
  });

  describe('3. Cryptographic Translation Checksum Integrity', () => {
    test('all 7712 target representation checksums match sha256(targetText)', () => {
      let verifiedCount = 0;
      for (const entry of dossier.entries) {
        for (const [lang, t] of Object.entries<any>(entry.translations)) {
          const hash = crypto
            .createHash('sha256')
            .update(t.targetText, 'utf-8')
            .digest('hex');
          expect(t.translationChecksum).toBe(hash);
          verifiedCount++;
        }
      }
      expect(verifiedCount).toBe(241 * 32);
    });
  });

  describe('4. Semantic-Review Artifact Completeness', () => {
    test('review matrix contains exactly 241 records organized by canonical key', () => {
      expect(matrix.totalCanonicalKeys).toBe(241);
      expect(matrix.totalLanguages).toBe(32);
      expect(matrix.totalTargetRepresentations).toBe(7712);
      expect(matrix.records.length).toBe(241);
    });

    test('human review queue properly partitions records into 3 priority tiers', () => {
      const summary = queue.queueSummary;
      expect(summary.totalCanonicalKeys).toBe(241);
      expect(summary.totalTargetRepresentations).toBe(7712);
      expect(summary.priority1KeysCount).toBe(16);
      expect(summary.priority1RepresentationsCount).toBe(512);
      expect(summary.priority2KeysCount).toBe(104);
      expect(summary.priority2RepresentationsCount).toBe(3328);
      expect(summary.priority3KeysCount).toBe(121);
      expect(summary.priority3RepresentationsCount).toBe(3872);
      expect(summary.criticalMeaningDrift).toBe(0);
      expect(summary.remainingTechnicalDefects).toBe(0);
    });

    test('sign-off package accurately records governance authorities and fail-closed state', () => {
      expect(signoff.governanceAuthorities.approvalAuthority.status).toBe('ASSIGNED');
      expect(signoff.governanceAuthorities.approvalAuthority.name).toBe('Federico P. Diagono Jr.');
      expect(signoff.governanceAuthorities.legalComplianceReviewer.status).toBe('ASSIGNED');
      expect(signoff.governanceAuthorities.legalComplianceReviewer.identity).toBe('Juan Dela Cruz — Legal/Compliance Reviewer');
      expect(signoff.governanceAuthorities.legalComplianceReviewer.name).toBe('Juan Dela Cruz');
      expect(signoff.governanceAuthorities.legalComplianceReviewer.signature).toBeNull();
      expect(signoff.classCLegalApproval).toBe('PENDING');
      expect(signoff.overallSignoffStatus).toBe('PENDING_HUMAN_REVIEW');
    });

    test('reviewer certification record exists with assigned reviewer and pending decision', () => {
      const certPath = path.join(
        REPO_ROOT,
        'docs/governance/glcc-v1.1/global/legal/GLOBAL_W1_REVIEWER_CERTIFICATION.json'
      );
      expect(fs.existsSync(certPath)).toBe(true);
      const cert = JSON.parse(fs.readFileSync(certPath, 'utf-8'));
      expect(cert.governingAuthorities.reviewer.name).toBe('Juan Dela Cruz');
      expect(cert.governingAuthorities.reviewer.status).toBe('ASSIGNED');
      expect(cert.reviewerDecision.status).toBe('PENDING');
      expect(cert.reviewerDecision.reviewDate).toBe('PENDING');
      expect(cert.reviewerDecision.approvalReference).toBe('PENDING');
      expect(cert.reviewerDecision.signature).toBeNull();
      expect(cert.attestationDraft.statement).toContain('I, Juan Dela Cruz, acting as Legal/Compliance Reviewer');
      expect(cert.attestationDraft.status).toBe('UNEXECUTED_DRAFT');
    });
  });

  describe('5. Language / Jurisdiction Independence', () => {
    test('jurisdiction independence statement is enforced across all records', () => {
      for (const entry of dossier.entries) {
        expect(entry.jurisdictionIndependenceStatement).toContain('does not alter');
      }
    });

    test('zero statutory jurisdiction substitution errors', () => {
      expect(matrix.metrics.remainingTechnicalDefects).toBe(0);
      expect(signoff.automatedTechnicalFindings.jurisdictionSubstitutionErrors).toBe(0);
      expect(signoff.automatedTechnicalFindings.languageJurisdictionIndependence).toBe('PASS');
    });
  });

  describe('6. Batch Approval-Transition Readiness', () => {
    test('transition fails closed when legal sign-off has not been executed', () => {
      const result = executeBatchApprovalTransition({ dryRun: true });
      expect(result.transitionExecuted).toBe(false);
      expect(result.newWorkflowState).toBe('COMPLIANCE_REVIEW');
      expect(result.error).toContain('LEGAL_SIGNOFF_NOT_VERIFIED');
    });
  });
});
