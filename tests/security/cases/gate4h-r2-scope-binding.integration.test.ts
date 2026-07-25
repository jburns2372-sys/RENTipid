import { PrismaClient, SecurityApprovalGrantState, SecurityApprovalStatus } from '@prisma/client';
import { approveResponseRequest, submitResponseApprovalRequest } from '../../../src/lib/security/approvals/security-response-approval.service';
import { executeSecurityResponse, ExecutionError } from '../../../src/lib/security/responses/execution.service';
import { assertSafeLocalTestDatabaseTarget } from '../../../src/lib/test-database-guard';

const prisma = new PrismaClient();

describe('Gate 4H-R2 Approved-Scope Binding', () => {
  let requesterId: string;
  let approverId: string;
  let playbookId: string;
  let incidentCaseId: string;

  beforeAll(async () => {
    assertSafeLocalTestDatabaseTarget();
    
    const requester = await prisma.user.create({
      data: {
        email: `requester_scope_${Date.now()}@test.com`,
        full_name: 'Scope Requester',
        role: 'SOC_ANALYST',
        status: 'Verified',
        account_type: 'Individual',
      },
    });
    requesterId = requester.id;

    const approver = await prisma.user.create({
      data: {
        email: `approver_scope_${Date.now()}@test.com`,
        full_name: 'Scope Approver',
        role: 'SOC_SUPERVISOR',
        status: 'Verified',
        account_type: 'Individual',
      },
    });
    approverId = approver.id;

    const reporter = await prisma.user.create({
      data: { email: `reporter_scope_${Date.now()}@test.com`, full_name: 'Rep', role: 'Guest', status: 'Verified', account_type: 'Individual' },
    });
    
    const incCase = await prisma.incidentCase.create({
      data: {
        title: 'Test Case Scope',
        summary: 'Test',
        severity: 'MEDIUM',
        status: 'OPEN',
        created_by_user_id: reporter.id,
        case_reference: `INC-20240101-${Math.random().toString(36).substring(2, 10).toUpperCase().padEnd(8, '0')}`,
        origin: 'MANUAL',
        opened_at: new Date(),
      },
    });
    incidentCaseId = incCase.id;

    const pb = await prisma.securityResponsePlaybook.create({
      data: {
        playbook_id: `PB-SCOPE-${Date.now()}`,
        version: 1,
        name: 'Test PB Scope',
        description: 'Desc',
        status: 'ACTIVE',
        lock_version: 0,
        created_by_id: approverId,
      },
    });
    playbookId = pb.playbook_id;
    
    await prisma.systemSetting.upsert({
      where: { setting_key: 'SOC_RESPONSE_EMERGENCY_FREEZE' },
      update: { setting_value: 'FALSE' },
      create: { setting_key: 'SOC_RESPONSE_EMERGENCY_FREEZE', setting_value: 'FALSE' }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Rejects execution request with mismatched caller-provided scope without consuming grant', async () => {
    let grantId = '';
    await prisma.$transaction(async (tx) => {
      const req = await submitResponseApprovalRequest(tx, requesterId, {
        incident_case_id: incidentCaseId,
        playbook_id: playbookId,
        playbook_version: 1,
        justification: 'Need mismatched consumption test',
        response_type: 'NOOP_SIMULATION',
        target_type: 'SYSTEM',
        target_id: 'sys_123'
      });

      const approved = await approveResponseRequest(tx, approverId, {
        request_id: req.id,
        validity_duration_ms: 3600000,
      });
      grantId = approved.grant.id;
    });

    const executorId = approverId; // Different from requester
    
    await expect(
      executeSecurityResponse(executorId, {
        incident_case_id: incidentCaseId,
        playbook_id: playbookId,
        playbook_version: 1,
        approval_grant_id: grantId,
        response_type: 'ACCOUNT_RESTRICTION', // Mismatch!
        target_type: 'USER', // Mismatch!
        target_id: 'user_123', // Mismatch!
        idempotency_key: `exec-mismatch-${Date.now()}`
      })
    ).rejects.toThrow(new ExecutionError('GRANT_MISMATCH'));
    
    // Ensure grant is still available
    const grant = await prisma.securityResponseApprovalGrant.findUnique({ where: { id: grantId }});
    expect(grant?.grant_state).toBe(SecurityApprovalGrantState.AVAILABLE);
  });

  it('Post-submission scope change is rejected because no update API exists', async () => {
    const api = await import('../../../src/lib/security/approvals/security-response-approval-api');
    const handlers = api.createApprovalApiHandlers({
      database: prisma,
      getAuthenticatedUser: async () => ({ id: requesterId })
    });
    // The handlers should not have any method that updates scope
    expect(handlers).not.toHaveProperty('updateRequestScope');
    expect(handlers).not.toHaveProperty('updateRequest');
  });
  
  it('Executes successfully with correct matching scope', async () => {
    let grantId = '';
    await prisma.$transaction(async (tx) => {
      const req = await submitResponseApprovalRequest(tx, requesterId, {
        incident_case_id: incidentCaseId,
        playbook_id: playbookId,
        playbook_version: 1,
        justification: 'Need exact consumption test',
        response_type: 'NOOP_SIMULATION',
        target_type: 'SYSTEM',
        target_id: 'sys_456'
      });

      const approved = await approveResponseRequest(tx, approverId, {
        request_id: req.id,
        validity_duration_ms: 3600000,
      });
      grantId = approved.grant.id;
    });

    const executorId = approverId;
    
    const execution = await executeSecurityResponse(executorId, {
      incident_case_id: incidentCaseId,
      playbook_id: playbookId,
      playbook_version: 1,
      approval_grant_id: grantId,
      response_type: 'NOOP_SIMULATION',
      target_type: 'SYSTEM',
      target_id: 'sys_456',
      idempotency_key: `exec-match-${Date.now()}`
    });
    
    expect(execution.status).toBe('SUCCEEDED');
    
    const grant = await prisma.securityResponseApprovalGrant.findUnique({ where: { id: grantId }});
    expect(grant?.grant_state).toBe(SecurityApprovalGrantState.CONSUMED);
  });
});
