import { Prisma, SecurityApprovalStatus, SecurityApprovalEventType, SecurityApprovalGrantState } from '@prisma/client';
import { assertSecurityPermissionForService } from '../authorization';
import { SECURITY_PERMISSIONS, SecurityPermission } from '../permissions';
import { randomBytes } from 'crypto';

export interface ApprovalTransactionRunner {
  $transaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T>;
}

export type ApprovalDatabase =
  | Prisma.TransactionClient
  | ApprovalTransactionRunner;

export class ApprovalWriterError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'ApprovalWriterError';
  }
}

async function appendApprovalAudit(
  tx: Prisma.TransactionClient,
  input: {
    actorUserId: string | null;
    action: string;
    targetId?: string;
    permission: SecurityPermission;
    metadata?: Record<string, unknown>;
  },
) {
  return tx.auditLog.create({
    data: {
      actor_user_id: input.actorUserId,
      action: input.action,
      module: 'SecurityOperationsCenter',
      target_id: input.targetId,
      details: JSON.stringify({
        permission: input.permission,
        timestamp: new Date().toISOString(),
        ...input.metadata,
      }),
    },
  });
}

function assertInTransaction(db: ApprovalDatabase): asserts db is Prisma.TransactionClient {
  if (typeof (db as { $transaction?: unknown }).$transaction === 'function') {
    throw new ApprovalWriterError('OPERATION_REQUIRES_TRANSACTION_CONTEXT');
  }
}

export async function submitResponseApprovalRequest(
  db: ApprovalDatabase,
  actorUserId: string,
  input: {
    incident_case_id: string;
    playbook_id: string;
    playbook_version: number;
    justification: string;
  }
) {
  assertInTransaction(db);

  const allowed = await assertSecurityPermissionForService(
    actorUserId,
    SECURITY_PERMISSIONS.RESPONSE_REQUEST,
    db
  );

  if (!allowed) {
    await appendApprovalAudit(db, {
      actorUserId,
      action: 'SOC_RESPONSE_AUTHORIZATION_DENIED',
      permission: SECURITY_PERMISSIONS.RESPONSE_REQUEST,
      metadata: { attemptedAction: 'SUBMIT_REQUEST', input },
    });
    throw new ApprovalWriterError('UNAUTHORIZED');
  }

  // Idempotency key for this exact combination
  const idempotency_key = `REQ-${input.incident_case_id}-${input.playbook_id}-${input.playbook_version}-${Date.now()}-${randomBytes(4).toString('hex')}`;

  const request = await db.securityResponseApprovalRequest.create({
    data: {
      requester_id: actorUserId,
      incident_case_id: input.incident_case_id,
      playbook_id: input.playbook_id,
      playbook_version: input.playbook_version,
      justification: input.justification,
      status: SecurityApprovalStatus.PENDING,
      idempotency_key,
    },
  });

  await db.securityResponseApprovalDecision.create({
    data: {
      request_id: request.id,
      event_type: SecurityApprovalEventType.REQUESTED,
      actor_id: actorUserId,
      idempotency_key: `EVT-${request.id}-REQUESTED`,
    },
  });

  await appendApprovalAudit(db, {
    actorUserId,
    action: 'SOC_RESPONSE_APPROVAL_REQUESTED',
    targetId: request.id,
    permission: SECURITY_PERMISSIONS.RESPONSE_REQUEST,
    metadata: {
      incident_case_id: input.incident_case_id,
      playbook_id: input.playbook_id,
      playbook_version: input.playbook_version,
    },
  });

  return request;
}

export async function approveResponseRequest(
  db: ApprovalDatabase,
  actorUserId: string,
  input: {
    request_id: string;
    reason?: string;
    validity_duration_ms: number;
  }
) {
  assertInTransaction(db);

  const allowed = await assertSecurityPermissionForService(
    actorUserId,
    SECURITY_PERMISSIONS.RESPONSE_APPROVE,
    db
  );

  if (!allowed) {
    await appendApprovalAudit(db, {
      actorUserId,
      action: 'SOC_RESPONSE_AUTHORIZATION_DENIED',
      permission: SECURITY_PERMISSIONS.RESPONSE_APPROVE,
      metadata: { attemptedAction: 'APPROVE_REQUEST', request_id: input.request_id },
    });
    throw new ApprovalWriterError('UNAUTHORIZED');
  }

  const request = await db.securityResponseApprovalRequest.findUnique({
    where: { id: input.request_id },
  });

  if (!request) {
    throw new ApprovalWriterError('REQUEST_NOT_FOUND');
  }

  if (request.status !== SecurityApprovalStatus.PENDING) {
    throw new ApprovalWriterError('REQUEST_NOT_PENDING');
  }

  if (request.requester_id === actorUserId) {
    throw new ApprovalWriterError('SELF_APPROVAL_NOT_ALLOWED');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + input.validity_duration_ms);

  const updateResult = await db.securityResponseApprovalRequest.updateMany({
    where: { id: request.id, status: SecurityApprovalStatus.PENDING },
    data: {
      status: SecurityApprovalStatus.APPROVED,
      approver_id: actorUserId,
      decision_at: now,
      expires_at: expiresAt,
    },
  });

  if (updateResult.count === 0) {
    throw new ApprovalWriterError('CONCURRENCY_ERROR');
  }

  await db.securityResponseApprovalDecision.create({
    data: {
      request_id: request.id,
      event_type: SecurityApprovalEventType.APPROVED,
      actor_id: actorUserId,
      reason: input.reason,
      idempotency_key: `EVT-${request.id}-APPROVED`,
    },
  });

  const grant = await db.securityResponseApprovalGrant.create({
    data: {
      request_id: request.id,
      incident_case_id: request.incident_case_id,
      playbook_id: request.playbook_id,
      playbook_version: request.playbook_version,
      grant_state: SecurityApprovalGrantState.AVAILABLE,
      expires_at: expiresAt,
    },
  });

  await appendApprovalAudit(db, {
    actorUserId,
    action: 'SOC_RESPONSE_APPROVAL_GRANTED',
    targetId: request.id,
    permission: SECURITY_PERMISSIONS.RESPONSE_APPROVE,
    metadata: {
      incident_case_id: request.incident_case_id,
      playbook_id: request.playbook_id,
      playbook_version: request.playbook_version,
      grant_id: grant.id,
      expires_at: expiresAt.toISOString(),
    },
  });

  return { request: { ...request, status: SecurityApprovalStatus.APPROVED }, grant };
}

export async function rejectResponseRequest(
  db: ApprovalDatabase,
  actorUserId: string,
  input: {
    request_id: string;
    reason: string;
  }
) {
  assertInTransaction(db);

  const allowed = await assertSecurityPermissionForService(
    actorUserId,
    SECURITY_PERMISSIONS.RESPONSE_REJECT,
    db
  );

  if (!allowed) {
    await appendApprovalAudit(db, {
      actorUserId,
      action: 'SOC_RESPONSE_AUTHORIZATION_DENIED',
      permission: SECURITY_PERMISSIONS.RESPONSE_REJECT,
      metadata: { attemptedAction: 'REJECT_REQUEST', request_id: input.request_id },
    });
    throw new ApprovalWriterError('UNAUTHORIZED');
  }

  const request = await db.securityResponseApprovalRequest.findUnique({
    where: { id: input.request_id },
  });

  if (!request) {
    throw new ApprovalWriterError('REQUEST_NOT_FOUND');
  }

  if (request.status !== SecurityApprovalStatus.PENDING) {
    throw new ApprovalWriterError('REQUEST_NOT_PENDING');
  }
  
  if (request.requester_id === actorUserId) {
    throw new ApprovalWriterError('SELF_APPROVAL_NOT_ALLOWED');
  }

  const now = new Date();

  const updateResult = await db.securityResponseApprovalRequest.updateMany({
    where: { id: request.id, status: SecurityApprovalStatus.PENDING },
    data: {
      status: SecurityApprovalStatus.REJECTED,
      approver_id: actorUserId,
      decision_at: now,
    },
  });

  if (updateResult.count === 0) {
    throw new ApprovalWriterError('CONCURRENCY_ERROR');
  }

  await db.securityResponseApprovalDecision.create({
    data: {
      request_id: request.id,
      event_type: SecurityApprovalEventType.REJECTED,
      actor_id: actorUserId,
      reason: input.reason,
      idempotency_key: `EVT-${request.id}-REJECTED`,
    },
  });

  await appendApprovalAudit(db, {
    actorUserId,
    action: 'SOC_RESPONSE_APPROVAL_REJECTED',
    targetId: request.id,
    permission: SECURITY_PERMISSIONS.RESPONSE_REJECT,
    metadata: {
      incident_case_id: request.incident_case_id,
      playbook_id: request.playbook_id,
      playbook_version: request.playbook_version,
      reason: input.reason,
    },
  });

  return { ...request, status: SecurityApprovalStatus.REJECTED };
}

export async function cancelResponseRequest(
  db: ApprovalDatabase,
  actorUserId: string,
  input: {
    request_id: string;
    reason?: string;
  }
) {
  assertInTransaction(db);

  const allowed = await assertSecurityPermissionForService(
    actorUserId,
    SECURITY_PERMISSIONS.RESPONSE_CANCEL,
    db
  );

  if (!allowed) {
    await appendApprovalAudit(db, {
      actorUserId,
      action: 'SOC_RESPONSE_AUTHORIZATION_DENIED',
      permission: SECURITY_PERMISSIONS.RESPONSE_CANCEL,
      metadata: { attemptedAction: 'CANCEL_REQUEST', request_id: input.request_id },
    });
    throw new ApprovalWriterError('UNAUTHORIZED');
  }

  const request = await db.securityResponseApprovalRequest.findUnique({
    where: { id: input.request_id },
  });

  if (!request) {
    throw new ApprovalWriterError('REQUEST_NOT_FOUND');
  }

  if (request.status !== SecurityApprovalStatus.PENDING) {
    throw new ApprovalWriterError('REQUEST_NOT_PENDING');
  }

  const now = new Date();

  const updateResult = await db.securityResponseApprovalRequest.updateMany({
    where: { id: request.id, status: SecurityApprovalStatus.PENDING },
    data: {
      status: SecurityApprovalStatus.CANCELLED,
      decision_at: now,
    },
  });

  if (updateResult.count === 0) {
    throw new ApprovalWriterError('CONCURRENCY_ERROR');
  }

  await db.securityResponseApprovalDecision.create({
    data: {
      request_id: request.id,
      event_type: SecurityApprovalEventType.CANCELLED,
      actor_id: actorUserId,
      reason: input.reason,
      idempotency_key: `EVT-${request.id}-CANCELLED`,
    },
  });

  await appendApprovalAudit(db, {
    actorUserId,
    action: 'SOC_RESPONSE_APPROVAL_CANCELLED',
    targetId: request.id,
    permission: SECURITY_PERMISSIONS.RESPONSE_CANCEL,
    metadata: {
      incident_case_id: request.incident_case_id,
      playbook_id: request.playbook_id,
      playbook_version: request.playbook_version,
    },
  });

  return { ...request, status: SecurityApprovalStatus.CANCELLED };
}

export async function expireResponseRequest(
  db: ApprovalDatabase,
  request_id: string
) {
  assertInTransaction(db);

  const request = await db.securityResponseApprovalRequest.findUnique({
    where: { id: request_id },
  });

  if (!request) {
    throw new ApprovalWriterError('REQUEST_NOT_FOUND');
  }

  if (request.status !== SecurityApprovalStatus.PENDING) {
    throw new ApprovalWriterError('REQUEST_NOT_PENDING');
  }

  const now = new Date();

  const updateResult = await db.securityResponseApprovalRequest.updateMany({
    where: { id: request.id, status: SecurityApprovalStatus.PENDING },
    data: {
      status: SecurityApprovalStatus.EXPIRED,
      decision_at: now,
    },
  });

  if (updateResult.count === 0) {
    throw new ApprovalWriterError('CONCURRENCY_ERROR');
  }

  await db.securityResponseApprovalDecision.create({
    data: {
      request_id: request.id,
      event_type: SecurityApprovalEventType.EXPIRED,
      actor_id: null,
      idempotency_key: `EVT-${request.id}-EXPIRED`,
    },
  });

  return { ...request, status: SecurityApprovalStatus.EXPIRED };
}

export async function revokeApprovalGrant(
  db: ApprovalDatabase,
  actorUserId: string,
  input: {
    request_id: string;
    reason?: string;
  }
) {
  assertInTransaction(db);

  const allowed = await assertSecurityPermissionForService(
    actorUserId,
    SECURITY_PERMISSIONS.RESPONSE_REVOKE,
    db
  );

  if (!allowed) {
    await appendApprovalAudit(db, {
      actorUserId,
      action: 'SOC_RESPONSE_AUTHORIZATION_DENIED',
      permission: SECURITY_PERMISSIONS.RESPONSE_REVOKE,
      metadata: { attemptedAction: 'REVOKE_GRANT', request_id: input.request_id },
    });
    throw new ApprovalWriterError('UNAUTHORIZED');
  }

  const request = await db.securityResponseApprovalRequest.findUnique({
    where: { id: input.request_id },
    include: { grants: true },
  });

  if (!request) {
    throw new ApprovalWriterError('REQUEST_NOT_FOUND');
  }

  if (request.status !== SecurityApprovalStatus.APPROVED) {
    throw new ApprovalWriterError('REQUEST_NOT_APPROVED');
  }

  const grant = request.grants[0];
  if (!grant) {
    throw new ApprovalWriterError('GRANT_NOT_FOUND');
  }

  if (grant.grant_state !== SecurityApprovalGrantState.AVAILABLE) {
    throw new ApprovalWriterError('GRANT_NOT_AVAILABLE');
  }

  const updateResult = await db.securityResponseApprovalGrant.updateMany({
    where: { id: grant.id, grant_state: SecurityApprovalGrantState.AVAILABLE },
    data: {
      grant_state: SecurityApprovalGrantState.REVOKED,
    },
  });

  if (updateResult.count === 0) {
    throw new ApprovalWriterError('CONCURRENCY_ERROR');
  }

  const reqUpdateResult = await db.securityResponseApprovalRequest.updateMany({
    where: { id: request.id, status: SecurityApprovalStatus.APPROVED },
    data: {
      status: SecurityApprovalStatus.REVOKED,
    },
  });

  if (reqUpdateResult.count === 0) {
    throw new ApprovalWriterError('CONCURRENCY_ERROR');
  }

  await db.securityResponseApprovalDecision.create({
    data: {
      request_id: request.id,
      event_type: SecurityApprovalEventType.REVOKED,
      actor_id: actorUserId,
      reason: input.reason,
      idempotency_key: `EVT-${request.id}-REVOKED`,
    },
  });

  await appendApprovalAudit(db, {
    actorUserId,
    action: 'SOC_RESPONSE_GRANT_REVOKED',
    targetId: request.id,
    permission: SECURITY_PERMISSIONS.RESPONSE_REVOKE,
    metadata: {
      grant_id: grant.id,
      reason: input.reason,
    },
  });

  return { request: { ...request, status: SecurityApprovalStatus.REVOKED }, grant: { ...grant, grant_state: SecurityApprovalGrantState.REVOKED } };
}

export async function consumeApprovalGrantForExecution(
  db: ApprovalDatabase,
  actorUserId: string,
  input: {
    grant_id: string;
    idempotency_key: string;
  }
) {
  assertInTransaction(db);

  const allowed = await assertSecurityPermissionForService(
    actorUserId,
    SECURITY_PERMISSIONS.RESPONSE_EXECUTE,
    db
  );

  if (!allowed) {
    throw new ApprovalWriterError('UNAUTHORIZED');
  }

  const grant = await db.securityResponseApprovalGrant.findUnique({
    where: { id: input.grant_id },
    include: { request: true },
  });

  if (!grant) {
    throw new ApprovalWriterError('GRANT_NOT_FOUND');
  }

  if (grant.grant_state !== SecurityApprovalGrantState.AVAILABLE) {
    throw new ApprovalWriterError('GRANT_NOT_AVAILABLE');
  }

  if (grant.expires_at < new Date()) {
    throw new ApprovalWriterError('GRANT_EXPIRED');
  }

  // Prevent self-execution if the policy requires it
  if (grant.request.requester_id === actorUserId) {
    throw new ApprovalWriterError('SELF_EXECUTION_PROHIBITED');
  }

  const consumedGrant = await db.securityResponseApprovalGrant.update({
    where: { id: input.grant_id, grant_state: SecurityApprovalGrantState.AVAILABLE },
    data: {
      grant_state: SecurityApprovalGrantState.CONSUMED,
      consumed_at: new Date(),
    },
  });

  await db.securityResponseApprovalRequest.update({
    where: { id: grant.request_id },
    data: { status: SecurityApprovalStatus.CONSUMED },
  });

  await db.securityResponseApprovalDecision.create({
    data: {
      request_id: grant.request_id,
      event_type: SecurityApprovalEventType.CONSUMED,
      actor_id: actorUserId,
      idempotency_key: input.idempotency_key,
    },
  });

  await appendApprovalAudit(db, {
    actorUserId,
    action: 'SOC_APPROVAL_GRANT_CONSUMED',
    targetId: grant.id,
    permission: SECURITY_PERMISSIONS.RESPONSE_EXECUTE,
    metadata: {
      request_id: grant.request_id,
      incident_case_id: grant.incident_case_id,
    },
  });

  return consumedGrant;
}

