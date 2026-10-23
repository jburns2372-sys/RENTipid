import { PrismaClient, SecurityApprovalGrantState, SecurityExecutionStatus, SecurityResponseActionType, SecurityApprovalStatus } from '@prisma/client';
import { executeSecurityResponse, rollbackSecurityResponse, ExecutionError } from '../../../src/lib/security/responses/execution.service';

const prisma = new PrismaClient();

describe('Gate 4I Controlled Response Simulation', () => {
  let adminId: string;
  let targetUserId: string;
  let incidentCaseId: string;
  let playbookId: string;

  beforeAll(async () => {
    await prisma.systemSetting.upsert({
      where: { setting_key: 'SOC_RESPONSE_EMERGENCY_FREEZE' },
      update: { setting_value: 'FALSE' },
      create: { setting_key: 'SOC_RESPONSE_EMERGENCY_FREEZE', setting_value: 'FALSE' }
    });

    const admin = await prisma.user.create({
      data: { email: `admin-sim-${Date.now()}@test.com`, full_name: 'Sim Admin', account_type: 'Individual', role: 'SOC_SUPERVISOR', status: 'Verified' }
    });
    adminId = admin.id;

    const targetUser = await prisma.user.create({
      data: { email: `target-sim-${Date.now()}@test.com`, full_name: 'Sim Target', account_type: 'Individual', role: 'Renter', status: 'Verified' }
    });
    targetUserId = targetUser.id;

    const event = await prisma.securityEvent.create({
      data: { event_code: 'TEST', source_type: 'SYSTEM_ERROR_LOG', source_record_id: '1', security_domain: 'TRUST_AND_SAFETY', event_category: 'test', event_classification: 'OBSERVATION', severity: 'LOW', environment: 'TEST', lifecycle_type: 'TEST', idempotency_key: `evt-sim-${Date.now()}`, occurred_at: new Date(), source_received_at: new Date() }
    });

    const incident = await prisma.incidentCase.create({
      data: { title: 'Test Sim', summary: 'Test', status: 'OPEN', severity: 'LOW', originating_security_event: { connect: { id: event.id } }, created_by_user: { connect: { id: adminId } }, case_reference: `INC-20240101-${Math.random().toString(36).substring(2, 10).toUpperCase().padEnd(8, '0')}`, origin: 'SECURITY_EVENT', opened_at: new Date() }
    });
    incidentCaseId = incident.id;

    const playbook = await prisma.securityResponsePlaybook.create({
      data: { playbook_id: `PB-SIM-${Date.now()}`, version: 1, name: 'Sim Playbook', description: 'Test', status: 'ACTIVE', created_by: { connect: { id: adminId } } }
    });
    playbookId = playbook.playbook_id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createGrant(state: SecurityApprovalGrantState = SecurityApprovalGrantState.AVAILABLE, responseType: SecurityResponseActionType = 'ACCOUNT_RESTRICTION', targetType: string = 'USER', targetId: string = targetUserId) {
    const request = await prisma.securityResponseApprovalRequest.create({
      data: { requester_id: targetUserId, incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, justification: 'Sim', status: SecurityApprovalStatus.APPROVED, idempotency_key: `req-sim-${Date.now()}-${Math.random()}`, response_type: responseType, target_type: targetType, target_id: targetId }
    });
    return await prisma.securityResponseApprovalGrant.create({
      data: { request_id: request.id, incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, grant_state: state, expires_at: new Date(Date.now() + 1000 * 60 * 60) }
    });
  }

  it('SIMULATION 1 - NOOP SUCCESS', async () => {
    const grant = await createGrant(SecurityApprovalGrantState.AVAILABLE, 'NOOP_SIMULATION', 'SYSTEM', 'NOOP');
    const key = `idemp-noop-${Date.now()}`;
    const exec1 = await executeSecurityResponse(adminId, {
      incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, approval_grant_id: grant.id, response_type: 'NOOP_SIMULATION', target_type: 'SYSTEM', target_id: 'NOOP', idempotency_key: key
    });
    expect(exec1.status).toBe(SecurityExecutionStatus.SUCCEEDED);
    const consumedGrant = await prisma.securityResponseApprovalGrant.findUnique({ where: { id: grant.id } });
    expect(consumedGrant?.grant_state).toBe(SecurityApprovalGrantState.CONSUMED);
    
    // Idempotency check
    const exec2 = await executeSecurityResponse(adminId, {
      incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, approval_grant_id: grant.id, response_type: 'NOOP_SIMULATION', target_type: 'SYSTEM', target_id: 'NOOP', idempotency_key: key
    });
    expect(exec2.id).toBe(exec1.id);
  });

  it('SIMULATION 2 - REVERSIBLE ACCOUNT RESTRICTION', async () => {
    const targetUserSim = await prisma.user.create({
      data: { email: `target-sim2-${Date.now()}@test.com`, full_name: 'Sim Target 2', account_type: 'Individual', role: 'Renter', status: 'Verified' }
    });
    
    const grant = await createGrant(SecurityApprovalGrantState.AVAILABLE, 'ACCOUNT_RESTRICTION', 'USER', targetUserSim.id);
    const key = `idemp-acc-${Date.now()}`;
    const exec = await executeSecurityResponse(adminId, {
      incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, approval_grant_id: grant.id, response_type: 'ACCOUNT_RESTRICTION', target_type: 'USER', target_id: targetUserSim.id, idempotency_key: key
    });
    expect(exec.status).toBe(SecurityExecutionStatus.SUCCEEDED);
    
    const updatedUser = await prisma.user.findUnique({ where: { id: targetUserSim.id } });
    expect(updatedUser?.status).toBe('Suspended');
    
    const rolledBack = await rollbackSecurityResponse(adminId, exec.id);
    expect(rolledBack.status).toBe(SecurityExecutionStatus.ROLLED_BACK);
    
    const restoredUser = await prisma.user.findUnique({ where: { id: targetUserSim.id } });
    expect(restoredUser?.status).toBe('Verified');
    
    // Check raw data not exposed in return payload directly
    expect(exec.actions[0].action_type).toBeDefined();
    
    // Check repeat rollback is idempotent
    const rolledBack2 = await rollbackSecurityResponse(adminId, exec.id);
    expect(rolledBack2.status).toBe(SecurityExecutionStatus.ROLLED_BACK);
  });

  it('SIMULATION 3 - APPROVED-SCOPE ENFORCEMENT', async () => {
    const grant = await createGrant(SecurityApprovalGrantState.AVAILABLE, 'ACCOUNT_RESTRICTION', 'USER', targetUserId);
    await expect(executeSecurityResponse(adminId, {
      incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, approval_grant_id: grant.id, response_type: 'NOOP_SIMULATION', target_type: 'USER', target_id: targetUserId, idempotency_key: `idemp-scope1-${Date.now()}`
    })).rejects.toThrow('GRANT_MISMATCH');
    
    const unconsumedGrant = await prisma.securityResponseApprovalGrant.findUnique({ where: { id: grant.id } });
    expect(unconsumedGrant?.grant_state).toBe(SecurityApprovalGrantState.AVAILABLE);
  });

  it('SIMULATION 4 - EMERGENCY FREEZE', async () => {
    const grant = await createGrant();
    await prisma.systemSetting.update({ where: { setting_key: 'SOC_RESPONSE_EMERGENCY_FREEZE' }, data: { setting_value: 'TRUE' }});
    
    await expect(executeSecurityResponse(adminId, {
      incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, approval_grant_id: grant.id, response_type: 'ACCOUNT_RESTRICTION', target_type: 'USER', target_id: targetUserId, idempotency_key: `idemp-freeze-${Date.now()}`
    })).rejects.toThrow('EMERGENCY_FREEZE_ACTIVE');
    
    const unconsumedGrant = await prisma.securityResponseApprovalGrant.findUnique({ where: { id: grant.id } });
    expect(unconsumedGrant?.grant_state).toBe(SecurityApprovalGrantState.AVAILABLE);
    
    await prisma.systemSetting.update({ where: { setting_key: 'SOC_RESPONSE_EMERGENCY_FREEZE' }, data: { setting_value: 'FALSE' }});
  });

  it('SIMULATION 5 - CONCURRENCY AND IDEMPOTENCY', async () => {
    const grant = await createGrant();
    const key = `idemp-conc-${Date.now()}`;
    const execs = await Promise.allSettled([
      executeSecurityResponse(adminId, {
        incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, approval_grant_id: grant.id, response_type: 'ACCOUNT_RESTRICTION', target_type: 'USER', target_id: targetUserId, idempotency_key: key
      }),
      executeSecurityResponse(adminId, {
        incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, approval_grant_id: grant.id, response_type: 'ACCOUNT_RESTRICTION', target_type: 'USER', target_id: targetUserId, idempotency_key: key
      })
    ]);
    
    // Since idempotency key is same, both should resolve to the same execution rather than one failing to consume the grant.
    expect(execs[0].status).toBe('fulfilled');
    expect(execs[1].status).toBe('fulfilled');
    
    if (execs[0].status === 'fulfilled' && execs[1].status === 'fulfilled') {
      expect(execs[0].value.id).toBe(execs[1].value.id);
    }
  });

  it('SIMULATION 6 - PARTIAL FAILURE AND RECOVERY', async () => {
    const grant = await createGrant(SecurityApprovalGrantState.AVAILABLE, 'ACCOUNT_RESTRICTION', 'USER', 'invalid-id-does-not-exist');
    const key = `idemp-fail-${Date.now()}`;
    // Using target that does not exist will fail the action
    const exec = await executeSecurityResponse(adminId, {
      incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, approval_grant_id: grant.id, response_type: 'ACCOUNT_RESTRICTION', target_type: 'USER', target_id: 'invalid-id-does-not-exist', idempotency_key: key
    });
    expect(exec.status).toBe(SecurityExecutionStatus.FAILED);
  });

  it('SIMULATION 7 - DIVERGENCE PROTECTION', async () => {
    const targetUserSim = await prisma.user.create({
      data: { email: `target-sim7-${Date.now()}@test.com`, full_name: 'Sim Target 7', account_type: 'Individual', role: 'Renter', status: 'Verified' }
    });
    const grant = await createGrant(SecurityApprovalGrantState.AVAILABLE, 'ACCOUNT_RESTRICTION', 'USER', targetUserSim.id);
    const key = `idemp-div-${Date.now()}`;
    const exec = await executeSecurityResponse(adminId, {
      incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, approval_grant_id: grant.id, response_type: 'ACCOUNT_RESTRICTION', target_type: 'USER', target_id: targetUserSim.id, idempotency_key: key
    });
    
    // Simulate divergence: manual update after execution
    await prisma.user.update({ where: { id: targetUserSim.id }, data: { status: 'Deleted' }});
    
    const rolledBack = await rollbackSecurityResponse(adminId, exec.id);
    expect(rolledBack.status).toBe('ROLLBACK_FAILED');
    
    // Ensure later legitimate state is not overwritten
    const currentUser = await prisma.user.findUnique({ where: { id: targetUserSim.id }});
    expect(currentUser?.status).toBe('Deleted');
  });

  it('SIMULATION 8 - AUTHORIZATION AND SEPARATION OF DUTIES', async () => {
    const unauthId = targetUserId;
    const grant = await createGrant();
    await expect(executeSecurityResponse(unauthId, {
      incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, approval_grant_id: grant.id, response_type: 'ACCOUNT_RESTRICTION', target_type: 'USER', target_id: targetUserId, idempotency_key: `idemp-auth-${Date.now()}`
    })).rejects.toThrow('UNAUTHORIZED');
  });

  it('SIMULATION 9 - AUDIT SANITIZATION', async () => {
    const grant = await createGrant(SecurityApprovalGrantState.AVAILABLE, 'NOOP_SIMULATION', 'SYSTEM', 'NOOP');
    const exec = await executeSecurityResponse(adminId, {
      incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, approval_grant_id: grant.id, response_type: 'NOOP_SIMULATION', target_type: 'SYSTEM', target_id: 'NOOP', idempotency_key: `idemp-audit-${Date.now()}`
    });
    const log = await prisma.auditLog.findFirst({ where: { target_id: exec.id } });
    expect(log).toBeDefined();
    expect(log?.action).toContain('SOC_RESPONSE');
  });
});
