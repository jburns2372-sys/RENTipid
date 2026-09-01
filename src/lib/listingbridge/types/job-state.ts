export const listingImportJobStatuses = [
  'CREATED',
  'AUTHORIZING',
  'FETCHING',
  'EXTRACTING',
  'NORMALIZING',
  'PROCESSING_MEDIA',
  'VALIDATING',
  'NEEDS_REVIEW',
  'READY_FOR_DRAFT',
  'CREATING_DRAFT',
  'COMPLETED',
  'FAILED_RETRYABLE',
  'FAILED_FINAL',
  'CANCELLED',
] as const;

export type ListingImportJobStatus = (typeof listingImportJobStatuses)[number];

export const terminalListingImportJobStatuses = [
  'COMPLETED',
  'FAILED_FINAL',
  'CANCELLED',
] as const satisfies readonly ListingImportJobStatus[];

export type TerminalListingImportJobStatus = (typeof terminalListingImportJobStatuses)[number];

export function isTerminalListingImportJobStatus(
  status: ListingImportJobStatus,
): status is TerminalListingImportJobStatus {
  return (terminalListingImportJobStatuses as readonly string[]).includes(status);
}

export const legalJobStateTransitions: Readonly<Record<ListingImportJobStatus, readonly ListingImportJobStatus[]>> = {
  CREATED: ['AUTHORIZING', 'FETCHING', 'FAILED_RETRYABLE', 'FAILED_FINAL', 'CANCELLED'],
  AUTHORIZING: ['FETCHING', 'FAILED_RETRYABLE', 'FAILED_FINAL', 'CANCELLED'],
  FETCHING: ['EXTRACTING', 'FAILED_RETRYABLE', 'FAILED_FINAL', 'CANCELLED'],
  EXTRACTING: ['NORMALIZING', 'FAILED_RETRYABLE', 'FAILED_FINAL', 'CANCELLED'],
  NORMALIZING: ['PROCESSING_MEDIA', 'VALIDATING', 'FAILED_RETRYABLE', 'FAILED_FINAL', 'CANCELLED'],
  PROCESSING_MEDIA: ['VALIDATING', 'NEEDS_REVIEW', 'READY_FOR_DRAFT', 'FAILED_RETRYABLE', 'FAILED_FINAL', 'CANCELLED'],
  VALIDATING: ['NEEDS_REVIEW', 'READY_FOR_DRAFT', 'FAILED_RETRYABLE', 'FAILED_FINAL', 'CANCELLED'],
  NEEDS_REVIEW: ['READY_FOR_DRAFT', 'VALIDATING', 'FAILED_RETRYABLE', 'FAILED_FINAL', 'CANCELLED'],
  READY_FOR_DRAFT: ['CREATING_DRAFT', 'NEEDS_REVIEW', 'FAILED_RETRYABLE', 'FAILED_FINAL', 'CANCELLED'],
  CREATING_DRAFT: ['COMPLETED', 'FAILED_RETRYABLE', 'FAILED_FINAL', 'CANCELLED'],
  COMPLETED: [],
  FAILED_RETRYABLE: ['FETCHING', 'EXTRACTING', 'NORMALIZING', 'PROCESSING_MEDIA', 'VALIDATING', 'CREATING_DRAFT', 'FAILED_FINAL', 'CANCELLED'],
  FAILED_FINAL: [],
  CANCELLED: [],
};

export function canTransitionJobStatus(current: ListingImportJobStatus, next: ListingImportJobStatus): boolean {
  if (current === next) return true;
  return legalJobStateTransitions[current]?.includes(next) ?? false;
}

export function assertValidJobStatusTransition(current: ListingImportJobStatus, next: ListingImportJobStatus): void {
  if (!canTransitionJobStatus(current, next)) {
    throw new Error(`Invalid ListingImportJob state transition from '${current}' to '${next}'`);
  }
}

export const listingImportAssetStatuses = [
  'PENDING',
  'FETCHING',
  'DOWNLOADED',
  'VALIDATED',
  'REJECTED',
  'FAILED',
  'SKIPPED_DUPLICATE',
] as const;

export type ListingImportAssetStatus = (typeof listingImportAssetStatuses)[number];

export const listingImportResolutionTypes = [
  'PROVIDER_OVERRIDE',
  'AI_SUGGESTION_ACCEPTED',
  'SYSTEM_DEFAULT',
  'DISMISSED',
] as const;

export type ListingImportResolutionType = (typeof listingImportResolutionTypes)[number];

export const listingImportAuditEventTypes = [
  'JOB_CREATED',
  'STATUS_CHANGED',
  'AUTHORIZATION_COMPLETED',
  'FETCH_COMPLETED',
  'NORMALIZATION_COMPLETED',
  'SECURITY_BLOCKED',
  'AI_ENRICHED',
  'RESOLUTION_SAVED',
  'DRAFT_COMMITTED',
  'JOB_FAILED',
] as const;

export type ListingImportAuditEventType = (typeof listingImportAuditEventTypes)[number];
