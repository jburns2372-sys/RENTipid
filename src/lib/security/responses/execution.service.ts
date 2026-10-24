import { PrismaClient, Prisma, SecurityExecutionStatus, SecurityResponseActionType, SecurityApprovalGrantState } from '@prisma/client';
import { consumeApprovalGrantForExecution, ApprovalWriterError } from '../approvals/security-response-approval.service';
import { SECURITY_PERMISSIONS, SecurityPermission } from '../permissions';

const prisma = new PrismaClient();

export class ExecutionError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'ExecutionError';
  }
}

async function appendExecutionAudit(
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

export async function executeSecurityResponse(
  actorUserId: string,
  input: {
    incident_case_id: string;
    playbook_id: string;
    playbook_version: number;
    approval_grant_id: string;
    response_type: SecurityResponseActionType;
    target_type: string;
    target_id: string;
    idempotency_key: string;
  }
) {
  return await prisma.$transaction(async (tx) => {
    // 0. Check emergency freeze
    const freezeSetting = await tx.systemSetting.findUnique({
      where: { setting_key: 'SOC_RESPONSE_EMERGENCY_FREEZE' }
    });
    if (!freezeSetting || freezeSetting.setting_value !== 'FALSE') {
      throw new ExecutionError('EMERGENCY_FREEZE_ACTIVE');
    }

    // 1. Audit Request
    await appendExecutionAudit(tx, {
      actorUserId,
      action: 'SOC_RESPONSE_EXECUTION_REQUESTED',
      permission: SECURITY_PERMISSIONS.RESPONSE_EXECUTE,
      metadata: { input }
    });

    // 2. Check Idempotency Key
    const existingExecution = await tx.securityResponseExecution.findUnique({
      where: { idempotency_key: input.idempotency_key },
      include: { actions: true }
    });

    if (existingExecution) {
      if (existingExecution.approval_grant_id !== input.approval_grant_id) {
        throw new ExecutionError('IDEMPOTENCY_CONFLICT');
      }
      return existingExecution;
    }

    // Check grant mismatch
    const existingGrantExec = await tx.securityResponseExecution.findUnique({
      where: { approval_grant_id: input.approval_grant_id }
    });
    if (existingGrantExec) {
      throw new ExecutionError('GRANT_ALREADY_CONSUMED');
    }

    // 3. Consume Approval Grant Internally
    // The grant itself handles expiration, revocation, state checks.
    try {
      await consumeApprovalGrantForExecution(tx, actorUserId, {
        grant_id: input.approval_grant_id,
        idempotency_key: input.idempotency_key,
      });
    } catch (error) {
      if (error instanceof ApprovalWriterError) {
        throw new ExecutionError(error.code);
      }
      throw error;
    }

    // Verify properties match
    const grant = await tx.securityResponseApprovalGrant.findUnique({
      where: { id: input.approval_grant_id },
      include: { request: true },
    });
    
    if (!grant) {
        throw new ExecutionError('GRANT_NOT_FOUND');
    }

    if (!grant.request.response_type || !grant.request.target_type || !grant.request.target_id) {
       throw new ExecutionError('APPROVAL_SCOPE_MISSING');
    }

    if (grant.incident_case_id !== input.incident_case_id ||
        grant.playbook_id !== input.playbook_id ||
        grant.playbook_version !== input.playbook_version) {
       throw new ExecutionError('GRANT_MISMATCH');
    }

    if (grant.request.response_type !== input.response_type ||
        grant.request.target_type !== input.target_type ||
        grant.request.target_id !== input.target_id) {
       throw new ExecutionError('GRANT_MISMATCH');
    }

    // 4. Create the execution record (using derived scope)
    const execution = await tx.securityResponseExecution.create({
      data: {
        incident_case_id: grant.incident_case_id,
        playbook_id: grant.playbook_id,
        playbook_version: grant.playbook_version,
        approval_grant_id: input.approval_grant_id,
        approval_request_id: grant.request_id,
        response_type: grant.request.response_type,
        target_type: grant.request.target_type,
        target_id: grant.request.target_id,
        status: SecurityExecutionStatus.EXECUTING,
        idempotency_key: input.idempotency_key,
        requested_by_id: grant.request.requester_id,
        executed_by_id: actorUserId,
        started_at: new Date(),
      },
    });

    await appendExecutionAudit(tx, {
      actorUserId,
      action: 'SOC_RESPONSE_ACTION_STARTED',
      targetId: execution.id,
      permission: SECURITY_PERMISSIONS.RESPONSE_EXECUTE,
      metadata: { response_type: grant.request.response_type }
    });

    // 5. Execute the specific action
    let finalStatus: SecurityExecutionStatus = SecurityExecutionStatus.SUCCEEDED;
    let failureCode: string | null = null;
    let failedAt: Date | null = null;
    let completedAt: Date | null = null;

    try {
      if (grant.request.response_type === 'NOOP_SIMULATION') {
        await tx.securityResponseAction.create({
          data: {
            execution_id: execution.id,
            sequence: 1,
            action_type: 'NOOP_SIMULATION',
            target_reference: grant.request.target_id,
            status: SecurityExecutionStatus.SUCCEEDED,
            executed_at: new Date(),
          },
        });
      } else if (grant.request.response_type === 'MANUAL_PROCEDURE') {
         await tx.securityResponseAction.create({
          data: {
            execution_id: execution.id,
            sequence: 1,
            action_type: 'MANUAL_PROCEDURE',
            target_reference: grant.request.target_id,
            status: SecurityExecutionStatus.SUCCEEDED,
            executed_at: new Date(),
          },
        });
      } else if (grant.request.response_type === 'ACCOUNT_RESTRICTION') {
        if (grant.request.target_type !== 'USER') {
          throw new Error('ACCOUNT_RESTRICTION requires target_type USER');
        }
        const targetUser = await tx.user.findUnique({ where: { id: grant.request.target_id } });
        if (!targetUser) throw new Error('Target user not found');
        
        await tx.user.update({
          where: { id: grant.request.target_id },
          data: { status: 'Suspended' }
        });

        await tx.securityResponseAction.create({
          data: {
            execution_id: execution.id,
            sequence: 1,
            action_type: 'ACCOUNT_RESTRICTION',
            target_reference: grant.request.target_id,
            before_state: targetUser.status, // Capture before-state safely
            after_state: 'Suspended',
            status: SecurityExecutionStatus.SUCCEEDED,
            executed_at: new Date(),
          },
        });
      } else {
        throw new Error('Unsupported response type');
      }

      completedAt = new Date();
      await appendExecutionAudit(tx, {
        actorUserId,
        action: 'SOC_RESPONSE_ACTION_SUCCEEDED',
        targetId: execution.id,
        permission: SECURITY_PERMISSIONS.RESPONSE_EXECUTE,
        metadata: { response_type: grant.request.response_type }
      });
      await appendExecutionAudit(tx, {
        actorUserId,
        action: 'SOC_RESPONSE_EXECUTION_SUCCEEDED',
        targetId: execution.id,
        permission: SECURITY_PERMISSIONS.RESPONSE_EXECUTE,
        metadata: { response_type: grant.request.response_type }
      });
    } catch (execError: any) {
      finalStatus = SecurityExecutionStatus.FAILED;
      failureCode = 'EXECUTION_FAILED';
      failedAt = new Date();
      await appendExecutionAudit(tx, {
        actorUserId,
        action: 'SOC_RESPONSE_ACTION_FAILED',
        targetId: execution.id,
        permission: SECURITY_PERMISSIONS.RESPONSE_EXECUTE,
        metadata: { response_type: grant.request.response_type, failureCode }
      });
      await appendExecutionAudit(tx, {
        actorUserId,
        action: 'SOC_RESPONSE_EXECUTION_FAILED',
        targetId: execution.id,
        permission: SECURITY_PERMISSIONS.RESPONSE_EXECUTE,
        metadata: { response_type: grant.request.response_type, failureCode }
      });
    }

    // 6. Update the execution record with the outcome
    const finalizedExecution = await tx.securityResponseExecution.update({
      where: { id: execution.id },
      data: {
        status: finalStatus,
        failure_code: failureCode,
        failed_at: failedAt,
        completed_at: completedAt,
      },
      include: { actions: true },
    });

    return finalizedExecution;
  });
}

export async function rollbackSecurityResponse(
  actorUserId: string,
  execution_id: string
) {
  return await prisma.$transaction(async (tx) => {
    const execution = await tx.securityResponseExecution.findUnique({
      where: { id: execution_id },
      include: { actions: { orderBy: { sequence: 'desc' } } }, // Reverse-order rollback
    });

    if (!execution) {
      throw new ExecutionError('EXECUTION_NOT_FOUND');
    }

    if (execution.status === SecurityExecutionStatus.ROLLED_BACK) {
        return execution;
    }

    if (execution.status !== SecurityExecutionStatus.SUCCEEDED && execution.status !== SecurityExecutionStatus.FAILED) {
      throw new ExecutionError('CANNOT_ROLLBACK_INCOMPLETE_EXECUTION');
    }

    await appendExecutionAudit(tx, {
      actorUserId,
      action: 'SOC_RESPONSE_ROLLBACK_REQUESTED',
      targetId: execution.id,
      permission: SECURITY_PERMISSIONS.RESPONSE_ROLLBACK,
    });

    // Execute rollback logic
    let finalStatus: SecurityExecutionStatus = SecurityExecutionStatus.ROLLED_BACK;
    let rollbackFailed = false;
    
    for (const action of execution.actions) {
       if (action.status !== SecurityExecutionStatus.SUCCEEDED) {
           continue; // Skip failed actions
       }

       if (action.action_type === 'ACCOUNT_RESTRICTION' && action.before_state) {
         const currentUser = await tx.user.findUnique({ where: { id: action.target_reference } });
         if (!currentUser) {
            rollbackFailed = true;
            await appendExecutionAudit(tx, {
               actorUserId, action: 'SOC_RESPONSE_ROLLBACK_FAILED', targetId: execution.id,
               permission: SECURITY_PERMISSIONS.RESPONSE_ROLLBACK, metadata: { code: 'TARGET_MISSING' }
            });
            break;
         }
         
         // Divergence detection
         if (currentUser.status !== action.after_state) {
            rollbackFailed = true;
            await appendExecutionAudit(tx, {
               actorUserId, action: 'SOC_RESPONSE_ROLLBACK_FAILED', targetId: execution.id,
               permission: SECURITY_PERMISSIONS.RESPONSE_ROLLBACK, metadata: { code: 'STATE_DIVERGENCE' }
            });
            break;
         }

         await tx.user.update({
           where: { id: action.target_reference },
           data: { status: action.before_state }
         });
       }

       await tx.securityResponseAction.update({
         where: { id: action.id },
         data: {
           status: SecurityExecutionStatus.ROLLED_BACK,
           rolled_back_at: new Date(),
         },
       });
       await appendExecutionAudit(tx, {
         actorUserId, action: 'SOC_RESPONSE_ACTION_ROLLED_BACK', targetId: execution.id,
         permission: SECURITY_PERMISSIONS.RESPONSE_ROLLBACK, metadata: { action_id: action.id }
       });
    }

    if (rollbackFailed) {
      finalStatus = SecurityExecutionStatus.ROLLBACK_FAILED;
    } else {
      await appendExecutionAudit(tx, {
        actorUserId, action: 'SOC_RESPONSE_EXECUTION_ROLLED_BACK', targetId: execution.id,
        permission: SECURITY_PERMISSIONS.RESPONSE_ROLLBACK
      });
    }

    // Increment lock_version for concurrency
    return await tx.securityResponseExecution.update({
      where: { 
         id: execution_id,
         lock_version: execution.lock_version // conditional update
      },
      data: {
        status: finalStatus,
        rolled_back_at: rollbackFailed ? null : new Date(),
        lock_version: { increment: 1 }
      },
      include: { actions: true },
    });
  });
}
