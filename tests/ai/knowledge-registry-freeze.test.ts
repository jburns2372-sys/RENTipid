import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import {
  calculateKnowledgeRegistryFreezeHash,
  KNOWLEDGE_REGISTRY_FREEZE_PATH,
  KNOWLEDGE_REGISTRY_PATH,
  verifyKnowledgeRegistryFreeze,
} from '../../src/lib/ai/knowledge/source-registry';
import { hashKnowledgeRegistryText } from '../../src/lib/ai/knowledge/hashing';

const temporaryRoots: string[] = [];

function createFreezeRoot(registry: string, frozenRegistry = registry): string {
  const root = mkdtempSync(join(tmpdir(), 'rentipid-knowledge-freeze-'));
  temporaryRoots.push(root);
  const registryPath = join(root, KNOWLEDGE_REGISTRY_PATH);
  const freezePath = join(root, KNOWLEDGE_REGISTRY_FREEZE_PATH);
  mkdirSync(dirname(registryPath), { recursive: true });
  writeFileSync(registryPath, registry, 'utf8');
  writeFileSync(
    freezePath,
    `REGISTRY_SHA256: \`${hashKnowledgeRegistryText(frozenRegistry)}\`\n`,
    'utf8',
  );
  return root;
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('knowledge registry freeze integrity', () => {
  test('LF and equivalent CRLF registry text have the same canonical hash', () => {
    const lf = '# Registry\n\n| 1 | approved |\n';
    const crlf = lf.replace(/\n/g, '\r\n');
    expect(hashKnowledgeRegistryText(crlf)).toBe(hashKnowledgeRegistryText(lf));
  });

  test('equivalent CR-only registry text has the same canonical hash', () => {
    const lf = '# Registry\n\n| 1 | approved |\n';
    const cr = lf.replace(/\n/g, '\r');
    expect(hashKnowledgeRegistryText(cr)).toBe(hashKnowledgeRegistryText(lf));
  });

  test('UTF-8 registry content has a fixed deterministic digest', () => {
    expect(hashKnowledgeRegistryText('Caf\u00e9 \u6771\u4eac \u20b1\r\nApproved.\r\n'))
      .toBe('917E83E8AC16988C11836C83E1EE782A0E2067E932D7980E93772F789B726A3B');
  });

  test('a real content change produces a different integrity hash', () => {
    expect(hashKnowledgeRegistryText('policy: approved\n'))
      .not.toBe(hashKnowledgeRegistryText('policy: rejected\n'));
  });

  test('trailing-newline presence and non-line-ending characters remain integrity-significant', () => {
    expect(hashKnowledgeRegistryText('policy: approved'))
      .not.toBe(hashKnowledgeRegistryText('policy: approved\n'));
    expect(hashKnowledgeRegistryText('policy: approved '))
      .not.toBe(hashKnowledgeRegistryText('policy: approved'));
  });

  test('an unauthorized registry content change still triggers freeze mismatch', () => {
    const root = createFreezeRoot('policy: rejected\n', 'policy: approved\n');
    expect(() => verifyKnowledgeRegistryFreeze(root))
      .toThrow('KNOWLEDGE_REGISTRY_FREEZE_MISMATCH');
  });

  test('the exact registry and its CRLF package equivalent pass corrected validation', () => {
    const registry = readFileSync(KNOWLEDGE_REGISTRY_PATH, 'utf8');
    const freeze = readFileSync(KNOWLEDGE_REGISTRY_FREEZE_PATH, 'utf8');
    const expected = freeze.match(/REGISTRY_SHA256: `([A-F0-9]{64})`/)?.[1];
    expect(calculateKnowledgeRegistryFreezeHash()).toBe(expected);
    expect(() => verifyKnowledgeRegistryFreeze()).not.toThrow();

    const crlfRoot = createFreezeRoot(registry.replace(/\r?\n/g, '\r\n'), registry);
    expect(() => verifyKnowledgeRegistryFreeze(crlfRoot)).not.toThrow();
  });
});
