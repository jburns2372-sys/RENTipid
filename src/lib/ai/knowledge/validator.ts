import { existsSync } from 'fs';
import { resolve } from 'path';
import { canChunkNarrowParent } from './visibility';
import type { AdaptedKnowledge, KnowledgeChunkInput, KnowledgeRegistryEntry, KnowledgeValidationIssue } from './types';

const UNSAFE_CONTENT_RULES: Array<{ category: string; pattern: RegExp }> = [
  { category: 'PRIVATE_KEY', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i },
  { category: 'DATABASE_CREDENTIAL', pattern: /postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@/i },
  { category: 'PASSWORD_HASH', pattern: /\$2[aby]\$\d{2}\$[./A-Za-z0-9]{40,}/ },
  { category: 'JWT_TOKEN', pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { category: 'SECRET_ASSIGNMENT', pattern: /(?:api[_-]?key|client[_-]?secret|jwt[_-]?secret|signing[_-]?secret|session[_-]?token|password)\s*[:=]\s*["']?[A-Za-z0-9_+\-/=]{20,}/i },
  { category: 'COOKIE_VALUE', pattern: /\b(?:set-cookie|cookie)\s*:\s*[^\r\n]{20,}/i },
  { category: 'TEST_IDENTITY', pattern: /\b[A-Z0-9._%+-]+@(?:example\.com|test\.local)\b/i },
];

const FORBIDDEN_LOCATOR_RULES: Array<{ category: string; pattern: RegExp }> = [
  { category: 'ENVIRONMENT_FILE', pattern: /(^|[/\\])\.env(?:\.|$)/i },
  { category: 'PRIVATE_KEY_FILE', pattern: /\.(?:pem|p12|pfx|key)$/i },
  { category: 'TEST_ARTIFACT', pattern: /(^|[/\\])(?:test-results|playwright-report)([/\\]|$)/i },
];

export function validateRegistryLocator(entry: KnowledgeRegistryEntry, root = process.cwd()): KnowledgeValidationIssue[] {
  const issues: KnowledgeValidationIssue[] = [];
  for (const rule of FORBIDDEN_LOCATOR_RULES) {
    if (rule.pattern.test(entry.sourceLocator)) {
      issues.push({ sourceKey: entry.sourceKey, category: rule.category, location: entry.sourceLocator });
    }
  }
  if (entry.adapter === 'document-markdown' || entry.adapter === 'published-route-allowlist') {
    if (!existsSync(resolve(root, entry.sourceLocator))) {
      issues.push({ sourceKey: entry.sourceKey, category: 'MISSING_SOURCE', location: entry.sourceLocator });
    }
  }
  return issues;
}

export function validateKnowledgeContent(
  entry: KnowledgeRegistryEntry,
  adapted: AdaptedKnowledge,
  chunks: KnowledgeChunkInput[],
): KnowledgeValidationIssue[] {
  const issues: KnowledgeValidationIssue[] = [];
  for (const rule of UNSAFE_CONTENT_RULES) {
    if (rule.pattern.test(adapted.content)) {
      issues.push({ sourceKey: entry.sourceKey, category: rule.category, location: entry.sourceLocator });
    }
  }
  for (const chunk of chunks) {
    if (!canChunkNarrowParent(entry.visibility, chunk.visibility)) {
      issues.push({ sourceKey: entry.sourceKey, category: 'CHUNK_VISIBILITY_BROADENED', location: chunk.headingPath });
    }
  }
  if (chunks.length === 0 && adapted.metadata?.omitted !== true) {
    issues.push({ sourceKey: entry.sourceKey, category: 'EMPTY_CONTENT', location: entry.sourceLocator });
  }
  return issues;
}
