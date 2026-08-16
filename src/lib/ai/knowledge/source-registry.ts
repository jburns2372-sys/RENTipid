import { readFileSync } from 'fs';
import { resolve } from 'path';
import { hashKnowledgeRegistryText } from './hashing';
import {
  KNOWLEDGE_DISPOSITIONS,
  KNOWLEDGE_VISIBILITIES,
  type KnowledgeDisposition,
  type KnowledgeRegistryEntry,
  type KnowledgeVisibility,
} from './types';

export const KNOWLEDGE_REGISTRY_ID = 'KB1-INITIAL-147';
export const KNOWLEDGE_REGISTRY_COUNT = 147;
export const KNOWLEDGE_REGISTRY_PATH =
  'final-documentation/ai-knowledge/KNOWLEDGE-IMPLEMENTATION-REGISTRY.md';
export const KNOWLEDGE_REGISTRY_FREEZE_PATH =
  'final-documentation/ai-knowledge/KNOWLEDGE-IMPLEMENTATION-REGISTRY-FREEZE.md';

let cachedRegistry: KnowledgeRegistryEntry[] | null = null;

function unwrap(value: string): string {
  const trimmed = value.trim();
  return trimmed.startsWith('`') && trimmed.endsWith('`')
    ? trimmed.slice(1, -1)
    : trimmed;
}

function parseRow(line: string): KnowledgeRegistryEntry {
  const columns = line.split('|').map(value => unwrap(value));
  const disposition = columns[12] as KnowledgeDisposition;
  const systemOnly = disposition === 'SYSTEM_ONLY';
  return {
    sequence: Number(columns[1]),
    sourceKey: columns[2],
    module: columns[3],
    topic: columns[4],
    sourceType: columns[5],
    sourceLocator: columns[6],
    authority: columns[7],
    approvalEvidence: columns[8],
    visibility: systemOnly ? 'SYSTEM_ONLY' : columns[9] as KnowledgeVisibility,
    roles: systemOnly || columns[10] === 'none'
      ? []
      : columns[10].split(';').map(role => role.trim()).filter(Boolean),
    version: columns[11],
    disposition,
    adapter: columns[13],
    reason: columns[14] === '—' ? undefined : columns[14],
  };
}

export function validateKnowledgeRegistry(entries: KnowledgeRegistryEntry[]): string[] {
  const issues: string[] = [];
  if (entries.length !== KNOWLEDGE_REGISTRY_COUNT) {
    issues.push(`EXPECTED_${KNOWLEDGE_REGISTRY_COUNT}_FOUND_${entries.length}`);
  }
  if (new Set(entries.map(entry => entry.sourceKey)).size !== entries.length) {
    issues.push('DUPLICATE_SOURCE_KEY');
  }
  if (new Set(entries.map(entry => entry.sequence)).size !== entries.length) {
    issues.push('DUPLICATE_SEQUENCE');
  }
  for (const entry of entries) {
    if (!KNOWLEDGE_DISPOSITIONS.includes(entry.disposition)) {
      issues.push(`INVALID_DISPOSITION:${entry.sourceKey}`);
    }
    if (!KNOWLEDGE_VISIBILITIES.includes(entry.visibility)) {
      issues.push(`INVALID_VISIBILITY:${entry.sourceKey}`);
    }
    if (!entry.sourceKey || !entry.module || !entry.topic || !entry.version) {
      issues.push(`MISSING_REQUIRED_FIELD:${entry.sourceKey || entry.sequence}`);
    }
  }
  return issues;
}

export function calculateKnowledgeRegistryFreezeHash(root = process.cwd()): string {
  const registry = readFileSync(resolve(root, KNOWLEDGE_REGISTRY_PATH), 'utf8');
  return hashKnowledgeRegistryText(registry);
}

export function verifyKnowledgeRegistryFreeze(root = process.cwd()): void {
  const freeze = readFileSync(resolve(root, KNOWLEDGE_REGISTRY_FREEZE_PATH), 'utf8');
  const expected = freeze.match(/REGISTRY_SHA256: `([A-F0-9]{64})`/)?.[1];
  const actual = calculateKnowledgeRegistryFreezeHash(root);
  if (!expected || actual !== expected) {
    throw new Error('KNOWLEDGE_REGISTRY_FREEZE_MISMATCH');
  }
}

export function getKnowledgeRegistry(root = process.cwd()): KnowledgeRegistryEntry[] {
  if (cachedRegistry) return cachedRegistry.map(entry => ({ ...entry, roles: [...entry.roles] }));
  verifyKnowledgeRegistryFreeze(root);
  const content = readFileSync(resolve(root, KNOWLEDGE_REGISTRY_PATH), 'utf8');
  const entries = content
    .split(/\r?\n/)
    .filter(line => /^\| \d+ \|/.test(line))
    .map(parseRow);
  const issues = validateKnowledgeRegistry(entries);
  if (issues.length > 0) {
    throw new Error(`KNOWLEDGE_REGISTRY_INVALID:${issues.join(',')}`);
  }
  cachedRegistry = entries;
  return entries.map(entry => ({ ...entry, roles: [...entry.roles] }));
}

export function isSynchronizable(entry: KnowledgeRegistryEntry): boolean {
  return [
    'ACTIVE_CANONICAL',
    'ROLE_RESTRICTED',
    'SUPER_ADMIN_ONLY',
  ].includes(entry.disposition);
}

export function getSynchronizableKnowledgeRegistry(root = process.cwd()): KnowledgeRegistryEntry[] {
  return getKnowledgeRegistry(root).filter(isSynchronizable);
}
