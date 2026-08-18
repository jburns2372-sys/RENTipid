import * as fs from 'fs';
import * as path from 'path';

describe('Phase 5I: Supply Chain and CI/CD Workflow Security', () => {
  const workflowPath = path.resolve(__dirname, '../../../.github/workflows/azure-deploy.yml');
  const packageLockPath = path.resolve(__dirname, '../../../package-lock.json');
  let workflowContent: string;

  beforeAll(() => {
    workflowContent = fs.readFileSync(workflowPath, 'utf8');
  });

  it('verifies package-lock.json is present', () => {
    expect(fs.existsSync(packageLockPath)).toBe(true);
  });

  it('uses npm ci instead of npm install for dependency installation', () => {
    expect(workflowContent).toMatch(/npm ci/);
    expect(workflowContent).not.toMatch(/npm install/);
  });

  it('ensures third-party actions are SHA-pinned', () => {
    // Matches uses: author/action@SHA (40 hex chars)
    const actionPattern = /uses:\s+([^@\n]+)@([a-f0-9]{40})/gi;

    // We expect 4 third-party actions in the azure-deploy.yml:
    // actions/checkout, actions/setup-node, azure/login, azure/container-apps-deploy-action
    const matches = [...workflowContent.matchAll(actionPattern)];
    expect(matches.length).toBeGreaterThanOrEqual(4);

    const unpinnedPattern = /uses:\s+([^@\n]+)@v\d+(?!\w)/gi;
    const unpinnedMatches = [...workflowContent.matchAll(unpinnedPattern)];
    expect(unpinnedMatches.length).toBe(0);
  });

  it('ensures workflow permissions use least privilege', () => {
    expect(workflowContent).toMatch(/permissions:/);
    expect(workflowContent).not.toMatch(/permissions:\s*write-all/i);
    expect(workflowContent).toMatch(/contents:\s*read/i);
  });

  it('ensures no environment dump exists', () => {
    // Specifically looking for commands dumping the env
    expect(workflowContent).not.toMatch(/(printenv|env\s*>|export\s*>|env\s*\|)/i);
  });

  it('ensures no plaintext secret or secret echo appears', () => {
    expect(workflowContent).not.toMatch(/echo\s+['"]?\$[a-zA-Z_]+/i);
    expect(workflowContent).not.toMatch(/echo\s+.*secrets\./i);
  });

  it('ensures no automatic dependency fix exists', () => {
    expect(workflowContent).not.toMatch(/npm audit fix/i);
    expect(workflowContent).not.toMatch(/npm update/i);
  });

  it('verifies existing deployment job and intended trigger remain present', () => {
    expect(workflowContent).toMatch(/on:\s*push:/);
    expect(workflowContent).toMatch(/jobs:\s*build-and-deploy:/);
    expect(workflowContent).toMatch(/Deploy to Azure Container Apps/);
  });
});
