import { chunkKnowledge } from '../../src/lib/ai/knowledge/chunker';
import { hashNormalizedContent, hashStableObject } from '../../src/lib/ai/knowledge/hashing';
import { validateModuleKnowledgeRegistration } from '../../src/lib/ai/knowledge/module-contract';
import { normalizeKnowledgeText } from '../../src/lib/ai/knowledge/normalizer';
import { getKnowledgeRegistry, getSynchronizableKnowledgeRegistry } from '../../src/lib/ai/knowledge/source-registry';
import { resolveEffectiveKnowledgeVersion } from '../../src/lib/ai/knowledge/synchronizer';
import type { KnowledgeRegistryEntry } from '../../src/lib/ai/knowledge/types';
import { validateKnowledgeContent } from '../../src/lib/ai/knowledge/validator';
import { canAccessKnowledge, canChunkNarrowParent } from '../../src/lib/ai/knowledge/visibility';

describe('KB-1 Knowledge Engine', () => {
  test('frozen registry accounts for all 148 candidates exactly once', () => {
    const registry = getKnowledgeRegistry();
    expect(registry).toHaveLength(148);
    expect(new Set(registry.map(entry => entry.sourceKey)).size).toBe(148);
    expect(registry.filter(entry => !entry.disposition)).toHaveLength(0);
    expect(getSynchronizableKnowledgeRegistry()).toHaveLength(109);
  });

  test('normalization and SHA-256 hashing are formatting-stable', () => {
    const left = 'Cafe\u0301\r\n\r\n\r\nPolicy   \r\n';
    const right = 'Café\n\nPolicy';
    expect(normalizeKnowledgeText(left)).toBe(right);
    expect(hashNormalizedContent(left)).toBe(hashNormalizedContent(right));
    expect(hashNormalizedContent('approved A')).not.toBe(hashNormalizedContent('approved B'));
    expect(hashNormalizedContent(left)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashStableObject({ b: 2, a: 1 })).toBe(hashStableObject({ a: 1, b: 2 }));
  });

  test('chunking is deterministic, semantic, bounded, and preserves headings', () => {
    const content = `# Guide\n\nOverview.\n\n## Booking\n\n${'Booking guidance. '.repeat(180)}\n\n## Return\n\nReturn guidance.`;
    const first = chunkKnowledge('guide', content, ['booking'], 500);
    const second = chunkKnowledge('guide', content, ['booking'], 500);
    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(3);
    expect(first.every(chunk => chunk.content.length <= 500)).toBe(true);
    expect(first.some(chunk => chunk.headingPath.includes('Booking'))).toBe(true);
    expect(new Set(first.map(chunk => chunk.chunkKey)).size).toBe(first.length);
  });

  test('visibility uses existing roles, Super Admin inheritance, and SYSTEM_ONLY denial', () => {
    expect(canAccessKnowledge('PUBLIC', [], 'Guest')).toBe(true);
    expect(canAccessKnowledge('AUTHENTICATED', [], 'Renter')).toBe(true);
    expect(canAccessKnowledge('AUTHENTICATED', [], 'Guest')).toBe(false);
    expect(canAccessKnowledge('ROLE_SCOPED', ['Finance Admin'], 'Renter')).toBe(false);
    expect(canAccessKnowledge('ROLE_SCOPED', ['Finance Admin'], 'Super Admin')).toBe(true);
    expect(canAccessKnowledge('SUPER_ADMIN_ONLY', ['Super Admin'], 'Super Admin')).toBe(true);
    expect(canAccessKnowledge('SYSTEM_ONLY', [], 'Super Admin')).toBe(false);
    expect(canChunkNarrowParent('PUBLIC', 'ROLE_SCOPED')).toBe(true);
    expect(canChunkNarrowParent('SUPER_ADMIN_ONLY', 'PUBLIC')).toBe(false);
  });

  test('secret validation reports only safe category and location metadata', () => {
    const entry: KnowledgeRegistryEntry = {
      sequence: 1,
      sourceKey: 'test.secret',
      module: 'Test',
      topic: 'Secret',
      sourceType: 'DOCUMENT',
      sourceLocator: 'safe/document.md',
      authority: 'TEST',
      approvalEvidence: 'TEST',
      visibility: 'SYSTEM_ONLY',
      roles: [],
      version: '1',
      disposition: 'SYSTEM_ONLY',
      adapter: 'none',
    };
    const content = 'DATABASE_URL=postgresql://user:do-not-log-this@localhost/db';
    const chunks = chunkKnowledge(entry.sourceKey, content);
    const issues = validateKnowledgeContent(entry, { title: 'Unsafe', content }, chunks);
    expect(issues).toEqual([{ sourceKey: 'test.secret', category: 'DATABASE_CREDENTIAL', location: 'safe/document.md' }]);
    expect(JSON.stringify(issues)).not.toContain('do-not-log-this');
  });

  test('versioning is deterministic and preserves changed approved content', () => {
    const entry = getKnowledgeRegistry().find(item => item.sourceKey === 'route.terms')!;
    expect(resolveEffectiveKnowledgeVersion(entry, 'hash-a', [])).toBe('1.0');
    expect(resolveEffectiveKnowledgeVersion(entry, 'hash-a', [{ version: '1.0', contentHash: 'hash-a' }])).toBe('1.0');
    expect(resolveEffectiveKnowledgeVersion(entry, 'abcdef1234567890', [{ version: '1.0', contentHash: 'different' }])).toBe('1.0+abcdef123456');
    expect(resolveEffectiveKnowledgeVersion(entry, 'hash-a', [{ version: '1.0', contentHash: 'hash-a' }], 'fedcba9876543210')).toBe('1.0+fedcba987654');
  });

  test('future module closure contract requires registered, synced, 100% knowledge', () => {
    expect(validateModuleKnowledgeRegistration({
      moduleId: 'FUTURE-01',
      sourceKeys: ['future.guide'],
      owner: 'Module Owner',
      approvalEvidence: 'ACCEPTANCE-1',
      localKnowledgeRegistered: true,
      localKnowledgeSynced: true,
      localCoveragePercent: 100,
    })).toEqual([]);
    expect(validateModuleKnowledgeRegistration({
      moduleId: 'FUTURE-01',
      sourceKeys: [],
      owner: '',
      approvalEvidence: '',
      localKnowledgeRegistered: false,
      localKnowledgeSynced: false,
      localCoveragePercent: 0,
    })).toEqual(expect.arrayContaining([
      'SOURCE_KEY_REQUIRED',
      'LOCAL_KNOWLEDGE_NOT_REGISTERED',
      'LOCAL_KNOWLEDGE_NOT_SYNCED',
      'LOCAL_KNOWLEDGE_COVERAGE_NOT_100',
    ]));
  });
});
