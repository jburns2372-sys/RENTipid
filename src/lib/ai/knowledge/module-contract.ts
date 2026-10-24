export const KNOWLEDGE_MODULE_PROMOTION_GATES = [
  'CODE COMPLETE',
  'LOCAL FUNCTIONAL',
  'LOCAL DATABASE MIGRATED',
  'LOCAL REQUIRED DATA SEEDED/SYNCED',
  'LOCAL KNOWLEDGE REGISTERED',
  'LOCAL KNOWLEDGE SYNCED',
  'LOCAL ACCEPTANCE PASS',
  'PREVIEW MIGRATED',
  'PREVIEW REQUIRED DATA SEEDED/SYNCED',
  'PREVIEW KNOWLEDGE SYNCED',
  'PREVIEW ACCEPTANCE PASS',
  'OWNER ACCEPTANCE PASS',
  'PRODUCTION-READY',
  'CLOSED / FROZEN',
] as const;

export interface ModuleKnowledgeRegistration {
  moduleId: string;
  sourceKeys: string[];
  owner: string;
  approvalEvidence: string;
  localKnowledgeRegistered: boolean;
  localKnowledgeSynced: boolean;
  localCoveragePercent: number;
}

export function validateModuleKnowledgeRegistration(
  registration: ModuleKnowledgeRegistration,
): string[] {
  const issues: string[] = [];
  if (!registration.moduleId) issues.push('MODULE_ID_REQUIRED');
  if (registration.sourceKeys.length === 0) issues.push('SOURCE_KEY_REQUIRED');
  if (!registration.owner) issues.push('OWNER_REQUIRED');
  if (!registration.approvalEvidence) issues.push('APPROVAL_EVIDENCE_REQUIRED');
  if (!registration.localKnowledgeRegistered) issues.push('LOCAL_KNOWLEDGE_NOT_REGISTERED');
  if (!registration.localKnowledgeSynced) issues.push('LOCAL_KNOWLEDGE_NOT_SYNCED');
  if (registration.localCoveragePercent !== 100) issues.push('LOCAL_KNOWLEDGE_COVERAGE_NOT_100');
  return issues;
}
