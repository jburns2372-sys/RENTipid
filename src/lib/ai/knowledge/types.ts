export const KNOWLEDGE_DISPOSITIONS = [
  'ACTIVE_CANONICAL',
  'ROLE_RESTRICTED',
  'SUPER_ADMIN_ONLY',
  'SYSTEM_ONLY',
  'EXCLUDED',
  'SUPERSEDED',
  'CONDITIONAL_APPROVED',
] as const;

export type KnowledgeDisposition = (typeof KNOWLEDGE_DISPOSITIONS)[number];

export const KNOWLEDGE_VISIBILITIES = [
  'PUBLIC',
  'AUTHENTICATED',
  'ROLE_SCOPED',
  'SUPER_ADMIN_ONLY',
  'SYSTEM_ONLY',
] as const;

export type KnowledgeVisibility = (typeof KNOWLEDGE_VISIBILITIES)[number];

export interface KnowledgeRegistryEntry {
  sequence: number;
  sourceKey: string;
  module: string;
  topic: string;
  sourceType: string;
  sourceLocator: string;
  authority: string;
  approvalEvidence: string;
  visibility: KnowledgeVisibility;
  roles: string[];
  version: string;
  disposition: KnowledgeDisposition;
  adapter: string;
  reason?: string;
}

export interface AdaptedKnowledge {
  title: string;
  content: string;
  keywords?: string[];
  metadata?: Record<string, unknown>;
}

export interface KnowledgeChunkInput {
  chunkKey: string;
  headingPath: string;
  content: string;
  normalizedContent: string;
  contentHash: string;
  keywords: string[];
  ordinal: number;
  visibility?: KnowledgeVisibility;
  roles?: string[];
}

export type KnowledgeSyncAction =
  | 'CREATE'
  | 'NO_OP'
  | 'CREATE_NEW_VERSION'
  | 'INVALID'
  | 'MISSING';

export interface KnowledgeDiffItem {
  sourceKey: string;
  module: string;
  action: KnowledgeSyncAction;
  expectedVersion: string;
  effectiveVersion: string;
  expectedHash?: string;
  currentHash?: string | null;
  chunkCount: number;
  issues: string[];
}

export interface KnowledgeValidationIssue {
  sourceKey: string;
  category: string;
  location: string;
}

export interface KnowledgeCoverageItem {
  module: string;
  sourceKey: string;
  approval: string;
  visibility: KnowledgeVisibility;
  version: string;
  disposition: KnowledgeDisposition;
  active: boolean;
  missing: boolean;
  invalid: boolean;
  excluded: boolean;
  duplicate: boolean;
  stale: boolean;
  chunkCount: number;
  covered: boolean;
}

export interface KnowledgeCoverageReport {
  registryId: string;
  generatedAt: string;
  totalCandidates: number;
  accountedCandidates: number;
  unclassified: number;
  unaccounted: number;
  approvedCanonicalSources: number;
  activeSources: number;
  excludedSources: number;
  systemOnlySources: number;
  superAdminOnlySources: number;
  totalChunks: number;
  missing: number;
  invalid: number;
  duplicates: number;
  stale: number;
  coveragePercent: number;
  items: KnowledgeCoverageItem[];
}
