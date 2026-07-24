import {
  IncidentCaseEvidenceSource,
  IncidentCaseEvidenceType,
  IncidentCaseHistoryReason,
  IncidentCaseNoteType,
  IncidentCaseOrigin,
  IncidentCaseSeverity,
  IncidentCaseStatus,
  Prisma,
} from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import {
  getPhase1PermissionsForRole,
  SECURITY_PERMISSIONS,
  SecurityPermission,
} from '../permissions';

export interface IncidentCaseTransactionRunner {
  $transaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T>;
}

export type IncidentCaseDatabase =
  | Prisma.TransactionClient
  | IncidentCaseTransactionRunner;

export class IncidentCaseWriterError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'IncidentCaseWriterError';
  }
}

const APPROVED_ORIGINS = new Set(Object.values(IncidentCaseOrigin));
const APPROVED_SEVERITIES = new Set(Object.values(IncidentCaseSeverity));
const APPROVED_NOTE_TYPES = new Set(Object.values(IncidentCaseNoteType));
const APPROVED_EVIDENCE_TYPES = new Set(Object.values(IncidentCaseEvidenceType));
const APPROVED_EVIDENCE_SOURCES = new Set(
  Object.values(IncidentCaseEvidenceSource),
);

const HISTORY_REASON_BY_TRANSITION: Readonly<
  Partial<
    Record<
      IncidentCaseStatus,
      Partial<Record<IncidentCaseStatus, IncidentCaseHistoryReason>>
    >
  >
> = {
  OPEN: { TRIAGED: IncidentCaseHistoryReason.TRIAGED },
  TRIAGED: {
    INVESTIGATING: IncidentCaseHistoryReason.INVESTIGATION_STARTED,
    CONTAINMENT_PENDING: IncidentCaseHistoryReason.CONTAINMENT_REQUESTED,
  },
  INVESTIGATING: {
    CONTAINMENT_PENDING: IncidentCaseHistoryReason.CONTAINMENT_REQUESTED,
    RESOLVED: IncidentCaseHistoryReason.RESOLVED,
  },
  CONTAINMENT_PENDING: {
    INVESTIGATING: IncidentCaseHistoryReason.INVESTIGATION_STARTED,
    RESOLVED: IncidentCaseHistoryReason.RESOLVED,
  },
  RESOLVED: {
    CLOSED: IncidentCaseHistoryReason.CLOSED,
    REOPENED: IncidentCaseHistoryReason.REOPENED,
  },
  CLOSED: { REOPENED: IncidentCaseHistoryReason.REOPENED },
  REOPENED: {
    TRIAGED: IncidentCaseHistoryReason.TRIAGED,
    INVESTIGATING: IncidentCaseHistoryReason.INVESTIGATION_STARTED,
  },
};

export const APPROVED_INCIDENT_CASE_TRANSITIONS = Object.freeze(
  Object.entries(HISTORY_REASON_BY_TRANSITION).flatMap(([previousStatus, targets]) =>
    Object.entries(targets ?? {}).map(([newStatus, reason]) => ({
      previousStatus: previousStatus as IncidentCaseStatus,
      newStatus: newStatus as IncidentCaseStatus,
      reason: reason as IncidentCaseHistoryReason,
    })),
  ),
);

const EVIDENCE_REFERENCE_PREFIX: Readonly<
  Record<IncidentCaseEvidenceType, string>
> = {
  SECURITY_EVENT: 'security-event:',
  AUDIT_LOG: 'audit-log:',
  SYSTEM_LOG: 'system-log:',
  PROVIDER_EVENT: 'provider-event:',
  TRANSACTION_REFERENCE: 'transaction:',
  DOCUMENT_REFERENCE: 'document:',
  IMAGE_REFERENCE: 'image:',
  USER_STATEMENT: 'user-statement:',
  OTHER: 'other:',
};

const SENSITIVE_TEXT =
  /password|passwd|credential|secret|token|api[_-]?key|database[_-]?url|postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/|session(?:id|_id)?/i;
const HEX_64 = /^[0-9a-f]{64}$/i;
const REFERENCE_SUFFIX = /^[A-Za-z0-9][A-Za-z0-9._-]{0,219}$/;

function isTransactionRunner(
  database: IncidentCaseDatabase,
): database is IncidentCaseTransactionRunner {
  return (
    '$transaction' in database &&
    typeof database.$transaction === 'function'
  );
}

async function inTransaction<T>(
  database: IncidentCaseDatabase,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  if (isTransactionRunner(database)) {
    return database.$transaction(operation);
  }
  return operation(database);
}

type IncidentCaseAuthorizationOutcome<T> =
  | { allowed: true; value: T }
  | { allowed: false };

async function resolveDatabasePermission(
  tx: Prisma.TransactionClient,
  actorUserId: string,
  permission: SecurityPermission,
) {
  const actor = await tx.user.findUnique({
    where: { id: actorUserId },
    select: { id: true, role: true, status: true },
  });
  const allowed =
    actor?.status === 'Verified' &&
    getPhase1PermissionsForRole(actor.role).includes(permission);
  return { actor, allowed };
}

async function appendCaseAudit(
  tx: Prisma.TransactionClient,
  input: {
    actorUserId: string | null;
    action: string;
    targetId?: string;
    permission: SecurityPermission;
    metadata?: Record<string, string>;
  },
) {
  return tx.auditLog.create({
    data: {
      actor_user_id: input.actorUserId,
      action: input.action,
      module: 'SecurityOperationsCenter',
      target_id: input.targetId,
      details: JSON.stringify({
        required_permission: input.permission,
        ...input.metadata,
      }),
    },
  });
}

async function authorizeAndMutate<T>(
  database: IncidentCaseDatabase,
  actorUserId: string,
  permission: SecurityPermission,
  successAction: string,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  targetId: (value: T) => string,
  metadata?: (value: T) => Record<string, string>,
): Promise<T> {
  const outcome = await inTransaction<
    IncidentCaseAuthorizationOutcome<T>
  >(database, async (tx) => {
    const authorization = await resolveDatabasePermission(
      tx,
      actorUserId,
      permission,
    );
    if (!authorization.allowed) {
      await appendCaseAudit(tx, {
        actorUserId: authorization.actor?.id ?? null,
        action: 'SOC_INCIDENT_CASE_AUTHORIZATION_DENIED',
        permission,
      });
      return { allowed: false };
    }

    const value = await operation(tx);
    await appendCaseAudit(tx, {
      actorUserId: authorization.actor!.id,
      action: successAction,
      targetId: targetId(value),
      permission,
      metadata: metadata?.(value),
    });
    return { allowed: true, value };
  });

  if (!outcome.allowed) {
    throw new IncidentCaseWriterError('INCIDENT_CASE_PERMISSION_DENIED');
  }
  return outcome.value;
}

export async function requireIncidentCasePermission(
  database: IncidentCaseDatabase,
  actorUserId: string,
  permission: SecurityPermission,
) {
  const outcome = await inTransaction<
    IncidentCaseAuthorizationOutcome<{
      actorUserId: string;
      role: string;
      permission: SecurityPermission;
    }>
  >(database, async (tx) => {
    const authorization = await resolveDatabasePermission(
      tx,
      actorUserId,
      permission,
    );
    if (!authorization.allowed) {
      await appendCaseAudit(tx, {
        actorUserId: authorization.actor?.id ?? null,
        action: 'SOC_INCIDENT_CASE_AUTHORIZATION_DENIED',
        permission,
      });
      return { allowed: false };
    }
    return {
      allowed: true,
      value: {
        actorUserId: authorization.actor!.id,
        role: authorization.actor!.role,
        permission,
      },
    };
  });

  if (!outcome.allowed) {
    throw new IncidentCaseWriterError('INCIDENT_CASE_PERMISSION_DENIED');
  }
  return outcome.value;
}

function assertNonEmptyBounded(
  value: string,
  maximum: number,
  errorCode: string,
): void {
  if (value.trim().length === 0 || value.length > maximum) {
    throw new IncidentCaseWriterError(errorCode);
  }
}

function assertOptionalBounded(
  value: string | null | undefined,
  maximum: number,
  errorCode: string,
): void {
  if (value !== null && value !== undefined && value.length > maximum) {
    throw new IncidentCaseWriterError(errorCode);
  }
}

function assertPrivacySafeText(
  value: string | null | undefined,
  errorCode: string,
): void {
  if (value && SENSITIVE_TEXT.test(value)) {
    throw new IncidentCaseWriterError(errorCode);
  }
}

function assertIdempotencyKey(value: string): void {
  assertNonEmptyBounded(value, 128, 'INVALID_IDEMPOTENCY_KEY');
  assertPrivacySafeText(value, 'PRIVACY_REJECTED');
}

async function requireUser(
  tx: Prisma.TransactionClient,
  userId: string,
  errorCode: string,
): Promise<void> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    throw new IncidentCaseWriterError(errorCode);
  }
}

function createCaseReference(now: Date): string {
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  return `INC-${date}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export type CreateIncidentCaseInput = {
  severity: IncidentCaseSeverity;
  origin: IncidentCaseOrigin;
  title: string;
  summary?: string | null;
  actorUserId: string;
  securityEventId?: string | null;
  initialStatus?: IncidentCaseStatus;
  caseReference?: string;
  occurredAt?: Date;
  historyIdempotencyKey: string;
};

async function createIncidentCaseUnchecked(
  database: IncidentCaseDatabase,
  input: CreateIncidentCaseInput,
) {
  if (!APPROVED_SEVERITIES.has(input.severity)) {
    throw new IncidentCaseWriterError('INVALID_SEVERITY');
  }
  if (!APPROVED_ORIGINS.has(input.origin)) {
    throw new IncidentCaseWriterError('INVALID_ORIGIN');
  }
  if (
    input.initialStatus !== undefined &&
    input.initialStatus !== IncidentCaseStatus.OPEN
  ) {
    throw new IncidentCaseWriterError('INITIAL_STATUS_MUST_BE_OPEN');
  }
  if (
    (input.origin === IncidentCaseOrigin.SECURITY_EVENT) !==
    Boolean(input.securityEventId)
  ) {
    throw new IncidentCaseWriterError('SECURITY_EVENT_LINKAGE_MISMATCH');
  }

  assertNonEmptyBounded(input.title, 160, 'INVALID_TITLE');
  assertOptionalBounded(input.summary, 2000, 'INVALID_SUMMARY');
  assertPrivacySafeText(input.title, 'PRIVACY_REJECTED');
  assertPrivacySafeText(input.summary, 'PRIVACY_REJECTED');
  assertIdempotencyKey(input.historyIdempotencyKey);

  const occurredAt = input.occurredAt ?? new Date();
  const caseReference = input.caseReference ?? createCaseReference(occurredAt);
  if (!/^INC-[0-9]{8}-[A-Z0-9]{8}$/.test(caseReference)) {
    throw new IncidentCaseWriterError('INVALID_CASE_REFERENCE');
  }

  return inTransaction(database, async (tx) => {
    await requireUser(tx, input.actorUserId, 'ACTOR_NOT_FOUND');
    if (input.securityEventId) {
      const event = await tx.securityEvent.findUnique({
        where: { id: input.securityEventId },
        select: { id: true },
      });
      if (!event) {
        throw new IncidentCaseWriterError('SECURITY_EVENT_NOT_FOUND');
      }
    }

    const incidentCase = await tx.incidentCase.create({
      data: {
        case_reference: caseReference,
        status: IncidentCaseStatus.OPEN,
        severity: input.severity,
        origin: input.origin,
        title: input.title,
        summary: input.summary ?? null,
        opened_at: occurredAt,
        created_by_user_id: input.actorUserId,
        originating_security_event_id: input.securityEventId ?? null,
      },
    });

    const history = await tx.incidentCaseHistory.create({
      data: {
        incident_case_id: incidentCase.id,
        previous_status: null,
        new_status: IncidentCaseStatus.OPEN,
        reason: IncidentCaseHistoryReason.CREATED,
        actor_user_id: input.actorUserId,
        occurred_at: occurredAt,
        idempotency_key: input.historyIdempotencyKey,
      },
    });

    return { incidentCase, history };
  });
}

export type TransitionIncidentCaseStatusInput = {
  incidentCaseId: string;
  expectedStatus: IncidentCaseStatus;
  expectedVersion: number;
  newStatus: IncidentCaseStatus;
  actorUserId: string;
  reasonNote?: string | null;
  occurredAt?: Date;
  historyIdempotencyKey: string;
};

async function transitionIncidentCaseStatusUnchecked(
  database: IncidentCaseDatabase,
  input: TransitionIncidentCaseStatusInput,
) {
  if (input.expectedStatus === input.newStatus) {
    throw new IncidentCaseWriterError('SELF_TRANSITION_REJECTED');
  }
  const reason =
    HISTORY_REASON_BY_TRANSITION[input.expectedStatus]?.[input.newStatus];
  if (!reason) {
    throw new IncidentCaseWriterError('TRANSITION_NOT_APPROVED');
  }
  if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 1) {
    throw new IncidentCaseWriterError('INVALID_EXPECTED_VERSION');
  }
  assertOptionalBounded(input.reasonNote, 1000, 'INVALID_REASON_NOTE');
  assertPrivacySafeText(input.reasonNote, 'PRIVACY_REJECTED');
  assertIdempotencyKey(input.historyIdempotencyKey);

  const occurredAt = input.occurredAt ?? new Date();

  return inTransaction(database, async (tx) => {
    await requireUser(tx, input.actorUserId, 'ACTOR_NOT_FOUND');
    const current = await tx.incidentCase.findUnique({
      where: { id: input.incidentCaseId },
    });
    if (!current) {
      throw new IncidentCaseWriterError('CASE_NOT_FOUND');
    }
    if (
      current.status !== input.expectedStatus ||
      current.version !== input.expectedVersion
    ) {
      throw new IncidentCaseWriterError('STALE_TRANSITION_CONFLICT');
    }

    const lifecycleTimestamps: Prisma.IncidentCaseUpdateManyMutationInput = {};
    if (input.newStatus === IncidentCaseStatus.RESOLVED) {
      lifecycleTimestamps.resolved_at = occurredAt;
      lifecycleTimestamps.closed_at = null;
      lifecycleTimestamps.reopened_at = null;
    } else if (input.newStatus === IncidentCaseStatus.CLOSED) {
      lifecycleTimestamps.closed_at = occurredAt;
    } else if (input.newStatus === IncidentCaseStatus.REOPENED) {
      lifecycleTimestamps.reopened_at = occurredAt;
    }

    const updated = await tx.incidentCase.updateMany({
      where: {
        id: current.id,
        status: input.expectedStatus,
        version: input.expectedVersion,
      },
      data: {
        status: input.newStatus,
        version: { increment: 1 },
        ...lifecycleTimestamps,
      },
    });
    if (updated.count !== 1) {
      throw new IncidentCaseWriterError('STALE_TRANSITION_CONFLICT');
    }

    const history = await tx.incidentCaseHistory.create({
      data: {
        incident_case_id: current.id,
        previous_status: current.status,
        new_status: input.newStatus,
        reason,
        reason_note: input.reasonNote ?? null,
        actor_user_id: input.actorUserId,
        occurred_at: occurredAt,
        idempotency_key: input.historyIdempotencyKey,
      },
    });
    const incidentCase = await tx.incidentCase.findUniqueOrThrow({
      where: { id: current.id },
    });
    return { incidentCase, history };
  });
}

export type AssignIncidentCaseInput = {
  incidentCaseId: string;
  assigneeUserId: string;
  actorUserId: string;
  expectedVersion: number;
  reasonNote?: string | null;
  occurredAt?: Date;
  historyIdempotencyKey: string;
};

async function assignIncidentCaseUnchecked(
  database: IncidentCaseDatabase,
  input: AssignIncidentCaseInput,
) {
  if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 1) {
    throw new IncidentCaseWriterError('INVALID_EXPECTED_VERSION');
  }
  assertOptionalBounded(input.reasonNote, 1000, 'INVALID_REASON_NOTE');
  assertPrivacySafeText(input.reasonNote, 'PRIVACY_REJECTED');
  assertIdempotencyKey(input.historyIdempotencyKey);
  const occurredAt = input.occurredAt ?? new Date();

  return inTransaction(database, async (tx) => {
    await requireUser(tx, input.actorUserId, 'ACTOR_NOT_FOUND');
    await requireUser(tx, input.assigneeUserId, 'ASSIGNEE_NOT_FOUND');
    const current = await tx.incidentCase.findUnique({
      where: { id: input.incidentCaseId },
    });
    if (!current) {
      throw new IncidentCaseWriterError('CASE_NOT_FOUND');
    }
    if (current.version !== input.expectedVersion) {
      throw new IncidentCaseWriterError('STALE_ASSIGNMENT_CONFLICT');
    }
    if (current.assigned_user_id === input.assigneeUserId) {
      throw new IncidentCaseWriterError('SAME_ASSIGNEE_REJECTED');
    }

    const reason = current.assigned_user_id
      ? IncidentCaseHistoryReason.REASSIGNED
      : IncidentCaseHistoryReason.ASSIGNED;
    const updated = await tx.incidentCase.updateMany({
      where: {
        id: current.id,
        version: input.expectedVersion,
        assigned_user_id: current.assigned_user_id,
      },
      data: {
        assigned_user_id: input.assigneeUserId,
        version: { increment: 1 },
      },
    });
    if (updated.count !== 1) {
      throw new IncidentCaseWriterError('STALE_ASSIGNMENT_CONFLICT');
    }

    const history = await tx.incidentCaseHistory.create({
      data: {
        incident_case_id: current.id,
        previous_status: current.status,
        new_status: current.status,
        reason,
        reason_note: input.reasonNote ?? null,
        actor_user_id: input.actorUserId,
        assigned_to_user_id: input.assigneeUserId,
        occurred_at: occurredAt,
        idempotency_key: input.historyIdempotencyKey,
      },
    });
    const incidentCase = await tx.incidentCase.findUniqueOrThrow({
      where: { id: current.id },
    });
    return { incidentCase, history };
  });
}

export type AddIncidentCaseNoteInput = {
  incidentCaseId: string;
  noteType: IncidentCaseNoteType;
  content: string;
  actorUserId: string;
  idempotencyKey: string;
};

async function addIncidentCaseNoteUnchecked(
  database: IncidentCaseDatabase,
  input: AddIncidentCaseNoteInput,
) {
  if (!APPROVED_NOTE_TYPES.has(input.noteType)) {
    throw new IncidentCaseWriterError('INVALID_NOTE_TYPE');
  }
  assertNonEmptyBounded(input.content, 4000, 'INVALID_NOTE_CONTENT');
  assertPrivacySafeText(input.content, 'PRIVACY_REJECTED');
  assertIdempotencyKey(input.idempotencyKey);

  return inTransaction(database, async (tx) => {
    await requireUser(tx, input.actorUserId, 'ACTOR_NOT_FOUND');
    const incidentCase = await tx.incidentCase.findUnique({
      where: { id: input.incidentCaseId },
      select: { id: true },
    });
    if (!incidentCase) {
      throw new IncidentCaseWriterError('CASE_NOT_FOUND');
    }
    return tx.incidentCaseNote.create({
      data: {
        incident_case_id: incidentCase.id,
        note_type: input.noteType,
        content: input.content,
        content_hash: createHash('sha256').update(input.content).digest('hex'),
        actor_user_id: input.actorUserId,
        idempotency_key: input.idempotencyKey,
      },
    });
  });
}

export type AddIncidentCaseEvidenceInput = {
  incidentCaseId: string;
  evidenceType: IncidentCaseEvidenceType;
  source: IncidentCaseEvidenceSource;
  referenceKey: string;
  integrityHash: string;
  actorUserId: string;
  collectedAt: Date;
  contentType?: string | null;
  sizeBytes?: number | null;
  idempotencyKey: string;
};

async function addIncidentCaseEvidenceUnchecked(
  database: IncidentCaseDatabase,
  input: AddIncidentCaseEvidenceInput,
) {
  if (!APPROVED_EVIDENCE_TYPES.has(input.evidenceType)) {
    throw new IncidentCaseWriterError('INVALID_EVIDENCE_TYPE');
  }
  if (!APPROVED_EVIDENCE_SOURCES.has(input.source)) {
    throw new IncidentCaseWriterError('INVALID_EVIDENCE_SOURCE');
  }
  const expectedPrefix = EVIDENCE_REFERENCE_PREFIX[input.evidenceType];
  const referenceSuffix = input.referenceKey.slice(expectedPrefix.length);
  if (
    !input.referenceKey.startsWith(expectedPrefix) ||
    !REFERENCE_SUFFIX.test(referenceSuffix) ||
    input.referenceKey.length > 256
  ) {
    throw new IncidentCaseWriterError('UNSUPPORTED_EVIDENCE_REFERENCE');
  }
  if (!HEX_64.test(input.integrityHash)) {
    throw new IncidentCaseWriterError('INVALID_INTEGRITY_HASH');
  }
  if (
    input.contentType !== null &&
    input.contentType !== undefined &&
    (input.contentType.length > 120 ||
      !/^[A-Za-z0-9][A-Za-z0-9.+-]*\/[A-Za-z0-9][A-Za-z0-9.+-]*$/.test(
        input.contentType,
      ))
  ) {
    throw new IncidentCaseWriterError('INVALID_CONTENT_TYPE');
  }
  if (
    input.sizeBytes !== null &&
    input.sizeBytes !== undefined &&
    (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes < 0)
  ) {
    throw new IncidentCaseWriterError('INVALID_EVIDENCE_SIZE');
  }
  assertPrivacySafeText(input.referenceKey, 'PRIVACY_REJECTED');
  assertIdempotencyKey(input.idempotencyKey);

  return inTransaction(database, async (tx) => {
    await requireUser(tx, input.actorUserId, 'ACTOR_NOT_FOUND');
    const incidentCase = await tx.incidentCase.findUnique({
      where: { id: input.incidentCaseId },
      select: { id: true },
    });
    if (!incidentCase) {
      throw new IncidentCaseWriterError('CASE_NOT_FOUND');
    }
    return tx.incidentCaseEvidence.create({
      data: {
        incident_case_id: incidentCase.id,
        evidence_type: input.evidenceType,
        source_classification: input.source,
        reference_key: input.referenceKey,
        integrity_hash: input.integrityHash,
        added_by_user_id: input.actorUserId,
        collected_at: input.collectedAt,
        content_type: input.contentType ?? null,
        size_bytes: input.sizeBytes ?? null,
        idempotency_key: input.idempotencyKey,
      },
    });
  });
}

const TRANSITION_PERMISSION_BY_STATUS: Readonly<
  Record<IncidentCaseStatus, SecurityPermission>
> = {
  OPEN: SECURITY_PERMISSIONS.INCIDENT_CASE_TRIAGE,
  TRIAGED: SECURITY_PERMISSIONS.INCIDENT_CASE_TRIAGE,
  INVESTIGATING: SECURITY_PERMISSIONS.INCIDENT_CASE_INVESTIGATE,
  CONTAINMENT_PENDING:
    SECURITY_PERMISSIONS.INCIDENT_CASE_REQUEST_CONTAINMENT,
  RESOLVED: SECURITY_PERMISSIONS.INCIDENT_CASE_RESOLVE,
  CLOSED: SECURITY_PERMISSIONS.INCIDENT_CASE_CLOSE,
  REOPENED: SECURITY_PERMISSIONS.INCIDENT_CASE_REOPEN,
};

export function permissionForIncidentCaseTransition(
  newStatus: IncidentCaseStatus,
): SecurityPermission {
  if (newStatus === IncidentCaseStatus.TRIAGED) {
    return SECURITY_PERMISSIONS.INCIDENT_CASE_TRIAGE;
  }
  if (newStatus === IncidentCaseStatus.INVESTIGATING) {
    return SECURITY_PERMISSIONS.INCIDENT_CASE_INVESTIGATE;
  }
  return TRANSITION_PERMISSION_BY_STATUS[newStatus];
}

export async function createIncidentCase(
  database: IncidentCaseDatabase,
  input: CreateIncidentCaseInput,
) {
  return authorizeAndMutate(
    database,
    input.actorUserId,
    SECURITY_PERMISSIONS.INCIDENT_CASE_CREATE,
    'SOC_INCIDENT_CASE_CREATED',
    (tx) => createIncidentCaseUnchecked(tx, input),
    (result) => result.incidentCase.id,
  );
}

export async function transitionIncidentCaseStatus(
  database: IncidentCaseDatabase,
  input: TransitionIncidentCaseStatusInput,
) {
  const permission = permissionForIncidentCaseTransition(input.newStatus);
  return authorizeAndMutate(
    database,
    input.actorUserId,
    permission,
    'SOC_INCIDENT_CASE_STATUS_TRANSITIONED',
    (tx) => transitionIncidentCaseStatusUnchecked(tx, input),
    (result) => result.incidentCase.id,
    (result) => ({
      previous_status: result.history.previous_status ?? 'NONE',
      new_status: result.history.new_status,
      reason: result.history.reason,
    }),
  );
}

export async function assignIncidentCase(
  database: IncidentCaseDatabase,
  input: AssignIncidentCaseInput,
) {
  const outcome = await inTransaction<
    IncidentCaseAuthorizationOutcome<
      Awaited<ReturnType<typeof assignIncidentCaseUnchecked>>
    >
  >(database, async (tx) => {
    const current = await tx.incidentCase.findUnique({
      where: { id: input.incidentCaseId },
      select: { assigned_user_id: true },
    });
    const permission = current?.assigned_user_id
      ? SECURITY_PERMISSIONS.INCIDENT_CASE_REASSIGN
      : SECURITY_PERMISSIONS.INCIDENT_CASE_ASSIGN;
    const authorization = await resolveDatabasePermission(
      tx,
      input.actorUserId,
      permission,
    );
    if (!authorization.allowed) {
      await appendCaseAudit(tx, {
        actorUserId: authorization.actor?.id ?? null,
        action: 'SOC_INCIDENT_CASE_AUTHORIZATION_DENIED',
        targetId: input.incidentCaseId,
        permission,
      });
      return { allowed: false };
    }

    const value = await assignIncidentCaseUnchecked(tx, input);
    await appendCaseAudit(tx, {
      actorUserId: authorization.actor!.id,
      action:
        value.history.reason === IncidentCaseHistoryReason.ASSIGNED
          ? 'SOC_INCIDENT_CASE_ASSIGNED'
          : 'SOC_INCIDENT_CASE_REASSIGNED',
      targetId: value.incidentCase.id,
      permission,
      metadata: { assignment_reason: value.history.reason },
    });
    return { allowed: true, value };
  });
  if (!outcome.allowed) {
    throw new IncidentCaseWriterError('INCIDENT_CASE_PERMISSION_DENIED');
  }
  return outcome.value;
}

export async function addIncidentCaseNote(
  database: IncidentCaseDatabase,
  input: AddIncidentCaseNoteInput,
) {
  return authorizeAndMutate(
    database,
    input.actorUserId,
    SECURITY_PERMISSIONS.INCIDENT_CASE_ADD_NOTE,
    'SOC_INCIDENT_CASE_NOTE_APPENDED',
    (tx) => addIncidentCaseNoteUnchecked(tx, input),
    (note) => note.incident_case_id,
  );
}

export async function addIncidentCaseEvidence(
  database: IncidentCaseDatabase,
  input: AddIncidentCaseEvidenceInput,
) {
  return authorizeAndMutate(
    database,
    input.actorUserId,
    SECURITY_PERMISSIONS.INCIDENT_CASE_ADD_EVIDENCE,
    'SOC_INCIDENT_CASE_EVIDENCE_APPENDED',
    (tx) => addIncidentCaseEvidenceUnchecked(tx, input),
    (evidence) => evidence.incident_case_id,
  );
}
