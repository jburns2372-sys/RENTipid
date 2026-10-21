const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { evaluateAudit, validateDispositionMetadata } = require('../../scripts/security/check-ci-audit.cjs');
const policy = require('../../scripts/security/ci-audit-policy.json');

const root = path.resolve(__dirname, '../..');
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));

// Minimal synthetic mock fixtures for contract assertions
function makeMockReport(findingName, findingDetails, metadataOverrides = {}) {
  const vulnerabilities = {
    [findingName]: findingDetails,
  };
  const severity = findingDetails.severity || 'high';
  const defaultMeta = {
    info: 0,
    low: 0,
    moderate: severity === 'moderate' ? 1 : 0,
    high: severity === 'high' ? 1 : 0,
    critical: severity === 'critical' ? 1 : 0,
    total: 1,
  };
  return {
    auditReportVersion: 2,
    vulnerabilities,
    metadata: {
      vulnerabilities: { ...defaultMeta, ...metadataOverrides },
    },
  };
}

test('1. exact approved braces advisory/path can be dispositioned', () => {
  const report = makeMockReport('braces', {
    name: 'braces',
    severity: 'high',
    nodes: ['node_modules/@next/eslint-plugin-next'], // dev node
    via: [
      {
        source: 1240992,
        name: 'braces',
        url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm',
      },
    ],
  });
  const mockLock = {
    packages: {
      'node_modules/@next/eslint-plugin-next': { dev: true },
    },
  };
  const result = evaluateAudit(report, 1, mockLock, policy);
  assert.equal(result.dispositionedCount, 1);
  assert.equal(result.effectiveCounts.high, 0);
  assert.equal(result.pass, true);
});

test('2. unrelated braces advisory still FAILS', () => {
  const report = makeMockReport('braces', {
    name: 'braces',
    severity: 'high',
    nodes: ['node_modules/@next/eslint-plugin-next'],
    via: [
      {
        source: 999999,
        name: 'braces',
        url: 'https://github.com/advisories/GHSA-unrelated-advisory-id',
      },
    ],
  });
  const mockLock = {
    packages: {
      'node_modules/@next/eslint-plugin-next': { dev: true },
    },
  };
  const result = evaluateAudit(report, 1, mockLock, policy);
  assert.equal(result.dispositionedCount, 0);
  assert.equal(result.effectiveCounts.high, 1);
  // Rejection occurs if not in general allowed set
  assert.equal(result.pass, false);
});

test('3. exact approved sprintf-js advisory/path can be dispositioned', () => {
  const report = makeMockReport('sprintf-js', {
    name: 'sprintf-js',
    severity: 'moderate',
    nodes: ['node_modules/sprintf-js'],
    via: [
      {
        source: 1241202,
        name: 'sprintf-js',
        url: 'https://github.com/advisories/GHSA-hp3w-g68c-fv3c',
      },
    ],
  });
  const mockLock = {
    packages: {
      'node_modules/sprintf-js': { dev: true },
    },
  };
  const result = evaluateAudit(report, 1, mockLock, policy);
  assert.equal(result.dispositionedCount, 1);
  assert.equal(result.effectiveCounts.moderate, 0);
  assert.equal(result.pass, true);
});

test('4. unrelated sprintf-js advisory still FAILS', () => {
  const report = makeMockReport('sprintf-js', {
    name: 'sprintf-js',
    severity: 'moderate',
    nodes: ['node_modules/sprintf-js'],
    via: [
      {
        source: 888888,
        name: 'sprintf-js',
        url: 'https://github.com/advisories/GHSA-other-sprintf-issue',
      },
    ],
  });
  const mockLock = {
    packages: {
      'node_modules/sprintf-js': { dev: true },
    },
  };
  const result = evaluateAudit(report, 1, mockLock, policy);
  assert.equal(result.dispositionedCount, 0);
  assert.equal(result.effectiveCounts.moderate, 1);
});

test('5. expired disposition FAILS', () => {
  const expiredPolicy = {
    ...policy,
    authorizedDispositions: [
      {
        dispositionId: 'DISP-EXPIRED',
        advisoryId: 'GHSA-vfj7-8cjw-p6xm',
        packageName: 'braces',
        classification: 'DEV_TOOLING_ONLY',
        productionRuntime: false,
        untrustedInputReachable: false,
        approvalReference: 'docs/test-approval.md',
        expiresOn: '2020-01-01', // Expired
      },
    ],
  };
  const report = makeMockReport('braces', {
    name: 'braces',
    severity: 'high',
    nodes: ['node_modules/@next/eslint-plugin-next'],
    via: [
      {
        source: 1240992,
        name: 'braces',
        url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm',
      },
    ],
  });
  const mockLock = {
    packages: {
      'node_modules/@next/eslint-plugin-next': { dev: true },
    },
  };
  const result = evaluateAudit(report, 1, mockLock, expiredPolicy);
  assert.equal(result.dispositionedCount, 0);
  assert.equal(result.pass, false);
});

test('6. missing approval reference FAILS', () => {
  const invalidPolicy = {
    ...policy,
    authorizedDispositions: [
      {
        dispositionId: 'DISP-NO-REF',
        advisoryId: 'GHSA-vfj7-8cjw-p6xm',
        packageName: 'braces',
        classification: 'DEV_TOOLING_ONLY',
        productionRuntime: false,
        untrustedInputReachable: false,
        approvalReference: '', // Missing
        expiresOn: '2027-01-20',
      },
    ],
  };
  assert.equal(validateDispositionMetadata(invalidPolicy.authorizedDispositions[0]), false);
});

test('7. production-runtime disposition FAILS', () => {
  const prodPolicy = {
    ...policy,
    authorizedDispositions: [
      {
        dispositionId: 'DISP-PROD-INVALID',
        advisoryId: 'GHSA-vfj7-8cjw-p6xm',
        packageName: 'braces',
        classification: 'DEV_TOOLING_ONLY',
        productionRuntime: true, // Prohibited
        untrustedInputReachable: false,
        approvalReference: 'docs/test.md',
        expiresOn: '2027-01-20',
      },
    ],
  };
  assert.equal(validateDispositionMetadata(prodPolicy.authorizedDispositions[0]), false);

  // Also test when node in lockfile is not dev: true (production runtime node)
  const report = makeMockReport('braces', {
    name: 'braces',
    severity: 'high',
    nodes: ['node_modules/braces'], // Prod node
    via: [
      {
        source: 1240992,
        name: 'braces',
        url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm',
      },
    ],
  });
  const prodLock = {
    packages: {
      'node_modules/braces': { dev: undefined }, // Production package!
    },
  };
  const result = evaluateAudit(report, 1, prodLock, policy);
  assert.equal(result.dispositionedCount, 0); // Must NOT be dispositioned
  assert.equal(result.pass, false);
});

test('8. global Moderate cap remains unchanged', () => {
  assert.equal(policy.maximumFindings.moderate, 4);
  assert.equal(policy.maximumFindings.critical, 0);
  assert.equal(policy.maximumFindings.info, 0);
  assert.equal(policy.maximumFindings.low, 0);
  assert.equal(policy.maximumFindings.high, 30);
});

test('9. raw npm audit evidence remains available and verified', () => {
  const report = makeMockReport(
    'sprintf-js',
    {
      name: 'sprintf-js',
      severity: 'moderate',
      nodes: ['node_modules/sprintf-js'],
      via: [{ source: 1241202, name: 'sprintf-js', url: 'https://github.com/advisories/GHSA-hp3w-g68c-fv3c' }],
    },
    { moderate: 2 } // Mismatch metadata count
  );
  const mockLock = { packages: { 'node_modules/sprintf-js': { dev: true } } };
  assert.throws(() => {
    evaluateAudit(report, 1, mockLock, policy);
  }, /Audit count mismatch/);
});
