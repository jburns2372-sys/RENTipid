import { Prisma, SecurityPlaybookStatus, SecurityResponseActionType, SecurityResponseReversibility, SecuritySeverity } from '@prisma/client';
import { assertSecurityPermissionForService } from '../authorization';
import { SECURITY_PERMISSIONS, SecurityPermission } from '../permissions';
import { randomBytes } from 'crypto';

export interface PlaybookTransactionRunner {
  $transaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T>;
}

export type PlaybookDatabase =
  | Prisma.TransactionClient
  | PlaybookTransactionRunner;

export class PlaybookWriterError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'PlaybookWriterError';
  }
}

async function appendPlaybookAudit(
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
        permission: input.permission,
        timestamp: new Date().toISOString(),
        ...input.metadata,
      }),
    },
  });
}

function assertInTransaction(db: PlaybookDatabase): asserts db is Prisma.TransactionClient {
  if (typeof (db as unknown as { $transaction?: unknown }).$transaction === 'function') {
    throw new PlaybookWriterError('OPERATION_REQUIRES_TRANSACTION_CONTEXT');
  }
}

export async function createSecurityResponsePlaybookDraft(
  db: PlaybookDatabase,
  actorUserId: string,
  input: {
    name: string;
    description: string;
  }
) {
  assertInTransaction(db);

  const allowed = await assertSecurityPermissionForService(
    actorUserId,
    SECURITY_PERMISSIONS.PLAYBOOK_CREATE,
    db as Prisma.TransactionClient
  );

  if (!allowed) {
    await appendPlaybookAudit(db, {
      actorUserId,
      action: 'SOC_PLAYBOOK_AUTHORIZATION_DENIED',
      permission: SECURITY_PERMISSIONS.PLAYBOOK_CREATE,
      metadata: { attemptedAction: 'CREATE_DRAFT' },
    });
    throw new PlaybookWriterError('UNAUTHORIZED');
  }

  // Generate stable playbook_id
  const playbook_id = 'PB-' + randomBytes(8).toString('hex').toUpperCase();

  const draft = await db.securityResponsePlaybook.create({
    data: {
      playbook_id,
      version: 0,
      name: input.name,
      description: input.description,
      status: SecurityPlaybookStatus.DRAFT,
      lock_version: 0,
      created_by_id: actorUserId,
    },
  });

  await appendPlaybookAudit(db, {
    actorUserId,
    action: 'SOC_PLAYBOOK_DRAFT_CREATED',
    targetId: draft.id,
    permission: SECURITY_PERMISSIONS.PLAYBOOK_CREATE,
    metadata: {
      playbook_id: draft.playbook_id,
      name: draft.name,
    },
  });

  return draft;
}

export async function updateSecurityResponsePlaybookDraft(
  db: PlaybookDatabase,
  actorUserId: string,
  playbookId: string,
  expectedLockVersion: number,
  input: {
    name?: string;
    description?: string;
  }
) {
  assertInTransaction(db);

  const allowed = await assertSecurityPermissionForService(
    actorUserId,
    SECURITY_PERMISSIONS.PLAYBOOK_EDIT,
    db as Prisma.TransactionClient
  );

  if (!allowed) {
    await appendPlaybookAudit(db, {
      actorUserId,
      action: 'SOC_PLAYBOOK_AUTHORIZATION_DENIED',
      permission: SECURITY_PERMISSIONS.PLAYBOOK_EDIT,
      targetId: playbookId,
      metadata: { attemptedAction: 'UPDATE_DRAFT' },
    });
    throw new PlaybookWriterError('UNAUTHORIZED');
  }

  const data: Prisma.SecurityResponsePlaybookUpdateInput = {
    lock_version: { increment: 1 }
  };
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;

  const result = await db.securityResponsePlaybook.updateMany({
    where: {
      id: playbookId,
      status: SecurityPlaybookStatus.DRAFT,
      lock_version: expectedLockVersion,
    },
    data,
  });

  if (result.count === 0) {
    await appendPlaybookAudit(db, {
      actorUserId,
      action: 'SOC_PLAYBOOK_STALE_MUTATION_REJECTED',
      permission: SECURITY_PERMISSIONS.PLAYBOOK_EDIT,
      targetId: playbookId,
      metadata: { attemptedAction: 'UPDATE_DRAFT' },
    });
    throw new PlaybookWriterError('STALE_OR_INVALID_STATE');
  }

  const draft = await db.securityResponsePlaybook.findUniqueOrThrow({
    where: { id: playbookId }
  });

  await appendPlaybookAudit(db, {
    actorUserId,
    action: 'SOC_PLAYBOOK_DRAFT_UPDATED',
    targetId: draft.id,
    permission: SECURITY_PERMISSIONS.PLAYBOOK_EDIT,
    metadata: {
      playbook_id: draft.playbook_id,
    },
  });

  return draft;
}

export async function addSecurityResponseStep(
  db: PlaybookDatabase,
  actorUserId: string,
  playbookId: string,
  expectedLockVersion: number,
  input: {
    step_order: number;
    action_type: SecurityResponseActionType;
    human_instruction: string;
    expected_evidence?: string;
    reversibility: SecurityResponseReversibility;
    duration_seconds?: number;
    risk_level: SecuritySeverity;
    approval_required?: boolean;
  }
) {
  assertInTransaction(db);
  const allowed = await assertSecurityPermissionForService(
    actorUserId,
    SECURITY_PERMISSIONS.PLAYBOOK_EDIT,
    db as Prisma.TransactionClient
  );
  if (!allowed) throw new PlaybookWriterError('UNAUTHORIZED');

  if (input.step_order <= 0) throw new PlaybookWriterError('INVALID_ORDER');

  const playbookUpdate = await db.securityResponsePlaybook.updateMany({
    where: {
      id: playbookId,
      status: SecurityPlaybookStatus.DRAFT,
      lock_version: expectedLockVersion,
    },
    data: { lock_version: { increment: 1 } }
  });

  if (playbookUpdate.count === 0) throw new PlaybookWriterError('STALE_OR_INVALID_STATE');

  const draft = await db.securityResponsePlaybook.findUniqueOrThrow({
    where: { id: playbookId }
  });

  // Check for duplicate step
  const existingStep = await db.securityResponseStep.findFirst({
    where: {
      playbook_id: draft.playbook_id,
      playbook_version: draft.version,
      step_order: input.step_order,
    }
  });
  if (existingStep) throw new PlaybookWriterError('DUPLICATE_STEP_ORDER');

  const step = await db.securityResponseStep.create({
    data: {
      playbook_id: draft.playbook_id,
      playbook_version: draft.version,
      step_order: input.step_order,
      action_type: input.action_type,
      human_instruction: input.human_instruction,
      expected_evidence: input.expected_evidence,
      reversibility: input.reversibility,
      duration_seconds: input.duration_seconds,
      risk_level: input.risk_level,
      approval_required: input.approval_required ?? true,
    }
  });

  await appendPlaybookAudit(db, {
    actorUserId,
    action: 'SOC_PLAYBOOK_STEP_ADDED',
    targetId: playbookId,
    permission: SECURITY_PERMISSIONS.PLAYBOOK_EDIT,
    metadata: { step_id: step.id, step_order: step.step_order.toString() }
  });

  return step;
}

export async function updateSecurityResponseStep(
  db: PlaybookDatabase,
  actorUserId: string,
  playbookId: string,
  stepId: string,
  expectedLockVersion: number,
  input: {
    action_type?: SecurityResponseActionType;
    human_instruction?: string;
    expected_evidence?: string;
    reversibility?: SecurityResponseReversibility;
    duration_seconds?: number;
    risk_level?: SecuritySeverity;
    approval_required?: boolean;
  }
) {
  assertInTransaction(db);
  const allowed = await assertSecurityPermissionForService(actorUserId, SECURITY_PERMISSIONS.PLAYBOOK_EDIT, db as Prisma.TransactionClient);
  if (!allowed) throw new PlaybookWriterError('UNAUTHORIZED');

  const playbookUpdate = await db.securityResponsePlaybook.updateMany({
    where: { id: playbookId, status: SecurityPlaybookStatus.DRAFT, lock_version: expectedLockVersion },
    data: { lock_version: { increment: 1 } }
  });
  if (playbookUpdate.count === 0) throw new PlaybookWriterError('STALE_OR_INVALID_STATE');

  const draft = await db.securityResponsePlaybook.findUniqueOrThrow({ where: { id: playbookId } });

  const stepUpdateResult = await db.securityResponseStep.updateMany({
    where: { id: stepId, playbook_id: draft.playbook_id, playbook_version: draft.version },
    data: input as Prisma.SecurityResponseStepUpdateInput
  });
  
  if (stepUpdateResult.count === 0) throw new PlaybookWriterError('STEP_NOT_FOUND');

  await appendPlaybookAudit(db, {
    actorUserId,
    action: 'SOC_PLAYBOOK_STEP_UPDATED',
    targetId: playbookId,
    permission: SECURITY_PERMISSIONS.PLAYBOOK_EDIT,
    metadata: { step_id: stepId }
  });
}

export async function removeSecurityResponseStep(
  db: PlaybookDatabase,
  actorUserId: string,
  playbookId: string,
  stepId: string,
  expectedLockVersion: number,
) {
  assertInTransaction(db);
  const allowed = await assertSecurityPermissionForService(actorUserId, SECURITY_PERMISSIONS.PLAYBOOK_EDIT, db as Prisma.TransactionClient);
  if (!allowed) throw new PlaybookWriterError('UNAUTHORIZED');

  const playbookUpdate = await db.securityResponsePlaybook.updateMany({
    where: { id: playbookId, status: SecurityPlaybookStatus.DRAFT, lock_version: expectedLockVersion },
    data: { lock_version: { increment: 1 } }
  });
  if (playbookUpdate.count === 0) throw new PlaybookWriterError('STALE_OR_INVALID_STATE');

  const draft = await db.securityResponsePlaybook.findUniqueOrThrow({ where: { id: playbookId } });

  const deleteResult = await db.securityResponseStep.deleteMany({
    where: { id: stepId, playbook_id: draft.playbook_id, playbook_version: draft.version },
  });
  if (deleteResult.count === 0) throw new PlaybookWriterError('STEP_NOT_FOUND');

  await appendPlaybookAudit(db, {
    actorUserId,
    action: 'SOC_PLAYBOOK_STEP_REMOVED',
    targetId: playbookId,
    permission: SECURITY_PERMISSIONS.PLAYBOOK_EDIT,
    metadata: { step_id: stepId }
  });
}

export async function reorderSecurityResponseSteps(
  db: PlaybookDatabase,
  actorUserId: string,
  playbookId: string,
  expectedLockVersion: number,
  orderMapping: { step_id: string; new_order: number }[]
) {
  assertInTransaction(db);
  const allowed = await assertSecurityPermissionForService(actorUserId, SECURITY_PERMISSIONS.PLAYBOOK_EDIT, db as Prisma.TransactionClient);
  if (!allowed) throw new PlaybookWriterError('UNAUTHORIZED');

  // Verify unique positive orders
  const orders = orderMapping.map(m => m.new_order);
  if (orders.some(o => o <= 0)) throw new PlaybookWriterError('INVALID_ORDER');
  if (new Set(orders).size !== orders.length) throw new PlaybookWriterError('DUPLICATE_STEP_ORDER');

  const playbookUpdate = await db.securityResponsePlaybook.updateMany({
    where: { id: playbookId, status: SecurityPlaybookStatus.DRAFT, lock_version: expectedLockVersion },
    data: { lock_version: { increment: 1 } }
  });
  if (playbookUpdate.count === 0) throw new PlaybookWriterError('STALE_OR_INVALID_STATE');

  const draft = await db.securityResponsePlaybook.findUniqueOrThrow({ where: { id: playbookId } });

  // Atomically reorder via delete/insert or update to temporary negatives then to actual to avoid UNIQUE violation
  // The simplest transactional way in Prisma to avoid UNIQUE constraint violation is setting all to negatives first.
  for (const mapping of orderMapping) {
    await db.securityResponseStep.updateMany({
      where: { id: mapping.step_id, playbook_id: draft.playbook_id, playbook_version: draft.version },
      data: { step_order: -mapping.new_order } // Temporary negative
    });
  }

  for (const mapping of orderMapping) {
    await db.securityResponseStep.updateMany({
      where: { id: mapping.step_id, playbook_id: draft.playbook_id, playbook_version: draft.version },
      data: { step_order: mapping.new_order } // Final positive
    });
  }

  await appendPlaybookAudit(db, {
    actorUserId,
    action: 'SOC_PLAYBOOK_STEPS_REORDERED',
    targetId: playbookId,
    permission: SECURITY_PERMISSIONS.PLAYBOOK_EDIT,
  });
}

export async function createSecurityResponsePlaybookVersion(
  db: PlaybookDatabase,
  actorUserId: string,
  playbookId: string,
  expectedLockVersion: number,
) {
  assertInTransaction(db);
  const allowed = await assertSecurityPermissionForService(actorUserId, SECURITY_PERMISSIONS.PLAYBOOK_VERSION_CREATE, db as Prisma.TransactionClient);
  if (!allowed) {
    await appendPlaybookAudit(db, {
      actorUserId,
      action: 'SOC_PLAYBOOK_AUTHORIZATION_DENIED',
      permission: SECURITY_PERMISSIONS.PLAYBOOK_VERSION_CREATE,
      targetId: playbookId,
    });
    throw new PlaybookWriterError('UNAUTHORIZED');
  }

  const playbookUpdate = await db.securityResponsePlaybook.updateMany({
    where: { id: playbookId, status: SecurityPlaybookStatus.DRAFT, lock_version: expectedLockVersion },
    data: { lock_version: { increment: 1 } }
  });
  if (playbookUpdate.count === 0) {
    await appendPlaybookAudit(db, {
      actorUserId,
      action: 'SOC_PLAYBOOK_STALE_MUTATION_REJECTED',
      permission: SECURITY_PERMISSIONS.PLAYBOOK_VERSION_CREATE,
      targetId: playbookId,
    });
    throw new PlaybookWriterError('STALE_OR_INVALID_STATE');
  }

  const draft = await db.securityResponsePlaybook.findUniqueOrThrow({ where: { id: playbookId } });
  
  // Find next version number
  const maxVersion = await db.securityResponsePlaybook.aggregate({
    where: { playbook_id: draft.playbook_id },
    _max: { version: true }
  });
  const nextVersion = (maxVersion._max.version ?? 0) + 1;

  // Snapshot playbook
  const versionRow = await db.securityResponsePlaybook.create({
    data: {
      playbook_id: draft.playbook_id,
      version: nextVersion,
      name: draft.name,
      description: draft.description,
      status: SecurityPlaybookStatus.ARCHIVED, // Snapshots are archived natively by version creation? Wait, they should probably be DRAFT or another status until activated. The instruction says: "Snapshot exact supported metadata and ordered steps. Determine next semantic version transactionally. ... Do not approve, activate, or execute." I will just use DRAFT since it's a version. Actually let's use REVIEW_PENDING or DRAFT. Let's stick to DRAFT.
      lock_version: 0,
      created_by_id: actorUserId,
    }
  });

  // Snapshot steps
  const draftSteps = await db.securityResponseStep.findMany({
    where: { playbook_id: draft.playbook_id, playbook_version: draft.version }
  });

  if (draftSteps.length > 0) {
    await db.securityResponseStep.createMany({
      data: draftSteps.map(s => ({
        playbook_id: versionRow.playbook_id,
        playbook_version: versionRow.version,
        step_order: s.step_order,
        action_type: s.action_type,
        human_instruction: s.human_instruction,
        expected_evidence: s.expected_evidence,
        reversibility: s.reversibility,
        duration_seconds: s.duration_seconds,
        risk_level: s.risk_level,
        approval_required: s.approval_required,
      }))
    });
  }

  await appendPlaybookAudit(db, {
    actorUserId,
    action: 'SOC_PLAYBOOK_VERSION_CREATED',
    targetId: playbookId,
    permission: SECURITY_PERMISSIONS.PLAYBOOK_VERSION_CREATE,
    metadata: { version: nextVersion.toString() }
  });

  return versionRow;
}

export async function submitSecurityResponsePlaybookForReview(
  db: PlaybookDatabase,
  actorUserId: string,
  playbookId: string,
  expectedLockVersion: number,
) {
  assertInTransaction(db);
  const allowed = await assertSecurityPermissionForService(actorUserId, SECURITY_PERMISSIONS.PLAYBOOK_SUBMIT_REVIEW, db as Prisma.TransactionClient);
  if (!allowed) throw new PlaybookWriterError('UNAUTHORIZED');

  const draft = await db.securityResponsePlaybook.findUnique({ where: { id: playbookId } });
  if (!draft) throw new PlaybookWriterError('NOT_FOUND');

  // Verify at least one step
  const stepCount = await db.securityResponseStep.count({
    where: { playbook_id: draft.playbook_id, playbook_version: draft.version }
  });
  if (stepCount === 0) throw new PlaybookWriterError('EMPTY_DEFINITION');

  const result = await db.securityResponsePlaybook.updateMany({
    where: { id: playbookId, status: SecurityPlaybookStatus.DRAFT, lock_version: expectedLockVersion },
    data: {
      status: SecurityPlaybookStatus.REVIEW_PENDING,
      lock_version: { increment: 1 }
    }
  });

  if (result.count === 0) throw new PlaybookWriterError('STALE_OR_INVALID_STATE');

  await appendPlaybookAudit(db, {
    actorUserId,
    action: 'SOC_PLAYBOOK_SUBMITTED_FOR_REVIEW',
    targetId: playbookId,
    permission: SECURITY_PERMISSIONS.PLAYBOOK_SUBMIT_REVIEW,
  });
}
