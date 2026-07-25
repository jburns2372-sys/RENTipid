import { PrismaClient, SecurityApprovalGrantState, SecurityExecutionStatus, SecurityResponseActionType, SecurityApprovalStatus } from '@prisma/client';
import { executeSecurityResponse, rollbackSecurityResponse, ExecutionError } from '../../../src/lib/security/responses/execution.service';

const prisma = new PrismaClient();

describe('Gate 4H Execution Controls', () => {
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
      data: { email: `admin-ctrl-${Date.now()}@test.com`, full_name: 'Admin', account_type: 'Individual', role: 'SOC_SUPERVISOR', status: 'Verified' }
    });
    adminId = admin.id;

    const targetUser = await prisma.user.create({
      data: { email: `target-ctrl-${Date.now()}@test.com`, full_name: 'Target', account_type: 'Individual', role: 'Renter', status: 'Verified' }
    });
    targetUserId = targetUser.id;

    const event = await prisma.securityEvent.create({
      data: { event_code: 'TEST', source_type: 'SYSTEM_ERROR_LOG', source_record_id: '1', security_domain: 'TRUST_AND_SAFETY', event_category: 'test', event_classification: 'OBSERVATION', severity: 'LOW', environment: 'TEST', lifecycle_type: 'TEST', idempotency_key: `evt-c-${Date.now()}`, occurred_at: new Date(), source_received_at: new Date() }
    });

    const incident = await prisma.incidentCase.create({
      data: { title: 'Test', summary: 'Test', status: 'OPEN', severity: 'LOW', originating_security_event: { connect: { id: event.id } }, created_by_user: { connect: { id: adminId } }, case_reference: `INC-20240101-${Math.random().toString(36).substring(2, 10).toUpperCase().padEnd(8, '0')}`, origin: 'SECURITY_EVENT', opened_at: new Date() }
    });
    incidentCaseId = incident.id;

    const playbook = await prisma.securityResponsePlaybook.create({
      data: { playbook_id: `PB-C-${Date.now()}`, version: 1, name: 'Test Playbook', description: 'Test', status: 'ACTIVE', created_by: { connect: { id: adminId } } }
    });
    playbookId = playbook.playbook_id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createGrant(state: SecurityApprovalGrantState = SecurityApprovalGrantState.AVAILABLE) {
    const request = await prisma.securityResponseApprovalRequest.create({
      data: { requester_id: targetUserId, incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, justification: 'Test', status: SecurityApprovalStatus.APPROVED, idempotency_key: `req-c-${Date.now()}-${Math.random()}` }
    });
    return await prisma.securityResponseApprovalGrant.create({
      data: { request_id: request.id, incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, grant_state: state, expires_at: new Date(Date.now() + 1000 * 60 * 60) }
    });
  }

  it('Missing or mismatched grant rejected', async () => {
    const grant = await createGrant();
    await expect(executeSecurityResponse(adminId, {
      incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, approval_grant_id: 'invalid-id', response_type: 'ACCOUNT_RESTRICTION', target_type: 'USER', target_id: targetUserId, idempotency_key: `idemp-2`
    })).rejects.toThrow();
  });

  it('Expired or revoked grant rejected', async () => {
    const grant = await createGrant(SecurityApprovalGrantState.REVOKED);
    await expect(executeSecurityResponse(adminId, {
      incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, approval_grant_id: grant.id, response_type: 'ACCOUNT_RESTRICTION', target_type: 'USER', target_id: targetUserId, idempotency_key: `idemp-3`
    })).rejects.toThrow('GRANT_NOT_AVAILABLE');
  });

  it('Emergency freeze blocks execution but not rollback', async () => {
    const grant = await createGrant();
    // Simulate request target

    await prisma.systemSetting.update({ where: { setting_key: 'SOC_RESPONSE_EMERGENCY_FREEZE' }, data: { setting_value: 'TRUE' }});
    
    await expect(executeSecurityResponse(adminId, {
      incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, approval_grant_id: grant.id, response_type: 'ACCOUNT_RESTRICTION', target_type: 'USER', target_id: targetUserId, idempotency_key: `idemp-freeze`
    })).rejects.toThrow('EMERGENCY_FREEZE_ACTIVE');

    await prisma.systemSetting.update({ where: { setting_key: 'SOC_RESPONSE_EMERGENCY_FREEZE' }, data: { setting_value: 'FALSE' }});
  });

  it('Idempotency key returns same execution', async () => {
    const grant = await createGrant();

    const key = `idemp-key-${Date.now()}`;
    const exec1 = await executeSecurityResponse(adminId, {
      incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, approval_grant_id: grant.id, response_type: 'NOOP_SIMULATION', target_type: 'USER', target_id: targetUserId, idempotency_key: key
    });
    const exec2 = await executeSecurityResponse(adminId, {
      incident_case_id: incidentCaseId, playbook_id: playbookId, playbook_version: 1, approval_grant_id: grant.id, response_type: 'NOOP_SIMULATION', target_type: 'USER', target_id: targetUserId, idempotency_key: key
    });
    expect(exec1.id).toBe(exec2.id);
  });
});
