const { execSync } = require('child_process');
const fs = require('fs');

const run = (cmd) => {
  try {
    return execSync(cmd).toString().trim().split('\n').filter(Boolean);
  } catch (e) {
    return [];
  }
};

const getClassification = (file) => {
  if (file.includes('docs/address-system/PASS4-CLOSED-FROZEN.md') || file.includes('PREVIEW-GOOGLE-PLACES-ACCEPTANCE.md') || file.includes('walkthrough.md') || file.includes('FINAL_CLOSEOUT_REPORT') || file.includes('EVIDENCE_INDEX')) return 'B';
  if (file.endsWith('.log') || file.endsWith('.txt') || file.endsWith('.json') && file.includes('jest-results') || file.includes('.zip') || file.includes('scratch/') || file.includes('.next/') || file.includes('playwright-report') || file.includes('test-results')) return 'C';
  if (file.includes('.env') || file.includes('secret')) return 'E';
  
  if (file.includes('src/components/address') || file.includes('src/lib/address') || file.includes('src/app/api/address') || file.includes('tests/address-system') || file.includes('tests/e2e/address-system') || file.includes('scripts/migrate-legacy-addresses') || file.includes('legacy-migration-constants')) {
    return 'A'; // PASS 4 files
  }
  
  return 'D'; // Unrelated existing work
};

const getReason = (c) => {
  if (c === 'A') return 'Required for frozen PASS 4 candidate';
  if (c === 'B') return 'Closure/evidence documentation';
  if (c === 'C') return 'Generated or temporary output';
  if (c === 'D') return 'Unrelated existing work';
  if (c === 'E') return 'Possible secret or sensitive file';
  return 'Unknown';
};

const branch = run('git branch --show-current')[0] || '';
const head = run('git rev-parse HEAD')[0] || '';

const statusLines = run('git status --short');
const isClean = statusLines.length === 0;

const modified = [];
const deleted = [];
const staged = [];
const untracked = [];

for (const line of statusLines) {
  const code = line.substring(0, 2);
  const file = line.substring(3).trim();
  
  const c = getClassification(file);
  const reason = getReason(c);
  const entry = `${file} | ${c} | ${reason}`;
  
  if (code === '??') {
    untracked.push(entry);
  } else if (code.includes('M')) {
    if (code[0] === 'M') staged.push(entry);
    if (code[1] === 'M') modified.push(entry);
  } else if (code.includes('D')) {
    if (code[0] === 'D') staged.push(entry);
    if (code[1] === 'D') deleted.push(entry);
  } else if (code.includes('A')) {
    staged.push(entry);
  }
}

const allEntries = [...modified, ...deleted, ...staged, ...untracked];
const hasSecrets = allEntries.some(e => e.includes('| E |'));
const hasUnrelated = allEntries.some(e => e.includes('| D |'));
const hasTemp = allEntries.some(e => e.includes('| C |'));
const hasRequired = allEntries.some(e => e.includes('| A |'));

console.log(`CURRENT_BRANCH = ${branch}`);
console.log(`CURRENT_HEAD = ${head}`);
console.log('');
console.log('MODIFIED_FILES:');
modified.forEach(f => console.log(f));
console.log('');
console.log('STAGED_FILES:');
staged.forEach(f => console.log(f));
console.log('');
console.log('UNTRACKED_FILES:');
untracked.forEach(f => console.log(f));
console.log('');
console.log('DELETED_FILES:');
deleted.forEach(f => console.log(f));
console.log('');
console.log(`POSSIBLE_SECRET_FILES_PRESENT = ${hasSecrets ? 'YES' : 'NO'}`);
console.log(`UNRELATED_WORK_PRESENT = ${hasUnrelated ? 'YES' : 'NO'}`);
console.log(`GENERATED_TEMP_FILES_PRESENT = ${hasTemp ? 'YES' : 'NO'}`);
console.log(`REQUIRED_RELEASE_CHANGES_UNCOMMITTED = ${hasRequired ? 'YES' : 'NO'}`);
console.log('');
console.log('RECOMMENDED_RELEASE_ACTION =');
if (hasRequired) console.log('- COMMIT_REQUIRED_RELEASE_FILES');
if (hasUnrelated) console.log('- STASH_UNRELATED_WORK');
if (hasTemp) console.log('- REMOVE_ONLY_GENERATED_TEMP_FILES');
if (hasSecrets) console.log('- SECRET_REMEDIATION_REQUIRED');
console.log('');
console.log(`SAFE_TO_PREPARE_CLEAN_RELEASE_COMMIT = ${!hasSecrets ? 'YES' : 'NO'}`);
