import { PrismaClient, SecurityApprovalGrantState, SecurityExecutionStatus, SecurityResponseActionType, SecurityApprovalStatus } from '@prisma/client';
import { executeSecurityResponse, rollbackSecurityResponse } from '../../../src/lib/security/responses/execution.service';

const prisma = new PrismaClient();

describe('Gate 4H Reversible Response Execution', () => {
  let adminId: string;
  let targetUserId: string;
  let incidentCaseId: string;
  let playbookId: string;
  let grantId: string;

  beforeAll(async () => {
    await prisma.systemSetting.upsert({
      where: { setting_key: 'SOC_RESPONSE_EMERGENCY_FREEZE' },
      update: { setting_value: 'FALSE' },
      create: { setting_key: 'SOC_RESPONSE_EMERGENCY_FREEZE', setting_value: 'FALSE' }
    });

    // Setup users
    const admin = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@test.com`,
        full_name: 'Test Admin',
        account_type: 'Individual',
        role: 'SOC_SUPERVISOR',
        status: 'Verified',
      }
    });
    adminId = admin.id;

    const targetUser = await prisma.user.create({
      data: {
        email: `target-${Date.now()}@test.com`,
        full_name: 'Target User',
        account_type: 'Individual',
        role: 'Renter',
        status: 'Verified',
      }
    });
    targetUserId = targetUser.id;

    const event = await prisma.securityEvent.create({
      data: {
        event_code: 'TEST_EVENT',
        source_type: 'SYSTEM_ERROR_LOG',
        source_record_id: 'test',
        security_domain: 'TRUST_AND_SAFETY',
        event_category: 'test',
        event_classification: 'OBSERVATION',
        severity: 'LOW',
        environment: 'TEST',
        lifecycle_type: 'TEST',
        idempotency_key: `evt-${Date.now()}`,
        occurred_at: new Date(),
        source_received_at: new Date(),
      }
    });

    const incident = await prisma.incidentCase.create({
      data: {
        title: 'Test Incident',
        summary: 'Test',
        status: 'OPEN',
        severity: 'LOW',
        originating_security_event: { connect: { id: event.id } },
        created_by_user: { connect: { id: adminId } },
        case_reference: `INC-20240101-${Math.random().toString(36).substring(2, 10).toUpperCase().padEnd(8, '0')}`,
        origin: 'SECURITY_EVENT',
        opened_at: new Date(),
      }
    });
    incidentCaseId = incident.id;

    const playbook = await prisma.securityResponsePlaybook.create({
      data: {
        playbook_id: `PB-${Date.now()}`,
        version: 1,
        name: 'Test Playbook',
        description: 'Test',
        status: 'ACTIVE',
        created_by: { connect: { id: adminId } },
      }
    });
    playbookId = playbook.playbook_id;

    const request = await prisma.securityResponseApprovalRequest.create({
      data: {
        requester_id: targetUserId, // Different user so admin can execute
        incident_case_id: incidentCaseId,
        playbook_id: playbookId,
        playbook_version: 1,
        justification: 'Test',
        status: SecurityApprovalStatus.APPROVED,
        idempotency_key: `req-${Date.now()}`,
        response_type: 'ACCOUNT_RESTRICTION',
        target_type: 'USER',
        target_id: targetUserId,
      }
    });

    const grant = await prisma.securityResponseApprovalGrant.create({
      data: {
        request_id: request.id,
        incident_case_id: incidentCaseId,
        playbook_id: playbookId,
        playbook_version: 1,
        grant_state: SecurityApprovalGrantState.AVAILABLE,
        expires_at: new Date(Date.now() + 1000 * 60 * 60),
      }
    });
    grantId = grant.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully execute ACCOUNT_RESTRICTION and suspend user', async () => {
    const execution = await executeSecurityResponse(adminId, {
      incident_case_id: incidentCaseId,
      playbook_id: playbookId,
      playbook_version: 1,
      approval_grant_id: grantId,
      response_type: SecurityResponseActionType.ACCOUNT_RESTRICTION,
      target_type: 'USER',
      target_id: targetUserId,
      idempotency_key: `exec-${Date.now()}`
    });

    expect(execution).toBeDefined();
    expect(execution.status).toBe(SecurityExecutionStatus.SUCCEEDED);
    expect(execution.actions.length).toBe(1);
    expect(execution.actions[0].action_type).toBe('ACCOUNT_RESTRICTION');

    const updatedUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    expect(updatedUser?.status).toBe('Suspended');

    const consumedGrant = await prisma.securityResponseApprovalGrant.findUnique({ where: { id: grantId } });
    expect(consumedGrant?.grant_state).toBe(SecurityApprovalGrantState.CONSUMED);
  });

  it('should successfully rollback ACCOUNT_RESTRICTION', async () => {
    // Find the execution we just made
    const execution = await prisma.securityResponseExecution.findFirst({
      where: { target_id: targetUserId, response_type: 'ACCOUNT_RESTRICTION' }
    });

    const rolledBack = await rollbackSecurityResponse(adminId, execution!.id);

    expect(rolledBack.status).toBe(SecurityExecutionStatus.ROLLED_BACK);

    const updatedUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    expect(updatedUser?.status).toBe('Verified'); // Or whatever the original before_state was
  });
});
