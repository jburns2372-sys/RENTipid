import fs from 'fs';
import crypto from 'crypto';
import { execSync } from 'child_process';
import path from 'path';

function getSha256(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function getCommit() {
  try { return execSync('git rev-parse HEAD').toString().trim(); } catch { return 'unknown'; }
}

function getBranch() {
  try { return execSync('git rev-parse --abbrev-ref HEAD').toString().trim(); } catch { return 'unknown'; }
}

const manifest = {
  SOURCE_COMMIT: getCommit(),
  BRANCH_OR_REF: process.env.GITHUB_REF || getBranch(),
  BUILD_TIMESTAMP_UTC: new Date().toISOString(),
  NODE_VERSION: process.version,
  PACKAGE_MANAGER_VERSION: execSync('npm -v').toString().trim(),
  PACKAGE_JSON_SHA256: getSha256('package.json'),
  LOCKFILE_SHA256: getSha256('package-lock.json'),
  SBOM_SHA256: getSha256('bom.json'),
  BUILD_ARTIFACT_SHA256_VALUES: {},
  CI_RUN_IDENTIFIER: process.env.GITHUB_RUN_ID || 'local'
};

// Hash Next.js build artifacts if they exist
const nextBuildDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextBuildDir)) {
  const files = fs.readdirSync(nextBuildDir, { recursive: true });
  for (const file of files) {
    const fullPath = path.join(nextBuildDir, file);
    if (fs.statSync(fullPath).isFile()) {
      // Limit to key files to prevent massive manifests
      if (file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.html')) {
        manifest.BUILD_ARTIFACT_SHA256_VALUES[file] = getSha256(fullPath);
      }
    }
  }
}

fs.writeFileSync('build-manifest.json', JSON.stringify(manifest, null, 2));
console.log('Build manifest generated at build-manifest.json');
