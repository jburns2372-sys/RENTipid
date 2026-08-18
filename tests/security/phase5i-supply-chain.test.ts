import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('Phase 5I: Supply Chain and Build Manifest Security', () => {
  it('BUILD_MANIFEST_USES_ACTUAL_FILE_HASHES', () => {
    // Generate manifest first
    const scriptPath = path.join(__dirname, '../../scripts/security/create-build-manifest.mjs');
    execSync(`node "${scriptPath}"`);

    const manifestPath = path.join(__dirname, '../../build-manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.SOURCE_COMMIT).toBeDefined();
    expect(manifest.PACKAGE_JSON_SHA256).toBeDefined();

    // Verify hash actually matches package.json
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(fs.readFileSync(packageJsonPath)).digest('hex');
    expect(manifest.PACKAGE_JSON_SHA256).toBe(hash);
  });

  it('BUILD_MANIFEST_EXCLUDES_SECRETS', () => {
    const manifestPath = path.join(__dirname, '../../build-manifest.json');
    const content = fs.readFileSync(manifestPath, 'utf8');

    // Test that common secret keys are not present in the manifest
    expect(content).not.toMatch(/password/i);
    expect(content).not.toMatch(/secret/i);
    expect(content).not.toMatch(/token/i);
    expect(content).not.toMatch(/api_key/i);
    expect(content).not.toMatch(/private_key/i);
    expect(content).not.toMatch(/DATABASE_URL/i);
  });
});
