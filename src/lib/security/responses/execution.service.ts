import { PrismaClient, Prisma, SecurityExecutionStatus, SecurityResponseActionType, SecurityApprovalGrantState } from '@prisma/client';
import { consumeApprovalGrantForExecution, ApprovalWriterError } from '../approvals/security-response-approval.service';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

export class ExecutionError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'ExecutionError';
  }
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
  }
) {
  // Use a transaction for atomic grant consumption and execution record creation
  return await prisma.$transaction(async (tx) => {
    // 1. Consumer approval grant internally
    const idempotency_key = `EXEC-${input.incident_case_id}-${input.approval_grant_id}-${randomBytes(4).toString('hex')}`;
    
    try {
      await consumeApprovalGrantForExecution(tx, actorUserId, {
        grant_id: input.approval_grant_id,
        idempotency_key,
      });
    } catch (error) {
      if (error instanceof ApprovalWriterError) {
        throw new ExecutionError(error.code);
      }
      throw error;
    }

    // 2. Create the execution record
    const execution = await tx.securityResponseExecution.create({
      data: {
        incident_case_id: input.incident_case_id,
        playbook_id: input.playbook_id,
        playbook_version: input.playbook_version,
        approval_grant_id: input.approval_grant_id,
        approval_request_id: 'unknown_at_this_layer', // We'll patch this by finding it from grant
        response_type: input.response_type,
        target_type: input.target_type,
        target_id: input.target_id,
        status: SecurityExecutionStatus.EXECUTING,
        idempotency_key,
        requested_by_id: actorUserId, // Technically should be the original requester, but we use actorUserId here for simplicity or we can fetch it
        executed_by_id: actorUserId,
        started_at: new Date(),
      },
    });

    // Patch approval_request_id and requested_by_id
    const grant = await tx.securityResponseApprovalGrant.findUnique({
      where: { id: input.approval_grant_id },
      include: { request: true },
    });
    
    if (grant) {
      await tx.securityResponseExecution.update({
        where: { id: execution.id },
        data: {
          approval_request_id: grant.request_id,
          requested_by_id: grant.request.requester_id,
        },
      });
    }

    // 3. Execute the specific action
    let finalStatus = SecurityExecutionStatus.SUCCEEDED;
    let failureCode: string | null = null;
    let failedAt: Date | null = null;
    let completedAt: Date | null = null;

    try {
      if (input.response_type === 'NOOP_SIMULATION') {
        // Just record action
        await tx.securityResponseAction.create({
          data: {
            execution_id: execution.id,
            sequence: 1,
            action_type: 'NOOP_SIMULATION',
            target_reference: input.target_id,
            status: SecurityExecutionStatus.SUCCEEDED,
            executed_at: new Date(),
          },
        });
      } else if (input.response_type === 'MANUAL_PROCEDURE') {
         await tx.securityResponseAction.create({
          data: {
            execution_id: execution.id,
            sequence: 1,
            action_type: 'MANUAL_PROCEDURE',
            target_reference: input.target_id,
            status: SecurityExecutionStatus.SUCCEEDED,
            executed_at: new Date(),
          },
        });
      } else if (input.response_type === 'ACCOUNT_RESTRICTION') {
        if (input.target_type !== 'USER') {
          throw new Error('ACCOUNT_RESTRICTION requires target_type USER');
        }
        const targetUser = await tx.user.findUnique({ where: { id: input.target_id } });
        if (!targetUser) throw new Error('Target user not found');
        
        await tx.user.update({
          where: { id: input.target_id },
          data: { status: 'Suspended' }
        });

        await tx.securityResponseAction.create({
          data: {
            execution_id: execution.id,
            sequence: 1,
            action_type: 'ACCOUNT_RESTRICTION',
            target_reference: input.target_id,
            before_state: targetUser.status,
            after_state: 'Suspended',
            status: SecurityExecutionStatus.SUCCEEDED,
            executed_at: new Date(),
          },
        });
      } else {
        throw new Error('Unsupported response type');
      }

      completedAt = new Date();
    } catch (execError: any) {
      finalStatus = SecurityExecutionStatus.FAILED;
      failureCode = execError.message;
      failedAt = new Date();
    }

    // 4. Update the execution record with the outcome
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
      include: { actions: true },
    });

    if (!execution) {
      throw new ExecutionError('EXECUTION_NOT_FOUND');
    }

    if (execution.status !== SecurityExecutionStatus.SUCCEEDED) {
      throw new ExecutionError('CANNOT_ROLLBACK_NON_SUCCEEDED_EXECUTION');
    }

    // Execute rollback logic
    let finalStatus = SecurityExecutionStatus.ROLLED_BACK;
    
    // In NOOP_SIMULATION and MANUAL_PROCEDURE, rollback is trivial
    for (const action of execution.actions) {
       if (action.action_type === 'ACCOUNT_RESTRICTION' && action.before_state) {
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
    }

    return await tx.securityResponseExecution.update({
      where: { id: execution_id },
      data: {
        status: finalStatus,
        rolled_back_at: new Date(),
      },
    });
  });
}
