const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');

const APPROVED_EXCLUSIONS = new Set([
  'RENTipid',
  'RENTIPID',
  'rentipid',
  'PHP',
  'USD',
  'JPY',
  'EUR',
  'GBP',
  '₱',
  '$',
  '¥',
  '€',
  'PayMongo',
  'Google',
  'Facebook',
  'Twilio',
  'Neon',
  'AWS',
  'Vercel',
  'Next.js',
  'React',
  'Prisma',
  'SOC',
  'KYC',
  'MFA',
  'OTP',
  'SMS',
  'AI',
  'LLM',
  'API',
  'DNS',
  'HTTPS',
  'HTTP',
  'URL',
  'ID',
  'UUID',
  'UTC',
  'GMT',
  'HTML',
  'CSS',
  'JSON',
  'en-PH',
  'fil-PH',
  'PH',
  'US',
  'JP',
  '#',
  '/',
  '-',
  '|',
  '·',
  '•',
  '&',
  '+',
  ':',
  'RentipidLogo',
]);

const IGNORED_PATHS = [
  'node_modules',
  '.next',
  'dist',
  'tests',
  '__tests__',
  '.git',
  'public',
];

function getAllFiles(dir, exts = ['.tsx', '.jsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (IGNORED_PATHS.some(p => file.includes(p))) continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, exts));
    } else if (exts.some(ext => file.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');

  // Count t(...) calls (migrated keys)
  const tMatches = content.match(/\bt\(\s*['"]([a-zA-Z0-9._-]+)['"]/g) || [];
  const migratedCount = tMatches.length;

  const hardCoded = [];
  const exclusions = [];

  // Match JSX text nodes: >Some text<
  const textNodeRegex = />([^<>{}\n]+)</g;
  let m;
  while ((m = textNodeRegex.exec(content)) !== null) {
    const raw = m[1].trim();
    if (!raw || raw.length <= 1) continue;
    // Skip if just punctuation/numbers
    if (/^[0-9\s.,\/#!$%\^&\*;:{}=\-_`~()|·•]+$/.test(raw)) continue;
    // Skip if starts with & (html entity)
    if (raw.startsWith('&')) continue;

    if (APPROVED_EXCLUSIONS.has(raw) || [...APPROVED_EXCLUSIONS].some(ex => raw === ex)) {
      exclusions.push({ text: raw, line: getLineNumber(content, m.index) });
    } else {
      hardCoded.push({ text: raw, line: getLineNumber(content, m.index), type: 'jsx_text' });
    }
  }

  // Match attributes: placeholder="...", title="...", alt="..."
  const attrRegex = /\b(placeholder|title|alt|aria-label)\s*=\s*["']([^"']+)["']/g;
  while ((m = attrRegex.exec(content)) !== null) {
    const attr = m[1];
    const raw = m[2].trim();
    if (!raw || raw.length <= 1) continue;
    if (/^[0-9\s.,\/#!$%\^&\*;:{}=\-_`~()|·•]+$/.test(raw)) continue;

    if (APPROVED_EXCLUSIONS.has(raw)) {
      exclusions.push({ text: raw, line: getLineNumber(content, m.index), attr });
    } else {
      hardCoded.push({ text: raw, line: getLineNumber(content, m.index), type: 'attr_' + attr });
    }
  }

  return {
    relPath,
    migratedCount,
    hardCoded,
    exclusions,
  };
}

function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

const allTsxFiles = [
  ...getAllFiles(path.join(SRC_DIR, 'app')),
  ...getAllFiles(path.join(SRC_DIR, 'components')),
];

let totalMigrated = 0;
let totalHardCoded = 0;
let totalExclusions = 0;
const perDir = {};
const sampleHardCodedByDir = {};

for (const f of allTsxFiles) {
  const res = auditFile(f);
  totalMigrated += res.migratedCount;
  totalHardCoded += res.hardCoded.length;
  totalExclusions += res.exclusions.length;

  const dirKey = res.relPath.split('/').slice(0, 3).join('/');
  perDir[dirKey] = perDir[dirKey] || { files: 0, hardCoded: 0, migrated: 0 };
  perDir[dirKey].files += 1;
  perDir[dirKey].hardCoded += res.hardCoded.length;
  perDir[dirKey].migrated += res.migratedCount;

  if (res.hardCoded.length > 0) {
    sampleHardCodedByDir[dirKey] = sampleHardCodedByDir[dirKey] || [];
    if (sampleHardCodedByDir[dirKey].length < 5) {
      sampleHardCodedByDir[dirKey].push(...res.hardCoded.slice(0, 3).map(h => `(${res.relPath}:${h.line}) "${h.text}"`));
    }
  }
}

console.log('=== AUDIT RESULTS SUMMARY ===');
console.log('TOTAL_TSX_FILES:', allTsxFiles.length);
console.log('HARD_CODED_USER_VISIBLE_STRINGS:', totalHardCoded);
console.log('MIGRATED_TO_TRANSLATION_KEYS:', totalMigrated);
console.log('APPROVED_EXCLUSIONS:', totalExclusions);
console.log('=============================');

module.exports = {
  totalTsxFiles: allTsxFiles.length,
  totalHardCoded,
  totalMigrated,
  totalExclusions,
  perDir,
  sampleHardCodedByDir,
};
