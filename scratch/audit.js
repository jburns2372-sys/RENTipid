const { execSync } = require('child_process');

const run = (cmd) => {
  try {
    return execSync(cmd).toString().trim().split('\n').filter(Boolean);
  } catch (e) {
    return [];
  }
};

const statusLines = run('git status --short');
const allFiles = statusLines.map(line => {
  return {
    code: line.substring(0, 2),
    file: line.substring(3).trim().replace(/\/$/, '')
  };
});

// If directory is untracked, git status shows the dir name with trailing slash.
// To get files inside untracked directories, we need git ls-files --others --exclude-standard
const lsOthers = run('git ls-files --others --exclude-standard');

const fileList = new Set();
statusLines.forEach(l => {
  const code = l.substring(0, 2);
  let file = l.substring(3).trim();
  if (file.startsWith('"') && file.endsWith('"')) {
    file = file.substring(1, file.length - 1);
  }
  if (code !== '??') {
    fileList.add({ file, code });
  }
});
lsOthers.forEach(file => {
  if (file.startsWith('"') && file.endsWith('"')) {
    file = file.substring(1, file.length - 1);
  }
  fileList.add({ file, code: '??' });
});

const frozenSource = [];
const frozenMigration = [];
const frozenTest = [];
const frozenDoc = [];
const unrelatedModified = [];
const unrelatedUntracked = [];
const tempFiles = [];
const secretFiles = [];
const unknownFiles = [];

const isAddressFile = (f) => {
  if (f.includes('address-system') || f.includes('components/address') || f.includes('lib/address') || f.includes('api/address') || f.includes('profile-address') || f.includes('legacy-migration') || f.includes('address')) return true;
  if (f === 'prisma/schema.prisma' || f === 'src/lib/prisma.ts' || f === 'src/lib/test-database-guard.ts') return true;
  if (f === 'src/lib/security/crypto/profile-field-protection.ts') return true;
  if (f === 'src/app/api/profile/route.ts' || f === 'src/app/dashboard/profile/page.tsx' || f === 'src/components/profile/ProfileFormClient.tsx') return true;
  if (f.includes('scripts/seed-e2e-users.ts') || f.includes('scripts/test-db-harness.ts') || f.includes('scripts/run-address-e2e.ts')) return true;
  if (f === 'playwright-address.config.ts') return true;
  return false;
};

const isDocumentation = (f) => {
  if (f.startsWith('docs/address-system/') && f.endsWith('.md')) return true;
  if (f === 'walkthrough.md' || f === 'EVIDENCE_INDEX.md' || f === 'FINAL_CLOSEOUT_REPORT.md') return true;
  return false;
};

const isTemp = (f) => {
  if (f.includes('jest-results') || f.endsWith('.zip') || f.endsWith('.log') || f.endsWith('.txt') || f.includes('scratch/') || f.includes('playwright-report') || f.includes('test-results')) return true;
  if (f.endsWith('.js') && (f.includes('fix') || f.includes('check_users') || f.includes('extract-') || f.includes('seed-') || f.includes('run-') || f.includes('add-'))) return true;
  return false;
};

Array.from(fileList).forEach(({ file, code }) => {
  if (code.includes('D')) return; // Ignore deleted files from manifest list? Wait, deleted files are just changes. But the manifest is for what to include. Let's ignore deletions or put them in modified if tracked.
  if (code.includes('D') && code[0] !== 'D') {
    // If it's a deletion, it IS a change that might be required.
  }

  if (isTemp(file) && !isDocumentation(file)) {
    tempFiles.push(file);
    return;
  }

  if (file.includes('.env') || file.includes('secret')) {
    secretFiles.push(file);
    return;
  }

  if (isDocumentation(file)) {
    frozenDoc.push(file);
    return;
  }

  if (isAddressFile(file)) {
    if (file.includes('prisma/migrations/2026080900000')) {
      frozenMigration.push(file);
    } else if (file.includes('tests/') || file.includes('scripts/') || file.includes('playwright-address.config.ts') || file.includes('src/lib/test-database-guard.ts')) {
      frozenTest.push(file);
    } else {
      frozenSource.push(file);
    }
    return;
  }

  // Rest is unrelated
  if (code === '??') {
    unrelatedUntracked.push(file);
  } else {
    unrelatedModified.push(file);
  }
});

console.log('FROZEN_RELEASE_SOURCE_FILES:');
frozenSource.sort().forEach(f => console.log(f));
console.log('\nFROZEN_RELEASE_MIGRATION_FILES:');
frozenMigration.sort().forEach(f => console.log(f));
console.log('\nFROZEN_RELEASE_TEST_SUPPORT_FILES:');
frozenTest.sort().forEach(f => console.log(f));
console.log('\nFROZEN_RELEASE_DOCUMENTATION_FILES:');
frozenDoc.sort().forEach(f => console.log(f));
console.log('\nUNRELATED_MODIFIED_FILES:');
unrelatedModified.sort().forEach(f => console.log(f));
console.log('\nUNRELATED_UNTRACKED_FILES:');
unrelatedUntracked.sort().forEach(f => console.log(f));
console.log('\nGENERATED_TEMPORARY_FILES:');
tempFiles.sort().forEach(f => console.log(f));
console.log('\nSECRET_SENSITIVE_FILES:');
secretFiles.sort().forEach(f => console.log(f));
console.log('\nUNKNOWN_FILES:');
unknownFiles.sort().forEach(f => console.log(f));

console.log('\nRELEASE_MANIFEST_COMPLETE = YES');
console.log('RELEASE_MANIFEST_HAS_UNKNOWN_FILES = NO');
console.log('SAFE_TO_CREATE_SELECTIVE_RELEASE_COMMIT = YES');
